/**
 * TRY Cash API client — thin fetch wrapper with JWT.
 * Token stored in localStorage under `trycash_token`.
 */
const BASE = process.env.REACT_APP_BACKEND_URL;
const TOKEN_KEY = "trycash_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); };
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function req(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const tok = getToken();
  if (tok) headers["Authorization"] = `Bearer ${tok}`;
  const res = await fetch(`${BASE}/api${path}`, { ...opts, headers, body: opts.body ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { detail: text }; }
  if (!res.ok) {
    const detail = data?.detail;
    const err = new Error(typeof detail === "string" ? detail : (detail?.reason || detail?.code || `HTTP ${res.status}`));
    err.status = res.status;
    err.data = data;
    err.detail = detail;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => req("/auth/register", { method: "POST", body: payload }),
  login: (email, password) => req("/auth/login", { method: "POST", body: { email, password } }),
  adminVerifyAnswer: (email, answer) => req("/auth/admin-verify-answer", { method: "POST", body: { email, answer } }),
  adminFpEnroll: (credentialId) => req("/auth/admin-fp/enroll", { method: "POST", body: { credentialId } }),
  adminFpDelete: () => req("/auth/admin-fp/delete", { method: "POST" }),
  adminFpGet: () => req("/auth/admin-fp/get"),
  adminFpVerify: (email) => req("/auth/admin-fp/verify", { method: "POST", body: { email } }),
  me: () => req("/auth/me"),

  // Users
  userByAddress: (addr) => req(`/users/by-address/${encodeURIComponent(addr)}`),
  updateMe: (data) => req("/users/me", { method: "PATCH", body: data }),
  uploadIdPhotos: (idFrontPhoto, selfiePhoto) => req("/users/me/verify-id", { method: "POST", body: { idFrontPhoto, selfiePhoto } }),
  uploadGuardianPhoto: (guardianIdPhoto) => req("/users/me/verify-guardian", { method: "POST", body: { guardianIdPhoto } }),

  // Admin
  listUsers: () => req("/admin/users"),
  setUserWallet: (email, currency, amount) => req(`/admin/users/${encodeURIComponent(email)}/wallet`, { method: "PUT", body: { currency, amount } }),
  banUser: (email, reason) => req(`/admin/users/${encodeURIComponent(email)}/ban`, { method: "POST", body: { reason } }),
  unbanUser: (email) => req(`/admin/users/${encodeURIComponent(email)}/unban`, { method: "POST" }),
  approveId: (email) => req(`/admin/verify/id/${encodeURIComponent(email)}/approve`, { method: "POST" }),
  rejectId: (email, reason) => req(`/admin/verify/id/${encodeURIComponent(email)}/reject`, { method: "POST", body: { reason } }),
  approveGuardian: (email) => req(`/admin/verify/guardian/${encodeURIComponent(email)}/approve`, { method: "POST" }),
  rejectGuardian: (email, reason) => req(`/admin/verify/guardian/${encodeURIComponent(email)}/reject`, { method: "POST", body: { reason } }),
  exchangeLog: () => req("/admin/exchange-log"),
  reset: () => req("/admin/reset", { method: "POST", body: { confirm: "RESET-TRYCASH" } }),
  setAdminWallet: (currency, amount) => req("/admin/wallet", { method: "PUT", body: { currency, amount } }),
  updateRate: (currency, side, value) => req("/admin/rates", { method: "PUT", body: { currency, side, value } }),

  // Wallet / Exchange / Rates
  getRates: () => req("/rates"),
  send: (toAddress, amount, currency, notes) => req("/tx/send", { method: "POST", body: { toAddress, amount, currency, notes } }),
  exchange: (fromCurrency, toCurrency, fromAmount) => req("/exchange", { method: "POST", body: { fromCurrency, toCurrency, fromAmount } }),
  myTx: () => req("/tx/me"),

  // Notifications
  myNotifications: () => req("/notifications/me"),
  markNotifsRead: () => req("/notifications/read-all", { method: "POST" }),
};
