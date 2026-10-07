import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { api, setToken, clearToken, getToken } from "../api/client";

const ADMIN_EMAIL = "trycashsupport@gmail.com";
const ADMIN_PASSWORD = "asd.fhd.nemr";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAdminEmail, setPendingAdminEmail] = useState(null);

  const refreshCurrent = useCallback(async () => {
    if (!getToken()) { setCurrent(null); return null; }
    try {
      const { user } = await api.me();
      setCurrent(user);
      return user;
    } catch {
      clearToken();
      setCurrent(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshCurrent().finally(() => setLoading(false));
    // Auto-refresh every 5s so admin sees new users, and users see credit
    const iv = setInterval(() => { if (getToken()) refreshCurrent(); }, 5000);
    return () => clearInterval(iv);
  }, [refreshCurrent]);

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.needsFingerprint) {
        setPendingAdminEmail(res.email);
        return { ok: false, needsFingerprint: true, user: { email: res.email, isAdmin: true } };
      }
      setToken(res.token);
      setCurrent(res.user);
      return { ok: true, user: res.user };
    } catch (e) {
      if (e.status === 403) {
        const reason = e.detail?.reason || e.detail || "";
        return { ok: false, error: "banned", banReason: reason };
      }
      return { ok: false, error: e.message || "invalid_credentials" };
    }
  };

  const register = async (data) => {
    try {
      const res = await api.register(data);
      setToken(res.token);
      setCurrent(res.user);
      return { ok: true, user: res.user };
    } catch (e) {
      return { ok: false, error: e.message === "email_taken" ? "email_taken" : e.message };
    }
  };

  const verifyAdminSecurity = async (answer) => {
    // Called from AdminFingerprintModal — synchronous "answer" check via API.
    if (!pendingAdminEmail) return false;
    try {
      const res = await api.adminVerifyAnswer(pendingAdminEmail, (answer || "").trim());
      if (res.ok) {
        setToken(res.token);
        setCurrent(res.user);
        setPendingAdminEmail(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const completeAdminAuth = () => {
    // Legacy compat — WebAuthn flow: after client-side assertion, call verify to mint token
    if (!pendingAdminEmail) return;
    api.adminFpVerify(pendingAdminEmail).then((res) => {
      if (res.ok) {
        setToken(res.token); setCurrent(res.user); setPendingAdminEmail(null);
      }
    }).catch(() => {});
  };

  const logout = () => { clearToken(); setCurrent(null); };

  const updateUser = async (patch) => {
    try {
      const res = await api.updateMe(patch);
      setCurrent(res.user);
    } catch { /* noop */ }
  };

  const getUserByAddress = async (addr) => {
    try {
      const res = await api.userByAddress(addr);
      return res.user;
    } catch {
      return null;
    }
  };

  const value = useMemo(() => ({
    current, loading, login, register, logout, updateUser,
    verifyAdminSecurity, completeAdminAuth, getUserByAddress,
    refreshCurrent, pendingAdminEmail,
    ADMIN_EMAIL, ADMIN_PASSWORD,
  }), [current, loading, refreshCurrent, pendingAdminEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

// ─── Number formatting helpers (kept for compat) ───
export const fmtNum = (n) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(n) || 0);
export const fmtMoney = (n, currency) => `${fmtNum(n)} ${currency}`;

// ─── Legacy compatibility shims — many pages still import these ───
// Transactions now come from the API; components should switch to `api.myTx()` when possible.
// For now, these return empty synchronously so old pages don't crash.
export const getTx = () => JSON.parse(localStorage.getItem("trycash_cached_tx") || "[]");
export const addTx = () => {}; // no-op — server records the tx atomically
export const getFriends = () => JSON.parse(localStorage.getItem("trycash_cached_friends") || "[]");
export const addFriend = () => {};
export const removeFriend = () => {};

// Terms acceptance still localStorage (client-only preference)
export const acceptTerms = (email) => { try { localStorage.setItem(`trycash_terms_${email}`, JSON.stringify({ accepted: true, ts: Date.now() })); } catch {} };
export const getTermsAcceptance = (email) => { try { return JSON.parse(localStorage.getItem(`trycash_terms_${email}`) || "null"); } catch { return null; } };

// Rates + exchange — proxied to the API. Kept SYNC-looking with in-memory cache.
let _ratesCache = { USD: { sell: 13000, buy: 13500 }, TRY: { sell: 300, buy: 320 } };
export const getRates = () => _ratesCache;
export const refreshRatesCache = async () => {
  try { _ratesCache = await api.getRates(); return _ratesCache; } catch { return _ratesCache; }
};
export const updateRate = async (currency, side, value) => {
  const r = await api.updateRate(currency, side, value);
  _ratesCache = r;
  return r;
};

export const executeExchange = async ({ from, to, fromAmount }) => {
  try {
    const res = await api.exchange(from, to, fromAmount);
    return { ok: true, received: res.received, updatedUser: res.user };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

// Admin wallet direct adjust
export const setAdminWallet = async (currency, amount) => {
  const res = await api.setAdminWallet(currency, amount);
  return res;
};

// Public helper for scanner: lookup user by address (async)
export const getUserByAddressPub = async (addr) => {
  try { const r = await api.userByAddress(addr); return r.user; } catch { return null; }
};

// Admin: users list + verification + ban
export const getAllUsers = async () => {
  try { const { users } = await api.listUsers(); return users || []; } catch { return []; }
};
export const setUserWallet = (email, currency, amount) => api.setUserWallet(email, currency, amount);
export const banUser = (email, reason) => api.banUser(email, reason);
export const unbanUser = (email) => api.unbanUser(email);
export const approveUserId = (email) => api.approveId(email);
export const rejectUserId = (email, reason) => api.rejectId(email, reason);
export const approveGuardian = (email) => api.approveGuardian(email);
export const rejectGuardian = (email, reason) => api.rejectGuardian(email, reason);
export const getExchangeLog = async () => {
  try { const { log } = await api.exchangeLog(); return log || []; } catch { return []; }
};

