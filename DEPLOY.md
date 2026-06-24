# Deploying to Vercel + Neon Postgres

The app is now wired for **Postgres** (dev/prod parity) and **Vercel**. Follow
these steps once; afterwards every `git push` redeploys automatically.

## 1. Create a Postgres database (Neon, free)

1. Sign up at <https://neon.tech> and create a project.
2. In the project dashboard, copy **two** connection strings:
   - **Pooled** (host contains `-pooler`) → this is `DATABASE_URL`
   - **Direct** (no `-pooler`) → this is `DIRECT_URL`
   Both should end with `?sslmode=require`.

> Supabase works too — use its **Connection pooling** string for `DATABASE_URL`
> and the **direct** string for `DIRECT_URL`.

## 2. Set up locally (optional but recommended)

```bash
cp .env.example .env
# paste your Neon DATABASE_URL and DIRECT_URL into .env
# generate a real secret:
openssl rand -hex 32   # paste result as FORM_SECRET in .env

npx prisma migrate deploy   # creates the tables in your Neon DB
npm run db:seed             # optional: add example questions
npm run dev                 # http://localhost:3000, now on Postgres
```

## 3. Push to GitHub

```bash
git init
git add -A
git commit -m "Things AI Can't Do — initial app"
# create an empty repo on GitHub, then:
git remote add origin git@github.com:<you>/things-ai-cant-do.git
git push -u origin main
```

(`.env` and `*.db` are gitignored — secrets and the old SQLite file won't be
committed. The `prisma/migrations/` folder **is** committed and must be.)

## 4. Import into Vercel

1. <https://vercel.com/new> → import the GitHub repo. Framework auto-detects as
   Next.js; leave the build command as-is.
2. Add **Environment Variables** (Production + Preview):
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** URL |
   | `DIRECT_URL` | Neon **direct** URL |
   | `FORM_SECRET` | output of `openssl rand -hex 32` |
3. Deploy. The build runs `prisma migrate deploy` automatically, so the schema
   is applied on first deploy.

## 5. (Optional) Custom domain

Vercel → Project → **Domains** → add `yourdomain.com`. A domain costs ~$10–15/yr
(buy at Cloudflare/Namecheap or through Vercel). The free `*.vercel.app` URL
works immediately with no purchase.

---

## Notes / gotchas

- **Build applies migrations.** `npm run build` = `prisma generate && prisma
  migrate deploy && next build`. New migrations ship on the next deploy.
- **To change the schema later:** edit `prisma/schema.prisma`, then locally run
  `npm run migrate:dev -- --name <change>` to create a migration, commit it, and
  push. Don't use `db push` once migrations exist.
- **Rate limiting is in-memory** (single instance). Vercel may run multiple
  instances, so for real enforcement swap `lib/ratelimit.ts` for an Upstash
  Redis implementation (same function signatures — callers don't change).
- **Put Cloudflare in front** (optional) for network-level bot/DDoS protection.
