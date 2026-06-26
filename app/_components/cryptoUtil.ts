// Browser-only crypto for pay-to-unlock answers. Everything here runs in the
// visitor's own browser via the Web Crypto API — the server never sees a
// private key and never sees plaintext for a locked answer.

const RSA_PARAMS: RsaHashedKeyGenParams = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function pemWrap(b64: string, label: string): string {
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

function pemUnwrap(pem: string): string {
  return pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
}

export type LockedPayload = {
  cipherBody: string; // base64 AES-GCM ciphertext
  cipherIv: string; // base64 AES-GCM IV
  cipherKey: string; // base64 RSA-OAEP-wrapped AES key
  publicKeyPem: string;
  privateKeyPem: string; // shown once to the author — never sent to the server
};

/** Generates a fresh RSA keypair + AES key in-browser and encrypts `body`. */
export async function lockAnswer(body: string): Promise<LockedPayload> {
  const keyPair = await crypto.subtle.generateKey(RSA_PARAMS, true, [
    "wrapKey",
    "unwrapKey",
  ]);

  const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(body)
  );

  const wrappedKey = await crypto.subtle.wrapKey("raw", aesKey, keyPair.publicKey, {
    name: "RSA-OAEP",
  });

  const publicKeySpki = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyPkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    cipherBody: bufToBase64(ciphertext),
    cipherIv: bufToBase64(iv.buffer),
    cipherKey: bufToBase64(wrappedKey),
    publicKeyPem: pemWrap(bufToBase64(publicKeySpki), "PUBLIC KEY"),
    privateKeyPem: pemWrap(bufToBase64(privateKeyPkcs8), "PRIVATE KEY"),
  };
}

export type CipherBundle = {
  cipherBody: string;
  cipherIv: string;
  cipherKey: string;
};

/** Decrypts a ciphertext bundle using a pasted PEM private key. Browser-only. */
export async function decryptAnswer(
  bundle: CipherBundle,
  privateKeyPem: string
): Promise<string> {
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    base64ToBuf(pemUnwrap(privateKeyPem)),
    RSA_PARAMS,
    false,
    ["unwrapKey"]
  );

  const aesKey = await crypto.subtle.unwrapKey(
    "raw",
    base64ToBuf(bundle.cipherKey),
    privateKey,
    { name: "RSA-OAEP" },
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuf(bundle.cipherIv) },
    aesKey,
    base64ToBuf(bundle.cipherBody)
  );

  return new TextDecoder().decode(plaintext);
}
