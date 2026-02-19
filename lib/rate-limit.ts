/**
 * In-memory rate limiter for the public form (by IP).
 * For multi-instance deployments, replace with Redis or similar.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10;

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

function prune(key: string, now: number) {
  const e = store.get(key);
  if (e && e.resetAt < now) store.delete(key);
}

export function checkFormRateLimit(identifier: string): { allowed: boolean } {
  const now = Date.now();
  prune(identifier, now);

  const entry = store.get(identifier);
  if (!entry) {
    store.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false };
  }
  entry.count += 1;
  return { allowed: true };
}

/**
 * Returns a best-effort client identifier (e.g. IP) from Next.js headers.
 */
export function getClientIdentifier(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
