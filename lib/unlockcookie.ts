// Tracks which locked answers this browser has privately unlocked, without
// needing an account or a wallet signature. Mirrors the HMAC sign/verify
// pattern in lib/formtoken.ts, but the payload is a list of answer ids
// instead of a timestamp.

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.UNLOCK_SECRET ?? "dev-insecure-unlock-secret-change-me";
export const UNLOCK_COOKIE = "punlk";
const MAX_IDS = 200; // bound cookie size; oldest dropped first

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

function parse(raw: string | undefined): string[] {
  if (!raw) return [];
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return [];
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return [];
  try {
    const ids = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function serialize(ids: string[]): string {
  const payload = Buffer.from(JSON.stringify(ids)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Read-only: answer ids this browser has privately unlocked. */
export function getPrivatelyUnlockedIds(): string[] {
  return parse(cookies().get(UNLOCK_COOKIE)?.value);
}

/** Mutates the response cookie to add one answer id. Call from a Server Action. */
export function addPrivateUnlock(answerId: string): void {
  const ids = getPrivatelyUnlockedIds();
  if (ids.includes(answerId)) return;
  ids.push(answerId);
  while (ids.length > MAX_IDS) ids.shift();
  cookies().set(UNLOCK_COOKIE, serialize(ids), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });
}
