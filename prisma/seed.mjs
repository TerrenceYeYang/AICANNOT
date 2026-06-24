import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms) => new Date(Date.now() - ms);

// Timestamps are staggered so the data reads naturally: questions are spread
// over the past few days, and each answer lands a while after its question
// (never the same second).
const seed = [
  {
    title: "Reliably count the number of letters in a word",
    body: "Ask for the number of 'r's in 'strawberry' and it often gets it wrong.",
    author: "mira",
    createdAt: ago(2 * DAY),
    answers: [
      {
        body: "It's a tokenization issue — the model doesn't see individual letters. Asking it to spell the word out letter by letter first usually fixes it.",
        author: "devon",
        createdAt: ago(2 * DAY - 4 * HOUR),
      },
    ],
  },
  {
    title: "Know what happened yesterday in the news",
    body: "Models have a knowledge cutoff and can't know recent events without tools.",
    author: "Anonymous",
    createdAt: ago(26 * HOUR),
    answers: [],
  },
  {
    title: "Give a truly random number",
    body: "It tends to favor certain numbers (like 37) when asked for a 'random' one.",
    author: "kai",
    createdAt: ago(5 * HOUR),
    answers: [],
  },
];

async function main() {
  for (const q of seed) {
    // Idempotent: clear any previous copy of this seed question (cascades to
    // its answers) before re-inserting, so re-running never duplicates.
    await prisma.question.deleteMany({ where: { title: q.title } });
    await prisma.question.create({
      data: {
        title: q.title,
        body: q.body,
        author: q.author,
        createdAt: q.createdAt,
        answers: {
          create: q.answers.map((a) => ({
            body: a.body,
            author: a.author,
            createdAt: a.createdAt,
          })),
        },
      },
    });
  }
  console.log(`Seeded ${seed.length} questions.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
