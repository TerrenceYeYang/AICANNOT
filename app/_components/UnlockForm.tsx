"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { unlockAnswer, type UnlockState } from "@/lib/actions";

const initial: UnlockState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Verifying…" : "Submit transaction"}
    </button>
  );
}

export default function UnlockForm({
  answerId,
  formToken,
  receivingAddress,
  priceEth,
}: {
  answerId: string;
  formToken: string;
  receivingAddress: string;
  priceEth: string;
}) {
  const [state, formAction] = useFormState(unlockAnswer, initial);
  const [scope, setScope] = useState<"public" | "private">("public");

  useEffect(() => {
    // On success the server action revalidates the page; nothing else to do.
  }, [state]);

  return (
    <form action={formAction} className="stack">
      <input type="hidden" name="answerId" value={answerId} />
      <input type="hidden" name="_ft" value={formToken} />
      <input
        type="text"
        name="contact_url"
        className="hp-field"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
        Send <strong>{priceEth} ETH</strong> to <code>{receivingAddress}</code>{" "}
        from your own wallet, then paste the transaction hash below. This site
        never connects to a wallet and never receives your funds directly through
        it — it only checks the public chain to confirm the payment arrived.
      </p>

      <div>
        <label htmlFor={`tx-${answerId}`}>Transaction hash</label>
        <input id={`tx-${answerId}`} name="txHash" type="text" placeholder="0x…" required />
      </div>

      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <label style={{ display: "block" }}>
          <input
            type="radio"
            name="scope"
            value="public"
            checked={scope === "public"}
            onChange={() => setScope("public")}
          />{" "}
          Unlock for everyone (the answer becomes public permanently)
        </label>
        <label style={{ display: "block" }}>
          <input
            type="radio"
            name="scope"
            value="private"
            checked={scope === "private"}
            onChange={() => setScope("private")}
          />{" "}
          Unlock only for me (stays hidden for everyone else)
        </label>
      </fieldset>

      {state.error && <p style={{ color: "var(--danger)", margin: 0 }}>{state.error}</p>}
      {state.ok && (
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Verified! The encrypted answer is now available below.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
