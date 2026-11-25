"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseIsConfigured } from "./env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser Supabase client. Only call this when `supabaseIsConfigured()` is
 * true — in local demo mode there is no project to connect to.
 */
export function getSupabaseBrowserClient() {
  if (!supabaseIsConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or stay in local demo mode.",
    );
  }
  if (!cached) {
    cached = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return cached;
}
