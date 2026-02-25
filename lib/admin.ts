import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin whitelist: when ADMIN_EMAILS is set, only those emails can access the app.
 * When app_users table has rows, that is the source of truth instead.
 * When unset/empty, any authenticated Supabase user has access.
 */
export function getAdminEmails(): string[] | null {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw || typeof raw !== "string") return null;
  const list = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.length > 0 ? list : null;
}

/** Sync check using only env (e.g. login page before session exists). */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  if (!admins) return true; // no whitelist = any authenticated user is allowed
  return admins.includes(email.trim().toLowerCase());
}

/**
 * Async check: when app_users has rows, only those emails are allowed; otherwise fall back to ADMIN_EMAILS.
 * Use in middleware (has Supabase client and session).
 */
export async function isAdminEmailAsync(
  supabase: SupabaseClient,
  email: string | null | undefined
): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const { data: list } = await supabase.from("app_users").select("email");
  if (list && list.length > 0) {
    return list.some((r) => (r.email ?? "").trim().toLowerCase() === normalized);
  }
  const admins = getAdminEmails();
  if (!admins) return true;
  return admins.includes(normalized);
}
