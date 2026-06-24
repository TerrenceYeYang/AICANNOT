// Lightweight content checks for posted questions/answers.

export const LIMITS = {
  titleMin: 3,
  titleMax: 600,
  bodyMax: 5000,
  answerMin: 1,
  answerMax: 5000,
  maxLinks: 2,
};

const LINK_RE =
  /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+\.(?:com|net|org|io|co|ru|cn|xyz|top|info|biz|click|link|shop|app|dev)\b)/gi;

export function countLinks(text: string): number {
  const m = text.match(LINK_RE);
  return m ? m.length : 0;
}

/** Returns an error string, or null if the content passes. */
export function validateQuestion(title: string, body: string): string | null {
  if (title.length < LIMITS.titleMin)
    return `Question is too short (min ${LIMITS.titleMin} characters).`;
  if (title.length > LIMITS.titleMax)
    return `Question is too long (max ${LIMITS.titleMax} characters).`;
  if (body.length > LIMITS.bodyMax)
    return `Details are too long (max ${LIMITS.bodyMax} characters).`;
  if (countLinks(title) + countLinks(body) > LIMITS.maxLinks)
    return `Too many links — at most ${LIMITS.maxLinks} allowed.`;
  return null;
}

export function validateAnswer(body: string): string | null {
  if (body.length < LIMITS.answerMin) return "Answer can't be empty.";
  if (body.length > LIMITS.answerMax)
    return `Answer is too long (max ${LIMITS.answerMax} characters).`;
  if (countLinks(body) > LIMITS.maxLinks)
    return `Too many links — at most ${LIMITS.maxLinks} allowed.`;
  return null;
}
