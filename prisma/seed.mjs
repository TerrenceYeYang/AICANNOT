import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = [
  {
    title: "Reliably count the number of letters in a word",
    body: "Ask for the number of 'r's in 'strawberry' and it often gets it wrong.",
    author: "mira",
    answers: [
      {
        body: "It's a tokenization issue — the model doesn't see individual letters. Asking it to spell the word out letter by letter first usually fixes it.",
        author: "devon",
      },
    ],
  },
  {
    title: "Know what happened yesterday in the news",
    body: "Models have a knowledge cutoff and can't know recent events without tools.",
    author: "Anonymous",
    answers: [],
  },
  {
    title: "Give a truly random number",
    body: "It tends to favor certain numbers (like 37) when asked for a 'random' one.",
    author: "kai",
    answers: [],
  },
];

async function main() {
  for (const q of seed) {
    await prisma.question.create({
      data: {
        title: q.title,
        body: q.body,
        author: q.author,
        answers: { create: q.answers },
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
