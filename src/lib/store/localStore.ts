"use client";

import {
  AttemptRecord,
  ChildProfile,
  FactMastery,
  SessionSummary,
} from "../types";
import { DataStore } from "./types";

const DB_KEY = "multiply.demo.db.v1";
const MAX_ATTEMPTS_STORED = 4000;

interface DemoDb {
  profiles: Record<string, ChildProfile>;
  mastery: Record<string, Record<string, FactMastery>>;
  sessions: Record<string, SessionSummary>;
  attempts: AttemptRecord[];
}

function emptyDb(): DemoDb {
  return { profiles: {}, mastery: {}, sessions: {}, attempts: [] };
}

function readDb(): DemoDb {
  if (typeof window === "undefined") return emptyDb();
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw) as DemoDb;
    return {
      profiles: parsed.profiles ?? {},
      mastery: parsed.mastery ?? {},
      sessions: parsed.sessions ?? {},
      attempts: parsed.attempts ?? [],
    };
  } catch {
    return emptyDb();
  }
}

function writeDb(db: DemoDb) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/**
 * localStorage-backed implementation of DataStore. This is the explicitly
 * labeled "local demo mode" described in the project README: progress is
 * real and persists across reloads, but it lives only in this browser and
 * is not validated by a server. See src/lib/store/supabaseStore.ts for the
 * server-backed implementation used once Supabase credentials are set.
 */
export const localStore: DataStore = {
  backend: "local-demo",

  async listProfiles() {
    return Object.values(readDb().profiles).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  },

  async getProfile(id) {
    return readDb().profiles[id] ?? null;
  },

  async saveProfile(profile) {
    const db = readDb();
    db.profiles[profile.id] = profile;
    writeDb(db);
  },

  async deleteProfile(id) {
    const db = readDb();
    delete db.profiles[id];
    delete db.mastery[id];
    const sessionIdsToRemove = new Set(
      Object.values(db.sessions)
        .filter((s) => s.profileId === id)
        .map((s) => s.id),
    );
    for (const sessionId of sessionIdsToRemove) {
      delete db.sessions[sessionId];
    }
    db.attempts = db.attempts.filter((a) => !sessionIdsToRemove.has(a.sessionId));
    writeDb(db);
  },

  async getMasteryMap(profileId) {
    return readDb().mastery[profileId] ?? {};
  },

  async saveMastery(profileId, mastery) {
    const db = readDb();
    if (!db.mastery[profileId]) db.mastery[profileId] = {};
    db.mastery[profileId][mastery.factId] = mastery;
    writeDb(db);
  },

  async createSession(session) {
    const db = readDb();
    db.sessions[session.id] = session;
    writeDb(db);
  },

  async updateSession(session) {
    const db = readDb();
    db.sessions[session.id] = session;
    writeDb(db);
  },

  async getSessions(profileId) {
    return Object.values(readDb().sessions)
      .filter((s) => s.profileId === profileId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  },

  async addAttempt(attempt) {
    const db = readDb();
    db.attempts.push(attempt);
    if (db.attempts.length > MAX_ATTEMPTS_STORED) {
      db.attempts = db.attempts.slice(-MAX_ATTEMPTS_STORED);
    }
    writeDb(db);
  },

  async getAttempts(profileId) {
    const db = readDb();
    const sessionIds = new Set(
      Object.values(db.sessions)
        .filter((s) => s.profileId === profileId)
        .map((s) => s.id),
    );
    return db.attempts.filter((a) => sessionIds.has(a.sessionId));
  },
};

export function clearLocalDemoData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DB_KEY);
}
