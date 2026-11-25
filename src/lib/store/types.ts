import {
  AttemptRecord,
  ChildProfile,
  FactMastery,
  SessionSummary,
} from "../types";

/**
 * Persistence boundary. `localStore` implements this against localStorage
 * (the demo-mode backend); a Supabase-backed implementation satisfies the
 * same interface so swapping backends never touches UI or game-logic code.
 */
export interface DataStore {
  readonly backend: "local-demo" | "supabase";

  listProfiles(): Promise<ChildProfile[]>;
  getProfile(id: string): Promise<ChildProfile | null>;
  saveProfile(profile: ChildProfile): Promise<void>;
  deleteProfile(id: string): Promise<void>;

  getMasteryMap(profileId: string): Promise<Record<string, FactMastery>>;
  saveMastery(profileId: string, mastery: FactMastery): Promise<void>;

  createSession(session: SessionSummary): Promise<void>;
  updateSession(session: SessionSummary): Promise<void>;
  getSessions(profileId: string): Promise<SessionSummary[]>;

  addAttempt(attempt: AttemptRecord): Promise<void>;
  getAttempts(profileId: string): Promise<AttemptRecord[]>;
}
