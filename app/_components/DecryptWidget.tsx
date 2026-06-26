"use client";

import { useState } from "react";
import { decryptAnswer, type CipherBundle } from "./cryptoUtil";

export default function DecryptWidget({ bundle }: { bundle: CipherBundle }) {
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleDecrypt() {
    setError(null);
    setBusy(true);
    try {
      const result = await decryptAnswer(bundle, privateKeyPem.trim());
      setPlaintext(result);
    } catch {
      setError("Couldn't decrypt with that private key.");
    } finally {
      setBusy(false);
    }
  }

  if (plaintext !== null) {
    return (
      <div className="card">
        <p className="body" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
          {plaintext}
        </p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
          Decrypted locally in your browser — never sent to the server.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
        Payment verified — here is the encrypted answer. Decrypting it requires
        the author's private key. This site doesn't manage or distribute that
        key; if you have it (e.g. you're the author, or they shared it with
        you), paste it here to decrypt locally in your own browser.
      </p>
      <textarea
        rows={4}
        placeholder="-----BEGIN PRIVATE KEY-----…"
        value={privateKeyPem}
        onChange={(e) => setPrivateKeyPem(e.target.value)}
        style={{ fontFamily: "monospace", fontSize: 12 }}
      />
      <div className="stack" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleDecrypt}
          disabled={busy || !privateKeyPem.trim()}
        >
          {busy ? "Decrypting…" : "Decrypt locally"}
        </button>
      </div>
      {error && <p style={{ color: "var(--danger)", marginTop: 8 }}>{error}</p>}
      <details style={{ marginTop: 8 }}>
        <summary style={{ fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
          View raw encrypted data
        </summary>
        <pre style={{ fontSize: 11, overflowX: "auto" }}>{bundle.cipherBody}</pre>
      </details>
    </div>
  );
}
