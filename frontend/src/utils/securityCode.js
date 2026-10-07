/**
 * Security code generator + uniqueness store.
 * Each user gets a 15-character UPPERCASE English unique key.
 * Stored in localStorage as { email: code, ... }
 * Verified via cryptographic randomness.
 */
const STORE_KEY = "trycash_security_codes"; // { [email]: CODE }
const RESET_OTP = "123456"; // MOCKED OTP — replace when backend lands

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const readStore = () => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); }
  catch { return {}; }
};

const writeStore = (obj) => {
  localStorage.setItem(STORE_KEY, JSON.stringify(obj));
};

export const generateUniqueSecurityCode = (email) => {
  const store = readStore();
  // If this email already has a code, return it (idempotent)
  if (email && store[email.toLowerCase()]) {
    return store[email.toLowerCase()];
  }
  const existing = new Set(Object.values(store));

  // Try up to 50 times — chance of collision in 26^15 is astronomically low
  for (let attempt = 0; attempt < 50; attempt++) {
    const buf = new Uint32Array(15);
    crypto.getRandomValues(buf);
    let code = "";
    for (let i = 0; i < 15; i++) code += CHARS[buf[i] % 26];
    if (!existing.has(code)) {
      if (email) {
        store[email.toLowerCase()] = code;
        writeStore(store);
      }
      return code;
    }
  }
  // Should never happen with 26^15 space
  throw new Error("Could not generate unique code");
};

export const verifySecurityCode = (email, code) => {
  if (!email || !code) return false;
  const store = readStore();
  const stored = store[email.toLowerCase()];
  return stored && stored === code.toUpperCase().trim();
};

export const getResetOtp = () => RESET_OTP;
