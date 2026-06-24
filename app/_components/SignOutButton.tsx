"use client";

import { useFormStatus } from "react-dom";

export default function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
