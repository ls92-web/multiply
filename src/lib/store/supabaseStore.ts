"use client";

import { getSupabaseBrowserClient } from "../supabase/client";
import {
  AttemptRecord,
  ChildProfile,
  FactMastery,
  GameMode,
  MasteryState,
  SessionSummary,
} from "../types";
import { DataStore } from "./types";

interface GameSessionRow {
  id: string;
  child_id: string;
  mode: GameMode;
  tables: number[];
  started_at: string;
  ended_at: string | null;
  total_questions: number;
  correct_count: number;
  points_earned: number;
  best_streak_in_session: number;
}

interface QuestionAttemptRow {
  id: string;
  session_id: string;
  fact_id: string;
  mode: GameMode;
  missing_slot: "a" | "b" | "product";
  user_answer: number | null;
  correct: boolean;
  independent: boolean;
  response_time_ms: number;
  is_retry_after_reveal: boolean;
  created_at: string;
}

/**
 * Supabase-backed implementation of DataStore. This is code-complete
 * against the schema in /supabase/migrations, but has not been exercised
 * against a live project in this environment (no credentials were
 * available while building). See README "Connecting a real Supabase
 * project" before relying on it, and re-run the test matrix once
 * connected. Point-awarding attempts go through the `apply_attempt`
 * Postgres function so scoring and duplicate-prevention happen on the
 * server, never trusting values computed in the browser.
 */

interface ChildRow {
  id: string;
  parent_id: string;
  name: string;
  avatar_color: string;
  avatar_character: string;
  avatar_photo_data_url: string | null;
  points: number;
  sound_on: boolean;
  last_tables: number[];
  best_streak: number;
  best_beatclock: number;
  created_at: string;
}

function rowToProfile(row: ChildRow): ChildProfile {
  return {
    id: row.id,
    name: row.name,
    avatar: {
      color: row.avatar_color as ChildProfile["avatar"]["color"],
      character: row.avatar_character as ChildProfile["avatar"]["character"],
      photoDataUrl: row.avatar_photo_data_url,
    },
    createdAt: row.created_at,
    points: row.points,
    soundOn: row.sound_on,
    lastTables: row.last_tables ?? [],
    bests: { longestStreak: row.best_streak, beatClockScore: row.best_beatclock },
  };
}

function profileToRow(profile: ChildProfile, parentId: string): Omit<ChildRow, "created_at"> {
  return {
    id: profile.id,
    parent_id: parentId,
    name: profile.name,
    avatar_color: profile.avatar.color,
    avatar_character: profile.avatar.character,
    avatar_photo_data_url: profile.avatar.photoDataUrl ?? null,
    points: profile.points,
    sound_on: profile.soundOn,
    last_tables: profile.lastTables,
    best_streak: profile.bests.longestStreak,
    best_beatclock: profile.bests.beatClockScore,
  };
}

interface MasteryRow {
  child_id: string;
  fact_id: string;
  attempts: number;
  correct: number;
  independent_correct: number;
  independent_correct_streak: number;
  sessions_seen_correct_in: string[];
  last_outcome_correct: boolean | null;
  mastery: MasteryState;
  needs_practice: boolean;
  updated_at: string;
}

function rowToMastery(row: MasteryRow): FactMastery {
  return {
    factId: row.fact_id,
    attempts: row.attempts,
    correct: row.correct,
    independentCorrect: row.independent_correct,
    independentCorrectStreak: row.independent_correct_streak,
    sessionsSeenCorrectIn: row.sessions_seen_correct_in ?? [],
    lastOutcomeCorrect: row.last_outcome_correct,
    mastery: row.mastery,
    needsPractice: row.needs_practice,
    updatedAt: row.updated_at,
  };
}

async function currentUserId(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not signed in.");
  return data.user.id;
}

