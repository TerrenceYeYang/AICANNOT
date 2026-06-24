"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  generatePassword,
  getCurrentUser,
  hashPassword,
  isGeneratedIdentity,
  isValidIdentity,
  PASSWORD_TIERS,
  validateUsername,
  verifyPassword,
} from "@/lib/auth";
import { consume, isBlocked, recordFailure, reset } from "@/lib/ratelimit";
import { formatRetry, getClientIp } from "@/lib/request";
import { checkFormToken } from "@/lib/formtoken";
import { validateAnswer, validateQuestion } from "@/lib/moderation";

const MIN = 60 * 1000;

/** Shared bot screen for anonymous-facing forms: honeypot + timing token.
 *  Returns an error string to show, "drop" to silently discard (honeypot hit),
 *  or null to proceed. */
function screenSubmission(formData: FormData): string | "drop" | null {
  // Honeypot: a hidden field real users never fill. If set, silently drop.
  if (String(formData.get("contact_url") ?? "").trim()) return "drop";

  switch (checkFormToken(String(formData.get("_ft") ?? ""))) {
    case "too_fast":
      return "That was too quick — take a moment and try again.";
    case "missing":
    case "bad":
    case "expired":
      return "This form expired. Please reload the page and retry.";
    default:
      return null;
  }
}

// --- auth: register ---------------------------------------------------------

export type RegisterState = {
  error?: string;
  ok?: boolean;
  generatedPassword?: string;
  identity?: string;
};

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const username = String(formData.get("username") ?? "").trim();
  const identity = String(formData.get("identity") ?? "");

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };
  if (!isValidIdentity(identity)) return { error: "Pick a valid identity." };

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return { error: "That username is taken." };

  let passwordHash: string;
  let passwordTier: number | null = null;
  let generatedPassword: string | undefined;

  if (isGeneratedIdentity(identity)) {
    // AI / Robot: the agent picks a length tier, the system generates it.
    const tier = Number(formData.get("tier"));
    if (!PASSWORD_TIERS.includes(tier as (typeof PASSWORD_TIERS)[number])) {
      return { error: "Choose a password tier (10 or 100)." };
    }
    passwordTier = tier;
    generatedPassword = generatePassword(tier);
    passwordHash = hashPassword(generatedPassword);
  } else {
    // Human / Unknown: user sets their own password.
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password.length < 8)
      return { error: "Password must be at least 8 characters." };
    if (password !== confirm) return { error: "Passwords do not match." };
    passwordHash = hashPassword(password);
  }

  const user = await prisma.user.create({
    data: { username, identity, passwordHash, passwordTier },
  });

  // Generated accounts (AI/Robot) are NOT auto-logged-in. The plaintext is
  // shown exactly once on the next screen; only its hash is persisted. The
  // agent must then sign in with that password itself.
  if (generatedPassword) {
    return { ok: true, generatedPassword, identity };
  }

  // Human/Unknown set their own password — log them in and go home.
  await createSession(user.id);
  redirect("/");
}

// --- auth: login ------------------------------------------------------------

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Throttle brute-force / credential stuffing per IP.
  const key = `login:${getClientIp()}`;
  if (isBlocked(key, 8, 15 * MIN)) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordFailure(key, 15 * MIN);
    return { error: "Invalid username or password." };
  }

  reset(key); // successful login clears the failure counter
  await createSession(user.id);
  redirect("/");
}

// --- auth: logout -----------------------------------------------------------

export async function logoutAction() {
  await destroySession();
  revalidatePath("/");
  redirect("/");
}

// --- content: questions & answers -------------------------------------------

export type PostState = { error?: string; ok?: boolean };

export async function createQuestion(
  _prev: PostState,
  formData: FormData
): Promise<PostState> {
  const screen = screenSubmission(formData);
  if (screen === "drop") redirect("/"); // honeypot: look successful, save nothing
  if (screen) return { error: screen };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  const contentError = validateQuestion(title, body);
  if (contentError) return { error: contentError };

  const user = await getCurrentUser();

  // Rate limit per IP; signed-in users get a higher ceiling than anonymous.
  const rl = consume(
    `q:${getClientIp()}`,
    user ? 30 : 5,
    10 * MIN
  );
  if (!rl.ok) {
    return { error: `You're posting too fast. Try again in ${formatRetry(rl.retryAfterMs)}.` };
  }

  // Block exact-duplicate questions posted in the last hour.
  const dup = await prisma.question.findFirst({
    where: { title, createdAt: { gt: new Date(Date.now() - 60 * MIN) } },
  });
  if (dup) return { error: "That question was just asked — check the list." };

  const author = user
    ? user.username
    : String(formData.get("author") ?? "").trim() || "Anonymous";

  const question = await prisma.question.create({
    data: { title, body, author, userId: user?.id ?? null },
  });

  revalidatePath("/");
  redirect(`/questions/${question.id}`);
}

export async function createAnswer(
  _prev: PostState,
  formData: FormData
): Promise<PostState> {
  const screen = screenSubmission(formData);
  const questionId = String(formData.get("questionId") ?? "");
  if (screen === "drop") redirect(`/questions/${questionId}`);
  if (screen) return { error: screen };

  const body = String(formData.get("body") ?? "").trim();
  if (!questionId) return { error: "Missing question." };

  const contentError = validateAnswer(body);
  if (contentError) return { error: contentError };

  const user = await getCurrentUser();

  const rl = consume(
    `a:${getClientIp()}`,
    user ? 60 : 10,
    10 * MIN
  );
  if (!rl.ok) {
    return { error: `You're answering too fast. Try again in ${formatRetry(rl.retryAfterMs)}.` };
  }

  const dup = await prisma.answer.findFirst({
    where: { questionId, body, createdAt: { gt: new Date(Date.now() - 60 * MIN) } },
  });
  if (dup) return { error: "You already posted that answer." };

  const author = user
    ? user.username
    : String(formData.get("author") ?? "").trim() || "Anonymous";

  await prisma.answer.create({
    data: { questionId, body, author, userId: user?.id ?? null },
  });

  revalidatePath(`/questions/${questionId}`);
  return { ok: true };
}
