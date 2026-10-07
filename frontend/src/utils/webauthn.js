/**
 * WebAuthn helpers for admin fingerprint enrollment + verification.
 * Uses the device's platform authenticator (Touch ID / Windows Hello / Android fingerprint).
 *
 * Storage: credential ID (base64url-encoded) is persisted to localStorage under trycash_admin_webauthn.
 * NOTE: mock/limited environment. In production the server MUST verify the assertion signature.
 */

const WEBAUTHN_KEY = "trycash_admin_webauthn";

const b64urlEncode = (buf) => {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const b64urlDecode = (str) => {
  const s = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - str.length % 4) % 4);
  const bin = atob(s);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

const randomChallenge = () => {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return buf;
};

export const isWebAuthnSupported = () =>
  typeof window !== "undefined" &&
  window.PublicKeyCredential &&
  typeof navigator.credentials?.create === "function" &&
  typeof navigator.credentials?.get === "function";

export const getStoredCredential = () => {
  try { return JSON.parse(localStorage.getItem(WEBAUTHN_KEY) || "null"); }
  catch { return null; }
};

export const clearStoredCredential = () => localStorage.removeItem(WEBAUTHN_KEY);

/** Enroll a new admin fingerprint credential. Resolves to { ok:true, credentialId } or { ok:false, error }. */
export const enrollAdminFingerprint = async ({ userId, userName, displayName }) => {
  if (!isWebAuthnSupported()) return { ok: false, error: "unsupported" };
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: "TRY Cash" },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: displayName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7   /* ES256 */ },
          { type: "public-key", alg: -257 /* RS256 */ },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        attestation: "none",
        timeout: 60000,
      },
    });
    if (!cred) return { ok: false, error: "no_credential" };
    const rawId = b64urlEncode(cred.rawId);
    const record = { id: rawId, enrolledAt: Date.now() };
    localStorage.setItem(WEBAUTHN_KEY, JSON.stringify(record));
    return { ok: true, credentialId: rawId };
  } catch (e) {
    return { ok: false, error: e?.name || "failed", message: e?.message };
  }
};

/** Verify admin fingerprint. Resolves to { ok:true } or { ok:false, error }. */
export const verifyAdminFingerprint = async () => {
  if (!isWebAuthnSupported()) return { ok: false, error: "unsupported" };
  const record = getStoredCredential();
  if (!record) return { ok: false, error: "not_enrolled" };
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [{ id: b64urlDecode(record.id), type: "public-key" }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    if (!assertion) return { ok: false, error: "no_assertion" };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.name || "failed", message: e?.message };
  }
};
