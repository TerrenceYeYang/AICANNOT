"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createAnswer, type PostState } from "@/lib/actions";
import { identityDef } from "@/lib/identity";

const initial: PostState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Posting…" : "Post answer"}
    </button>
  );
}

export default function AnswerForm({
  questionId,
  formToken,
  user,
}: {
  questionId: string;
  formToken: string;
  user: { username: string; identity: string } | null;
}) {
  const [state, formAction] = useFormState(createAnswer, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const def = user ? identityDef(user.identity) : null;

  // Clear the textarea after a successful post.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="stack">
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="_ft" value={formToken} />
      <input
        type="text"
        name="contact_url"
        className="hp-field"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="body">Your answer</label>
        <textarea
          id="body"
          name="body"
          rows={4}
          placeholder="Share a workaround, a prompt that works, or confirm it can't be done."
          required
        />
      </div>

      {user ? (
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Answering as <strong>{user.username}</strong> {def?.emoji}
        </p>
      ) : (
        <div>
          <label htmlFor="author">Your name (optional)</label>
          <input id="author" name="author" type="text" placeholder="Anonymous" />
        </div>
      )}

      {state.error && (
        <p style={{ color: "var(--danger)", margin: 0 }}>{state.error}</p>
      )}

      <SubmitButton />
    </form>
  );
}
