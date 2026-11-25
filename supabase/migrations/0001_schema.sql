-- MULTIPLY: core schema.
-- A "parent" is a Supabase Auth user (auth.users). Each parent owns zero or
-- more child profiles; a child has no login of their own. All gameplay data
-- hangs off a child profile and is scoped to its owning parent via RLS.

create extension if not exists "pgcrypto";

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  avatar_color text not null check (avatar_color in ('purple', 'blue', 'orange', 'pink', 'mint', 'yellow')),
  avatar_character text not null check (
    avatar_character in ('boy-short', 'boy-curly', 'boy-spiky', 'girl-ponytail', 'girl-pigtails', 'girl-long')
  ),
  -- Uploaded/captured profile photo as a data URL. Fine for a demo-scale
  -- project; a production deployment should move this to Supabase Storage
  -- (a signed object URL) instead of inlining image bytes in the database.
  avatar_photo_data_url text,
  points integer not null default 0 check (points >= 0),
  sound_on boolean not null default true,
  last_tables integer[] not null default '{}',
  best_streak integer not null default 0 check (best_streak >= 0),
  best_beatclock integer not null default 0 check (best_beatclock >= 0),
  created_at timestamptz not null default now()
);

create index if not exists children_parent_id_idx on public.children (parent_id);

-- One row per child per canonical fact (e.g. "6x7"; 6x7 and 7x6 share a row).
create table if not exists public.fact_mastery (
  child_id uuid not null references public.children (id) on delete cascade,
  fact_id text not null,
  attempts integer not null default 0,
  correct integer not null default 0,
  independent_correct integer not null default 0,
  independent_correct_streak integer not null default 0,
  sessions_seen_correct_in text[] not null default '{}',
  last_outcome_correct boolean,
  mastery text not null default 'new' check (mastery in ('new', 'learning', 'developing', 'mastered')),
  needs_practice boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (child_id, fact_id)
);

create index if not exists fact_mastery_child_id_idx on public.fact_mastery (child_id);
create index if not exists fact_mastery_needs_practice_idx
  on public.fact_mastery (child_id)
  where needs_practice;

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  mode text not null check (mode in ('recall', 'pickit', 'fillgap', 'beatclock', 'streak', 'tryagain')),
  tables integer[] not null default '{}',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_questions integer not null default 0,
  correct_count integer not null default 0,
  points_earned integer not null default 0,
  best_streak_in_session integer not null default 0
);

create index if not exists game_sessions_child_id_idx on public.game_sessions (child_id, started_at desc);

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  fact_id text not null,
  mode text not null,
  missing_slot text not null check (missing_slot in ('a', 'b', 'product')),
  user_answer integer,
  correct boolean not null,
  independent boolean not null,
  response_time_ms integer not null default 0,
  is_retry_after_reveal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists question_attempts_session_id_idx on public.question_attempts (session_id);

alter table public.children enable row level security;
alter table public.fact_mastery enable row level security;
alter table public.game_sessions enable row level security;
alter table public.question_attempts enable row level security;

-- children: a parent can fully manage only their own children's rows.
create policy "children_select_own" on public.children
  for select using (auth.uid() = parent_id);
create policy "children_insert_own" on public.children
  for insert with check (auth.uid() = parent_id);
create policy "children_update_own" on public.children
  for update using (auth.uid() = parent_id) with check (auth.uid() = parent_id);
create policy "children_delete_own" on public.children
  for delete using (auth.uid() = parent_id);

-- fact_mastery / game_sessions / question_attempts: scoped through the
-- owning child's parent_id. Direct writes are only ever performed by the
-- apply_attempt() function (security definer) or by the owning parent.
create policy "fact_mastery_select_own" on public.fact_mastery
  for select using (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  );
create policy "fact_mastery_write_own" on public.fact_mastery
  for all using (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  ) with check (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  );

create policy "game_sessions_select_own" on public.game_sessions
  for select using (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  );
create policy "game_sessions_write_own" on public.game_sessions
  for all using (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  ) with check (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  );

create policy "question_attempts_select_own" on public.question_attempts
  for select using (
    exists (
      select 1 from public.game_sessions s
      join public.children c on c.id = s.child_id
      where s.id = session_id and c.parent_id = auth.uid()
    )
  );
-- No direct insert/update/delete policy for question_attempts: all writes
-- go through apply_attempt(), which runs as security definer and checks
-- session ownership itself. This is what makes scores/points
-- server-validated rather than client-trusted.
