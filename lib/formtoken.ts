import { createHmac, timingSafeEqual } from "crypto";

// Used to sign the "form rendered at" timestamp so the server can reject
// submissions that are suspiciously fast (bots) or stale (replays), without
// trusting a client-supplied value. Set FORM_SECRET in production.
const SECRET = process.env.FORM_SECRET ?? "dev-insecure-form-secret-change-me";

export const MIN_FILL_MS = 1500; // submitted faster than this => almost certainly a bot
export const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000; // 2h

function sign(ts: string): string {
  return createHmac("sha256", SECRET).update(ts).digest("hex");
}

export function issueFormToken(): string {
  const ts = Date.now().toString();
  return `${ts}.${sign(ts)}`;
}

export type FormTokenResult = "ok" | "missing" | "bad" | "too_fast" | "expired";

export function checkFormToken(token: string): FormTokenResult {
  if (!token) return "missing";
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return "bad";
  const expected = sign(ts);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "bad";
  const elapsed = Date.now() - Number(ts);
  if (elapsed < MIN_FILL_MS) return "too_fast";
  if (elapsed > MAX_FORM_AGE_MS) return "expired";
  return "ok";
}
