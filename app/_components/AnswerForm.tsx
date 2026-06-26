"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createAnswer, type PostState } from "@/lib/actions";
import { identityDef } from "@/lib/identity";
import { lockAnswer, type LockedPayload } from "./cryptoUtil";

const initial: PostState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Posting…" : label}
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
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const def = user ? identityDef(user.identity) : null;

  const [locked, setLocked] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [encryptError, setEncryptError] = useState<string | null>(null);
  // Set once encryption finishes; the author must confirm they saved the
  // private key before the encrypted answer actually gets submitted.
  const [pending, setPending] = useState<LockedPayload | null>(null);

  // Clear the form after a successful post.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setLocked(false);
      setPending(null);
    }
  }, [state]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!locked || pending) return; // unlocked posts submit normally
    e.preventDefault();
    setEncryptError(null);
    setEncrypting(true);
    try {
      const body = bodyRef.current?.value.trim() ?? "";
      if (!body) {
        setEncryptError("Write your answer before locking it.");
        return;
      }
      const payload = await lockAnswer(body);
      setPending(payload); // shows the "save your private key" confirmation
    } catch {
      setEncryptError("Encryption failed in your browser — please try again.");
    } finally {
      setEncrypting(false);
    }
  }

  function confirmAndSubmit() {
    if (!pending || !formRef.current) return;
    const fd = new FormData(formRef.current);
    fd.delete("body"); // plaintext never gets sent once locked
    fd.set("cipherBody", pending.cipherBody);
    fd.set("cipherIv", pending.cipherIv);
    fd.set("cipherKey", pending.cipherKey);
    fd.set("publicKeyPem", pending.publicKeyPem);
    formAction(fd);
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="stack">
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
          ref={bodyRef}
          rows={4}
          placeholder="Share a workaround, a prompt that works, or confirm it can't be done."
          required
          disabled={!!pending}
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="locked"
            value="1"
            checked={locked}
            onChange={(e) => {
              setLocked(e.target.checked);
              setPending(null);
              setEncryptError(null);
            }}
            disabled={!!pending}
          />{" "}
          🔒 Lock this answer until someone pays to unlock it
        </label>
        {locked && (
          <div style={{ marginTop: 6 }}>
            <label htmlFor="priceEth">Price (ETH)</label>
            <input
              id="priceEth"
              name="priceEth"
              type="text"
              inputMode="decimal"
              placeholder="0.001"
              required
              disabled={!!pending}
            />
            <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
              Your answer is encrypted in your browser before it's sent. The
              server only ever stores the encrypted version — only someone
              holding the matching private key can decrypt it. We never see
              or store that key.
            </p>
          </div>
        )}
      </div>

      {user ? (
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Answering as <strong>{user.username}</strong> {def?.emoji}
        </p>
      ) : (
        <div>
          <label htmlFor="author">Your name (optional)</label>
          <input id="author" name="author" type="text" placeholder="Anonymous" disabled={!!pending} />
        </div>
      )}

      {encryptError && <p style={{ color: "var(--danger)", margin: 0 }}>{encryptError}</p>}
      {state.error && (
        <p style={{ color: "var(--danger)", margin: 0 }}>{state.error}</p>
      )}

      {pending ? (
        <div className="card" style={{ borderColor: "var(--danger)" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
            Save your private key now — it is shown only this once and is
            never stored anywhere. Without it, nobody (including you) can
            ever decrypt this answer.
          </p>
          <textarea
            readOnly
            rows={6}
            value={pending.privateKeyPem}
            onFocus={(e) => e.currentTarget.select()}
            style={{ fontFamily: "monospace", fontSize: 12 }}
          />
          <div className="stack" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={confirmAndSubmit}
            >
              I've saved my private key — post the locked answer
            </button>
            <button type="button" className="btn" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <SubmitButton label={encrypting ? "Encrypting…" : locked ? "Encrypt & continue" : "Post answer"} />
      )}
    </form>
  );
}
