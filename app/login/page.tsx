"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/lib/actions";

const initial: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initial);

  return (
    <div style={{ maxWidth: 480 }}>
      <h1>Sign in</h1>
      <p style={{ color: "var(--muted)" }}>
        No account? <Link href="/register">Create one</Link>.
      </p>

      <form action={formAction} className="stack card">
        <div>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />
        </div>

        {state.error && (
          <p style={{ color: "var(--danger)", margin: 0 }}>{state.error}</p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
