import { headers } from "next/headers";

/** Best-effort client IP. Behind Cloudflare/Vercel x-forwarded-for is set;
 *  locally there's no proxy header so everything shares the "local" bucket. */
export function getClientIp(): string {
  const h = headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "local";
}

export function formatRetry(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.ceil(s / 60)} min`;
}
