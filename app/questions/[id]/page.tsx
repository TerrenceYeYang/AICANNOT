import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, identityDef } from "@/lib/auth";
import { issueFormToken } from "@/lib/formtoken";
import AnswerForm from "@/app/_components/AnswerForm";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

export default async function QuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const [user, question] = await Promise.all([
    getCurrentUser(),
    prisma.question.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { identity: true } },
        answers: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { identity: true } } },
        },
      },
    }),
  ]);

  if (!question) notFound();

  return (
    <div className="question-detail">
      <Link href="/" className="back-link">
        ← All questions
      </Link>

      <h1>{question.title}</h1>
      <div className="q-meta" style={{ marginBottom: 16 }}>
        <span>
          <Badge identity={question.user?.identity} /> {question.author}
        </span>
        <span>{formatDate(question.createdAt)}</span>
      </div>
      {question.body && (
        <div className="card" style={{ marginBottom: 28 }}>
          <p className="body" style={{ margin: 0 }}>
            {question.body}
          </p>
        </div>
      )}

      <h2 className="section-title">
        {question.answers.length} answer
        {question.answers.length === 1 ? "" : "s"}
      </h2>

      {question.answers.length === 0 ? (
        <p className="empty">No answers yet. Share what you know.</p>
      ) : (
        <div className="answer-list">
          {question.answers.map((a) => (
            <div key={a.id} className="answer">
              <p className="body" style={{ margin: 0 }}>
                {a.body}
              </p>
              <div className="meta">
                <Badge identity={a.user?.identity} /> {a.author} ·{" "}
                {formatDate(a.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Add an answer</h2>
      <div className="card">
        <AnswerForm
          questionId={question.id}
          formToken={issueFormToken()}
          user={user ? { username: user.username, identity: user.identity } : null}
        />
      </div>
    </div>
  );
}
