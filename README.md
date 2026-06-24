# Things AI Can't Do

A community catalog of things AI can't do. Anyone can ask a question, anyone can answer.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Prisma + Postgres** for storage (Neon/Supabase; dev/prod parity)
- **Server Actions** for posting questions and answers — no separate API layer
- **Anti-abuse**: per-IP rate limiting, honeypot, signed form-timing tokens,
  link/length/duplicate filters (`lib/ratelimit.ts`, `formtoken.ts`,
  `moderation.ts`)

## Getting started

You need a Postgres URL (free at [neon.tech](https://neon.tech)). See
[DEPLOY.md](./DEPLOY.md) for the full walkthrough.

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, DIRECT_URL, FORM_SECRET
npx prisma migrate deploy     # create the schema
npm run db:seed               # optional: add example questions
npm run dev                   # http://localhost:3000
```

## Project layout

```
app/
  layout.tsx              # shell: header, footer, global styles
  page.tsx                # home: ask form + question list
  questions/[id]/page.tsx # question detail + answers + answer form
  globals.css
lib/
  prisma.ts               # Prisma client singleton
  actions.ts              # createQuestion / createAnswer server actions
prisma/
  schema.prisma           # Question + Answer models
  seed.mjs                # example data
```

## Next steps (not in this MVP)

- User accounts / login
- Upvotes and "best answer"
- Tags and search
- Rate limiting / spam protection
- Move SQLite → Postgres for production
