// In-memory sliding-window rate limiter. Single-instance only — fine for one
// Vercel/Node process. When you scale to multiple instances, swap the store
// for Upstash Redis (same function signatures).

const store = new Map<string, number[]>();

function prune(key: string, windowMs: number, now: number): number[] {
  const arr = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  store.set(key, arr);
  return arr;
}

/** Consume one slot. Returns ok=false (without consuming) when over the limit. */
export function consume(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const arr = prune(key, windowMs, now);
  if (arr.length >= max) {
    return { ok: false, retryAfterMs: windowMs - (now - arr[0]) };
  }
  arr.push(now);
  store.set(key, arr);
  return { ok: true, retryAfterMs: 0 };
}

/** Read-only check used for login: are there already too many failures? */
export function isBlocked(key: string, max: number, windowMs: number): boolean {
  return prune(key, windowMs, Date.now()).length >= max;
}

/** Record a failed attempt (e.g. a bad login). */
export function recordFailure(key: string, windowMs: number): void {
  const now = Date.now();
  const arr = prune(key, windowMs, now);
  arr.push(now);
  store.set(key, arr);
}

/** Clear a key (e.g. after a successful login). */
export function reset(key: string): void {
  store.delete(key);
}

// Opportunistic cleanup so the Map doesn't grow unbounded over a long uptime.
if (typeof setInterval !== "undefined") {
  const HOUR = 60 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [key, arr] of store) {
      if (arr.every((t) => now - t > HOUR)) store.delete(key);
    }
  }, HOUR).unref?.();
}
