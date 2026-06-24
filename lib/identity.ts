// Client-safe identity definitions and validation. No server-only imports here
// (no prisma, no next/headers) so this module can be used in client components.

export type IdentityDef = {
  value: string;
  label: string;
  emoji: string;
  /** true => password is system-generated and the user picks a length tier */
  generated: boolean;
};

export const IDENTITIES: IdentityDef[] = [
  { value: "human", label: "Human", emoji: "🧑", generated: false },
  { value: "ai", label: "AI", emoji: "🤖", generated: true },
  { value: "robot", label: "Robot", emoji: "⚙️", generated: true },
  { value: "unknown", label: "Unknown", emoji: "❓", generated: false },
];

export const PASSWORD_TIERS = [10, 100] as const;

export function identityDef(
  value: string | null | undefined
): IdentityDef | null {
  return IDENTITIES.find((i) => i.value === value) ?? null;
}

export function isValidIdentity(value: string): boolean {
  return IDENTITIES.some((i) => i.value === value);
}

export function isGeneratedIdentity(value: string): boolean {
  return identityDef(value)?.generated ?? false;
}

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

export function validateUsername(username: string): string | null {
  if (!username) return "Username is required.";
  if (!USERNAME_RE.test(username))
    return "Username must be 3–20 characters, letters/numbers/_/- only.";
  return null;
}
