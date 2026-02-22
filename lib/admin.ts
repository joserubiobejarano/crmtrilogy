/**
 * Admin whitelist: when ADMIN_EMAILS is set, only those emails can access the app.
 * Comma-separated list, e.g. ADMIN_EMAILS="a@x.com,b@x.com"
 * When unset, any authenticated Supabase user has access.
 */
function getAdminEmails(): string[] | null {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw || typeof raw !== "string") return null;
  const list = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.length > 0 ? list : null;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  if (!admins) return true; // no whitelist = any authenticated user is allowed
  return admins.includes(email.trim().toLowerCase());
}
