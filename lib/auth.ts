import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export {
  generatePassword,
  hashPassword,
  verifyPassword,
} from "@/lib/password";

// Re-export the client-safe identity helpers so server code can import from a
// single place; client components should import from "@/lib/identity" directly.
export {
  IDENTITIES,
  PASSWORD_TIERS,
  identityDef,
  isValidIdentity,
  isGeneratedIdentity,
  validateUsername,
  type IdentityDef,
} from "@/lib/identity";

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 30;

// --- password generation & hashing -----------------------------------------

// --- sessions ---------------------------------------------------------------

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookies().delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }
  return session.user;
}
