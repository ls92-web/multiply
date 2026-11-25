import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseIsConfigured } from "./env";

/**
 * Server-side Supabase client for use in Server Components / Route
 * Handlers once a real project is connected. Never imports or exposes the
 * service-role key — RLS on the anon/auth session is what protects data.
 */
export async function getSupabaseServerClient() {
  if (!supabaseIsConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies can't be set;
            // safe to ignore because middleware refreshes the session.
          }
        },
      },
    },
  );
}
