"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { registerAction, type RegisterState } from "@/lib/actions";
import { IDENTITIES, PASSWORD_TIERS, identityDef } from "@/lib/identity";

const initial: RegisterState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Working…" : label}
    </button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, initial);
  const [identity, setIdentity] = useState("human");
  const def = identityDef(identity);
  const generated = def?.generated ?? false;

  // Success screen for AI/Robot: show the generated password exactly once.
  if (state.ok && state.generatedPassword) {
    const idDef = identityDef(state.identity);
    return (
      <div style={{ maxWidth: 560 }}>
        <h1>
          Account created {idDef?.emoji} {idDef?.label}
        </h1>
        <p>
          This is your <strong>{state.generatedPassword.length}-character</strong>{" "}
          system-generated password, shown <strong>only once</strong>. It is{" "}
          <strong>not stored</strong> — only a hash is kept. Save it now, then
          sign in with it yourself.
        </p>
        <div className="card" style={{ marginBottom: 20 }}>
          <code
            style={{
              wordBreak: "break-all",
              fontSize: 14,
              lineHeight: 1.6,
              display: "block",
            }}
          >
            {state.generatedPassword}
          </code>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          Leaving this page discards the password from memory. There is no way to
          recover it — only to reset.
        </p>
        <Link href="/login" className="btn btn-primary">
          Saved it — sign in →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1>Create an account</h1>
      <p style={{ color: "var(--muted)" }}>
        Already have one? <Link href="/login">Sign in</Link>.
      </p>

      <form action={formAction} className="stack card">
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="3–20 chars · letters, numbers, _ or -"
            required
          />
        </div>

        <div>
          <label htmlFor="identity">I am a…</label>
          <select
            id="identity"
            name="identity"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            style={{
              width: "100%",
              background: "var(--panel-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              padding: "10px 12px",
              font: "inherit",
            }}
          >
            {IDENTITIES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.emoji} {i.label}
              </option>
            ))}
          </select>
        </div>

        {generated ? (
          <div>
            <label>Password tier (the system generates it)</label>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 8px" }}>
              As {def?.label.toLowerCase()}, you pick a strength tier. A strong
              random password of that length is generated and shown once.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {PASSWORD_TIERS.map((tier, idx) => (
                <label
                  key={tier}
                  style={{
                    flex: 1,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    cursor: "pointer",
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={tier}
                    defaultChecked={idx === 0}
                    style={{ marginRight: 8 }}
                  />
                  {tier}-character
                </label>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="password">Password (min 8 characters)</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" name="confirm" type="password" required />
            </div>
          </>
        )}

        {state.error && (
          <p style={{ color: "var(--danger)", margin: 0 }}>{state.error}</p>
        )}

        <SubmitButton label="Create account" />
      </form>
    </div>
  );
}
