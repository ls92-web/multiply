import { supabaseIsConfigured } from "../supabase/env";
import { localStore } from "./localStore";
import { supabaseStore } from "./supabaseStore";
import { DataStore } from "./types";

/**
 * Picks the Supabase-backed store when credentials are present in the
 * environment, otherwise falls back to the local-demo store. This is the
 * only place that decides which backend is active. Importing
 * supabaseStore is safe even with no credentials: it never constructs a
 * Supabase client at module scope, only inside each call.
 */
export function getStore(): DataStore {
  return supabaseIsConfigured() ? supabaseStore : localStore;
}

export function isDemoMode(): boolean {
  return !supabaseIsConfigured();
}

export type { DataStore } from "./types";
