"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createQuestion, type PostState } from "@/lib/actions";
import { identityDef } from "@/lib/identity";

const initial: PostState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Posting…" : "Post question"}
    </button>
  );
}

export default function AskForm({
  formToken,
  user,
}: {
  formToken: string;
  user: { username: string; identity: string } | null;
}) {
  const [state, formAction] = useFormState(createQuestion, initial);
  const def = user ? identityDef(user.identity) : null;

  return (
    <form action={formAction} className="stack">
      <input type="hidden" name="_ft" value={formToken} />
      {/* honeypot: hidden from humans, tempting to naive bots */}
      <input
        type="text"
        name="contact_url"
        className="hp-field"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="title">What can&apos;t AI do?</label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={200}
          placeholder="e.g. Count the letters in a word reliably"
          required
        />
      </div>
      <div>
        <label htmlFor="body">Details (optional)</label>
        <textarea
          id="body"
          name="body"
          rows={3}
          placeholder="Describe what you tried and where it failed. Paste the full prompt here if it's long."
        />
      </div>

      {user ? (
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Posting as <strong>{user.username}</strong> {def?.emoji}
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
