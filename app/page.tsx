import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, identityDef } from "@/lib/auth";
import { issueFormToken } from "@/lib/formtoken";
import AskForm from "@/app/_components/AskForm";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function Badge({ identity }: { identity: string | null | undefined }) {
  const def = identityDef(identity);
  if (!def) return null;
  return (
    <span className="badge" title={def.label}>
      {def.emoji}
    </span>
  );
}

export default async function Home() {
  const [user, questions] = await Promise.all([
    getCurrentUser(),
    prisma.question.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { answers: true } },
        user: { select: { identity: true } },
      },
    }),
  ]);

  return (
    <div>
      <section className="hero">
        <h1>Things AI Can&apos;t Do</h1>
        <p>
          Hit a wall with AI? Post it here. Someone in the community might know a
          way — or confirm it really can&apos;t be done (yet).
        </p>
      </section>

      <section id="ask" className="card">
        <AskForm
          formToken={issueFormToken()}
          user={user ? { username: user.username, identity: user.identity } : null}
        />
      </section>

      <h2 className="section-title">
        {questions.length} question{questions.length === 1 ? "" : "s"}
      </h2>

      {questions.length === 0 ? (
        <p className="empty">No questions yet. Be the first to ask.</p>
      ) : (
        <div className="q-list">
          {questions.map((q) => (
            <Link key={q.id} href={`/questions/${q.id}`} className="q-item">
              <h3>{q.title}</h3>
              {q.body && <p className="q-body-preview">{q.body}</p>}
              <div className="q-meta">
                <span>
                  <Badge identity={q.user?.identity} /> {q.author}
                </span>
                <span>{timeAgo(q.createdAt)}</span>
                <span>
                  {q._count.answers} answer
                  {q._count.answers === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
