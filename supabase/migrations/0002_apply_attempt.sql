-- Server-side answer validation and scoring.
--
-- The client never gets to assert "this was correct" or "award me N
-- points" directly: it sends the raw ingredients (which fact, which slot
-- was blanked, what the child typed) and this function independently
-- derives correctness, points, and the mastery/session/points updates.
-- Calling it twice with the same p_attempt_id is a no-op the second time
-- (idempotent via the question_attempts primary key), so a retried
-- network request can't double-award points.
create or replace function public.apply_attempt(
  p_attempt_id uuid,
  p_session_id uuid,
  p_fact_id text,
  p_mode text,
  p_missing_slot text,
  p_user_answer integer,
  p_response_time_ms integer
)
returns table (
  attempt_accepted boolean,
  correct boolean,
  points_awarded integer,
  new_total_points integer,
  streak_after integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child_id uuid;
  v_parent_id uuid;
  v_a integer;
  v_b integer;
  v_expected integer;
  v_correct boolean;
  v_independent boolean;
  v_is_retry boolean;
  v_inserted integer;
  v_streak integer := 0;
  v_base_points integer := 0;
  v_streak_bonus integer := 0;
  v_points integer := 0;
  v_mastery_row public.fact_mastery%rowtype;
  v_new_sessions text[];
  v_att record;
  v_new_total integer;
begin
  select s.child_id, c.parent_id
    into v_child_id, v_parent_id
    from public.game_sessions s
    join public.children c on c.id = s.child_id
    where s.id = p_session_id
    for update of s;

  if v_child_id is null then
    raise exception 'Session not found';
  end if;
  if v_parent_id <> auth.uid() then
    raise exception 'Not authorized for this session';
  end if;

  v_a := split_part(p_fact_id, 'x', 1)::integer;
  v_b := split_part(p_fact_id, 'x', 2)::integer;
  v_expected := case p_missing_slot
    when 'a' then v_a
    when 'b' then v_b
    else v_a * v_b
  end;
  v_correct := (p_user_answer is not null and p_user_answer = v_expected);
  v_independent := (p_mode <> 'pickit');

  select (fa.fact_id = p_fact_id and fa.correct = false)
    into v_is_retry
    from public.question_attempts fa
    where fa.session_id = p_session_id
    order by fa.created_at desc
    limit 1;
  v_is_retry := coalesce(v_is_retry, false);

  insert into public.question_attempts (
    id, session_id, fact_id, mode, missing_slot, user_answer, correct,
    independent, response_time_ms, is_retry_after_reveal
  ) values (
    p_attempt_id, p_session_id, p_fact_id, p_mode, p_missing_slot, p_user_answer,
    v_correct, v_independent, coalesce(p_response_time_ms, 0), v_is_retry
  )
  on conflict (id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    select c.points into v_new_total from public.children c where c.id = v_child_id;
    return query select false, v_correct, 0, v_new_total, 0;
    return;
  end if;

  -- Running independent-correct streak for this session, derived from
  -- stored history rather than trusted from the client.
  if v_correct and v_independent and not v_is_retry then
    v_streak := 1;
    for v_att in
      select correct, independent, is_retry_after_reveal
      from public.question_attempts
      where session_id = p_session_id and id <> p_attempt_id
      order by created_at desc
    loop
      exit when not (v_att.correct and v_att.independent and not v_att.is_retry_after_reveal);
      v_streak := v_streak + 1;
    end loop;
  else
    v_streak := 0;
  end if;

  if v_correct and not v_is_retry then
    v_base_points := case when v_independent then 10 else 5 end;
  end if;

  if v_correct and v_independent and not v_is_retry then
    if v_streak % 10 = 0 then
      v_streak_bonus := 30;
    elsif v_streak % 5 = 0 then
      v_streak_bonus := 15;
    end if;
  end if;

  v_points := v_base_points + v_streak_bonus;

  insert into public.fact_mastery (child_id, fact_id)
  values (v_child_id, p_fact_id)
  on conflict (child_id, fact_id) do nothing;

  select * into v_mastery_row
    from public.fact_mastery
    where child_id = v_child_id and fact_id = p_fact_id
    for update;

  v_new_sessions := v_mastery_row.sessions_seen_correct_in;

  if v_correct and v_independent and not v_is_retry then
    if not (p_session_id::text = any(v_new_sessions)) then
      v_new_sessions := array_append(v_new_sessions, p_session_id::text);
    end if;
    update public.fact_mastery
      set attempts = attempts + 1,
          correct = correct + 1,
          independent_correct = independent_correct + 1,
          independent_correct_streak = independent_correct_streak + 1,
          sessions_seen_correct_in = v_new_sessions,
          last_outcome_correct = true,
          needs_practice = false,
          mastery = case
            when independent_correct_streak + 1 >= 3 and array_length(v_new_sessions, 1) >= 2 then 'mastered'
            when independent_correct_streak + 1 >= 2 then 'developing'
            else 'learning'
          end,
          updated_at = now()
      where child_id = v_child_id and fact_id = p_fact_id;
  elsif v_correct then
    update public.fact_mastery
      set attempts = attempts + 1,
          correct = correct + 1,
          last_outcome_correct = true,
          mastery = case when mastery = 'new' then 'learning' else mastery end,
          updated_at = now()
      where child_id = v_child_id and fact_id = p_fact_id;
  else
    update public.fact_mastery
      set attempts = attempts + 1,
          independent_correct_streak = 0,
          needs_practice = true,
          last_outcome_correct = false,
          mastery = case when mastery = 'mastered' then 'developing' else 'learning' end,
          updated_at = now()
      where child_id = v_child_id and fact_id = p_fact_id;
  end if;

  update public.game_sessions
    set total_questions = total_questions + 1,
        correct_count = correct_count + (case when v_correct then 1 else 0 end),
        points_earned = points_earned + v_points,
        best_streak_in_session = greatest(best_streak_in_session, v_streak)
    where id = p_session_id;

  update public.children
    set points = points + v_points,
        best_streak = greatest(best_streak, v_streak)
    where id = v_child_id
    returning points into v_new_total;

  return query select true, v_correct, v_points, v_new_total, v_streak;
end;
$$;

revoke all on function public.apply_attempt(uuid, uuid, text, text, text, integer, integer) from public;
grant execute on function public.apply_attempt(uuid, uuid, text, text, text, integer, integer) to authenticated;

-- Session-completion bonus (20 pts, see POINTS.sessionCompleteBonus in
-- src/lib/engine/scoring.ts) plus personal-record bookkeeping, applied
-- once when a session ends.
create or replace function public.finish_session(
  p_session_id uuid,
  p_best_streak_in_session integer
)
returns table (new_total_points integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child_id uuid;
  v_parent_id uuid;
  v_total_questions integer;
  v_bonus integer := 0;
  v_new_total integer;
begin
  select s.child_id, c.parent_id, s.total_questions
    into v_child_id, v_parent_id, v_total_questions
    from public.game_sessions s
    join public.children c on c.id = s.child_id
    where s.id = p_session_id
    for update of s;

  if v_child_id is null then
    raise exception 'Session not found';
  end if;
  if v_parent_id <> auth.uid() then
    raise exception 'Not authorized for this session';
  end if;

  if v_total_questions > 0 then
    v_bonus := 20;
  end if;

  update public.game_sessions
    set ended_at = now(),
        points_earned = points_earned + v_bonus,
        best_streak_in_session = greatest(best_streak_in_session, p_best_streak_in_session)
    where id = p_session_id;

  update public.children
    set points = points + v_bonus,
        best_streak = greatest(best_streak, p_best_streak_in_session)
    where id = v_child_id
    returning points into v_new_total;

  return query select v_new_total;
end;
$$;

revoke all on function public.finish_session(uuid, integer) from public;
grant execute on function public.finish_session(uuid, integer) to authenticated;