export const supabaseStore: DataStore = {
  backend: "supabase",

  async listProfiles() {
    const supabase = getSupabaseBrowserClient();
    const parentId = await currentUserId();
    const { data, error } = await supabase
      .from("children")
      .select("*")
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data as ChildRow[]).map(rowToProfile);
  },

  async getProfile(id) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.from("children").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? rowToProfile(data as ChildRow) : null;
  },

  async saveProfile(profile) {
    const supabase = getSupabaseBrowserClient();
    const parentId = await currentUserId();
    const { error } = await supabase
      .from("children")
      .upsert(profileToRow(profile, parentId));
    if (error) throw error;
  },

  async deleteProfile(id) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("children").delete().eq("id", id);
    if (error) throw error;
  },

  async getMasteryMap(profileId) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("fact_mastery")
      .select("*")
      .eq("child_id", profileId);
    if (error) throw error;
    const map: Record<string, FactMastery> = {};
    for (const row of data as MasteryRow[]) {
      map[row.fact_id] = rowToMastery(row);
    }
    return map;
  },

  async saveMastery(profileId, mastery) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("fact_mastery").upsert({
      child_id: profileId,
      fact_id: mastery.factId,
      attempts: mastery.attempts,
      correct: mastery.correct,
      independent_correct: mastery.independentCorrect,
      independent_correct_streak: mastery.independentCorrectStreak,
      sessions_seen_correct_in: mastery.sessionsSeenCorrectIn,
      last_outcome_correct: mastery.lastOutcomeCorrect,
      mastery: mastery.mastery,
      needs_practice: mastery.needsPractice,
      updated_at: mastery.updatedAt,
    });
    if (error) throw error;
  },

  async createSession(session) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("game_sessions").insert({
      id: session.id,
      child_id: session.profileId,
      mode: session.mode,
      tables: session.tables,
      started_at: session.startedAt,
      ended_at: session.endedAt,
      total_questions: session.totalQuestions,
      correct_count: session.correctCount,
      points_earned: session.pointsEarned,
      best_streak_in_session: session.bestStreakInSession,
    });
    if (error) throw error;
  },

  async updateSession(session) {
    const supabase = getSupabaseBrowserClient();
    // Ending a session triggers the server-computed completion bonus (see
    // finish_session() in supabase/migrations) rather than trusting a
    // client-supplied points_earned/best_streak total.
    const { error } = await supabase.rpc("finish_session", {
      p_session_id: session.id,
      p_best_streak_in_session: session.bestStreakInSession,
    });
    if (error) throw error;
  },

  async getSessions(profileId) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("child_id", profileId)
      .order("started_at", { ascending: false });
    if (error) throw error;
    return (data as GameSessionRow[] ?? []).map((row) => ({
      id: row.id,
      profileId: row.child_id,
      mode: row.mode,
      tables: row.tables,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      totalQuestions: row.total_questions,
      correctCount: row.correct_count,
      pointsEarned: row.points_earned,
      bestStreakInSession: row.best_streak_in_session,
    })) as SessionSummary[];
  },

  async addAttempt(attempt) {
    const supabase = getSupabaseBrowserClient();
    // Server-side RPC: the server derives correctness itself from fact_id
    // + missing_slot (never trusts attempt.correct/independent from the
    // client), prevents duplicate point awards via a primary-key conflict
    // on attempt id, and atomically updates mastery + session + points.
    const { error } = await supabase.rpc("apply_attempt", {
      p_attempt_id: attempt.id,
      p_session_id: attempt.sessionId,
      p_fact_id: attempt.factId,
      p_mode: attempt.mode,
      p_missing_slot: attempt.missingSlot,
      p_user_answer: attempt.userAnswer,
      p_response_time_ms: attempt.responseTimeMs,
    });
    if (error) throw error;
  },

  async getAttempts(profileId) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("question_attempts")
      .select("*, game_sessions!inner(child_id)")
      .eq("game_sessions.child_id", profileId);
    if (error) throw error;
    return (data as QuestionAttemptRow[] ?? []).map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      factId: row.fact_id,
      mode: row.mode,
      missingSlot: row.missing_slot,
      userAnswer: row.user_answer,
      correct: row.correct,
      independent: row.independent,
      responseTimeMs: row.response_time_ms,
      isRetryAfterReveal: row.is_retry_after_reveal,
      createdAt: row.created_at,
    })) as AttemptRecord[];
  },
};
