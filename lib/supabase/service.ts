import { createClient } from "@supabase/supabase-js";

/**
 * Service role client - bypasses RLS. Use only for server-side operations
 * that must run without auth (e.g. public form submission).
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for service role client");
  }
  return createClient(url, key);
}
