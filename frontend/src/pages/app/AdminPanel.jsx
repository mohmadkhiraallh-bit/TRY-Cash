import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Coins, Wallet, TrendingUp, TrendingDown, Pencil, X, Check, History,
  ChevronRight, Users, ShieldCheck, IdCard, Shield, Ban, Info, Eye, RefreshCw,
} from "lucide-react";
import {
  useAuth, fmtNum, getRates, updateRate, setAdminWallet, getExchangeLog,
  getAllUsers, setUserWallet, banUser, unbanUser,
  approveUserId, rejectUserId, approveGuardian, rejectGuardian,
  refreshRatesCache,
} from "../../contexts/AuthContext";
import { api } from "../../api/client";
import { useLanguage } from "../../contexts/LanguageContext";
import { toast } from "sonner";

const L = {
  ar: {
    title: "لوحة الإدارة",
    tabExchange: "العملات والصرف",
    tabUsers: "المستخدمين",
    tabVerify: "التوثيق",
    walletsBtn: "محافظ المدير",
    walletsSub: "تعديل السيولة في كل عملة",
    ratesUsdBtn: "أسعار صرف الدولار",
    ratesTryBtn: "أسعار صرف الليرة التركية",
    ratesSub: "سعر البيع وسعر الشراء (مقابل ل.س)",
    exchangeLog: "سجل الصرف",
    emptyLog: "لا توجد عمليات صرف بعد",
    walletsTitle: "محافظ المدير",
    edit: "تعديل",
    save: "حفظ",
    cancel: "إلغاء",
    saved: "تم الحفظ",
    sellRate: "سعر البيع",
    buyRate: "سعر الشراء",
    ratesTitle: (c) => `أسعار صرف ${c}`,
    perUnit: "لكل 1",
    paid: "دفع",
    received: "استلم",
    // Users tab
    usersEmpty: "لا يوجد مستخدمون مسجّلون بعد",
    userWallets: "تعديل الأرصدة",
    userInfo: "المعلومات الشخصية",
    userBan: "حظر",
    userUnban: "إلغاء الحظر",
    bannedTag: "محظور",
    userWalletsTitle: (n) => `أرصدة ${n}`,
    userInfoTitle: "المعلومات الشخصية للمستخدم",
    banTitle: "حظر المستخدم",
    banDesc: "اكتب سبب الحظر — ستُعرض هذه الرسالة للمستخدم فور محاولته الدخول:",
    banConfirm: "تأكيد الحظر",
    banned: "تم حظر المستخدم",
    unbanned: "تم إلغاء الحظر",
    // Verify tab
    subAccount: "توثيق الحساب",
    subGuardian: "توثيق الوصي",
    verifyEmpty: "لا توجد طلبات توثيق حالياً",
    view: "عرض",
    approve: "توثيق",
    reject: "رفض",
    approveConfirm: "تأكيد التوثيق",
    approveDesc: "هل أنت متأكد من توثيق هذا المستخدم؟",
    rejectTitle: "سبب الرفض",
    rejectDesc: "اكتب سبب الرفض — سترسل هذه الرسالة للمستخدم في الإشعارات:",
    rejectConfirm: "إرسال الرفض",
    approved: "تم التوثيق",
    rejected: "تم إرسال الرفض",
    idPhotos: "صور الهوية",
    guardianIdPhoto: "صورة هوية الوصي",
    // Personal info section labels
    pi: {
      firstName: "الاسم", fatherName: "اسم الأب", surname: "الكنية",
      motherName: "اسم الأم", motherSurname: "كنية الأم", nationalId: "الرقم الوطني",
      email: "البريد", phone: "الهاتف", dob: "تاريخ الميلاد",
      country: "البلد", region: "المحافظة", marital: "الحالة الاجتماعية", health: "الحالة الصحية",
      profession: "المهنة", companyName: "الشركة", annualIncome: "الدخل السنوي",
      guardian: "معلومات الوصي",
      gFirstName: "اسم الوصي", gFatherName: "أب الوصي", gSurname: "كنية الوصي",
      gMotherName: "أم الوصي", gMotherSurname: "كنية أم الوصي",
      gPhone: "هاتف الوصي", relation: "صلة القرابة",
    },
  },
  tr: null, en: null,
};

// English + Turkish share simplified labels
L.tr = { ...L.ar, title: "Yönetici Paneli", tabExchange: "Döviz", tabUsers: "Kullanıcılar", tabVerify: "Doğrulama" };
L.en = { ...L.ar, title: "Admin Panel", tabExchange: "Currencies", tabUsers: "Users", tabVerify: "Verification" };

const CURRENCY_NAMES = {
  ar: { SYP: "الليرة السورية", USD: "الدولار الأمريكي", TRY: "الليرة التركية" },
  tr: { SYP: "Suriye Lirası", USD: "ABD Doları", TRY: "Türk Lirası" },
  en: { SYP: "Syrian Pound", USD: "US Dollar", TRY: "Turkish Lira" },
};

const TABS = [
  { key: "exchange", testid: "tab-admin-exchange", icon: Coins },
  { key: "users",    testid: "tab-admin-users",    icon: Users },
  { key: "verify",   testid: "tab-admin-verify",   icon: ShieldCheck },
];

export default function AdminPanel() {
  const { current, refreshCurrent } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = L[lang];

  const [tab, setTab] = useState("exchange");
  const [tick, setTick] = useState(0);
  const refresh = () => { refreshCurrent(); setTick((v) => v + 1); };

  // ─── LIVE TRACKING — poll every 2s + listen to storage events (cross-tab + signup) ───
  useEffect(() => {
    // On mount: force initial refresh
    setTick((v) => v + 1);
    // Storage listener — fires when another tab writes to localStorage
    const onStorage = (e) => {
      if (!e.key || e.key === "trycash_users" || e.key === "trycash_exchange_log" || e.key.startsWith("trycash_notifs_") || e.key.startsWith("trycash_tx_")) {
        setTick((v) => v + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    // Visibility — refresh whenever the tab regains focus
    const onFocus = () => setTick((v) => v + 1);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    // Same-tab custom event (fired when register() or admin mutations run)
    const onUsersChanged = () => setTick((v) => v + 1);
    window.addEventListener("trycash:users-changed", onUsersChanged);
    // Polling safety net (2s) — sensitive tracking
    const poll = setInterval(() => setTick((v) => v + 1), 2000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("trycash:users-changed", onUsersChanged);
      clearInterval(poll);
    };
  }, []);

  useEffect(() => { if (current && !current.isAdmin) navigate("/app/home"); }, [current, navigate]);
  // Live counts for tab badges
  const [tabCounts, setTabCounts] = useState({ users: 0, verify: 0 });
  useEffect(() => {
    getAllUsers().then((all) => {
      setTabCounts({
        users: all.length,
        verify: all.filter((u) => (u.idFrontUploaded && !u.isVerified) || (u.guardianIdUploaded && !u.guardianVerified)).length,
      });
    });
  }, [tick]);
  if (!current) return null;


  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <button data-testid="admin-back" onClick={() => navigate("/app/profile")} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <h1 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }} data-testid="admin-title">{t.title}</h1>
        <button
          data-testid="admin-refresh"
          onClick={refresh}
          className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full"
          aria-label="Refresh"
          title={lang === "ar" ? "تحديث" : "Refresh"}
        >
          <RefreshCw className="h-4 w-4 text-[#d4af37]" />
        </button>
      </div>

      {/* Tabs with live counts */}
      <div className="trycash-tx-filters" data-testid="admin-tabs">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.key;
          let count = null;
          if (tb.key === "users") count = tabCounts.users;
          else if (tb.key === "verify") count = tabCounts.verify;
          return (
            <button
              key={tb.key}
              data-testid={tb.testid}
              onClick={() => setTab(tb.key)}
              className={`trycash-tx-filter flex items-center justify-center gap-1.5 relative ${active ? "trycash-tx-filter-active" : ""}`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
              <span>{t[`tab${tb.key.charAt(0).toUpperCase() + tb.key.slice(1)}`]}</span>
              {count !== null && count > 0 && (
                <span className="trycash-tab-badge" data-testid={`tab-badge-${tb.key}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "exchange" && <ExchangeSection t={t} cn={CURRENCY_NAMES[lang]} lang={lang} refresh={refresh} tick={tick} />}
      {tab === "users"    && <UsersSection    t={t} cn={CURRENCY_NAMES[lang]} lang={lang} refresh={refresh} tick={tick} />}
      {tab === "verify"   && <VerifySection   t={t} lang={lang} refresh={refresh} tick={tick} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*   SECTION 1 — Currencies & Exchange                             */
/* ══════════════════════════════════════════════════════════════ */
function ExchangeSection({ t, cn, lang, refresh, tick }) {
  const [modal, setModal] = useState(null);
  const [log, setLog] = useState([]);
  useEffect(() => { getExchangeLog().then(setLog); }, [modal, tick]);

  return (
    <div className="space-y-3" data-testid="section-currencies-exchange">
      <button data-testid="btn-manage-wallets" onClick={() => setModal("wallets")} className="trycash-admin-tile">
        <Wallet className="h-5 w-5 text-[#d4af37]" strokeWidth={1.7} />
        <div className="flex-1 text-start">
          <p className="text-sm font-semibold">{t.walletsBtn}</p>
          <p className="trycash-muted text-[11px]">{t.walletsSub}</p>
        </div>
        <ChevronRight className={`h-4 w-4 text-[#d4af37]/60 ${lang === "ar" ? "rotate-180" : ""}`} />
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button data-testid="btn-rates-USD" onClick={() => setModal("rates-USD")} className="trycash-admin-tile trycash-admin-tile-compact">
          <TrendingUp className="h-5 w-5 text-[#d4af37]" strokeWidth={1.7} />
          <div className="flex-1 text-start">
            <p className="text-sm font-semibold">{t.ratesUsdBtn}</p>
            <p className="trycash-muted text-[10px]">{t.ratesSub}</p>
          </div>
        </button>
        <button data-testid="btn-rates-TRY" onClick={() => setModal("rates-TRY")} className="trycash-admin-tile trycash-admin-tile-compact">
          <TrendingDown className="h-5 w-5 text-[#d4af37]" strokeWidth={1.7} />
          <div className="flex-1 text-start">
            <p className="text-sm font-semibold">{t.ratesTryBtn}</p>
            <p className="trycash-muted text-[10px]">{t.ratesSub}</p>
          </div>
        </button>
      </div>

      <div className="trycash-tx-section mt-2" data-testid="admin-exchange-log">
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />
        <div className="flex items-center gap-2 px-1">
          <History className="h-4 w-4 text-[#d4af37]" strokeWidth={1.8} />
          <h3 className="trycash-gold text-base font-semibold" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.exchangeLog}</h3>
        </div>
        <div className="mt-3 space-y-2" data-testid="exchange-log-list">
          {log.length === 0 && <p className="trycash-muted py-6 text-center text-xs" data-testid="exchange-log-empty">{t.emptyLog}</p>}
          {log.map((e) => (
            <div key={e.id} className="trycash-tx-row items-start" data-testid={`log-${e.id}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#f1d875]">{e.userName}</p>
                <p className="trycash-muted mt-1 text-[10px]" dir="ltr">{new Date(e.ts).toLocaleString(lang === "ar" ? "ar-EG" : lang === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <div className="text-end">
                <p className="text-xs text-rose-400" dir="ltr" data-testid={`log-paid-${e.id}`}>-{fmtNum(e.paid)} {e.paidCurrency}</p>
                <p className="mt-0.5 text-xs text-emerald-400" dir="ltr" data-testid={`log-received-${e.id}`}>+{fmtNum(e.received)} {e.receivedCurrency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal === "wallets" && <WalletsModal onClose={() => { setModal(null); refresh(); }} t={t} cn={cn} lang={lang} refresh={refresh} />}
      {modal === "rates-USD" && <RatesModal currency="USD" onClose={() => { setModal(null); refresh(); }} t={t} lang={lang} refresh={refresh} />}
      {modal === "rates-TRY" && <RatesModal currency="TRY" onClose={() => { setModal(null); refresh(); }} t={t} lang={lang} refresh={refresh} />}
    </div>
  );
}

/* Admin's own wallet edit modal */
function WalletsModal({ onClose, t, cn, lang, refresh }) {
  const { current } = useAuth();
  const [editingCur, setEditingCur] = useState(null);
  const [draft, setDraft] = useState("");
  const currencies = ["SYP", "USD", "TRY"];
  const beginEdit = (cur) => { setEditingCur(cur); setDraft(String(current.wallets[cur] || 0)); };
  const cancel = () => { setEditingCur(null); setDraft(""); };
  const save = async () => {
    if (draft === "" || isNaN(Number(draft))) { toast.error(lang === "ar" ? "قيمة غير صالحة" : "Invalid"); return; }
    await setAdminWallet(editingCur, Number(draft));
    toast.success(t.saved);
    setEditingCur(null); setDraft("");
    refresh();
  };
  return (
    <div className="trycash-modal-overlay" data-testid="admin-wallets-modal" onClick={onClose}>
      <div className="trycash-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button data-testid="wallets-close" onClick={onClose} className="absolute right-3 top-3 text-[#d4af37]/70 hover:text-[#d4af37]"><X className="h-4 w-4" /></button>
        <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.walletsTitle}</h3>
        <div className="mt-5 space-y-3">
          {currencies.map((cur) => {
            const isEd = editingCur === cur;
            return (
              <div key={cur} className="trycash-admin-wallet-row" data-testid={`admin-wallet-${cur}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-widest text-[#d4af37]/70">{cur}</p>
                  <p className="text-[11px] trycash-muted">{cn[cur]}</p>
                </div>
                {isEd ? (
                  <>
                    <input data-testid={`admin-wallet-input-${cur}`} autoFocus value={draft} onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ""))} className="trycash-input w-32 text-end" dir="ltr" style={{ paddingInline: "0.75rem", paddingBlock: "0.5rem" }} />
                    <button data-testid={`admin-wallet-save-${cur}`} onClick={save} className="trycash-icon-btn h-9 w-9 inline-flex items-center justify-center rounded-full"><Check className="h-4 w-4 text-emerald-400" /></button>
                    <button data-testid={`admin-wallet-cancel-${cur}`} onClick={cancel} className="trycash-icon-btn h-9 w-9 inline-flex items-center justify-center rounded-full"><X className="h-4 w-4 text-rose-400" /></button>
                  </>
                ) : (
                  <>
                    <p className="trycash-amount text-base" dir="ltr" data-testid={`admin-wallet-amt-${cur}`}>{fmtNum(current.wallets[cur] || 0)}</p>
                    <button data-testid={`admin-wallet-edit-${cur}`} onClick={() => beginEdit(cur)} className="trycash-icon-btn h-9 w-9 inline-flex items-center justify-center rounded-full"><Pencil className="h-3.5 w-3.5 text-[#d4af37]" /></button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RateRow({ currency, side, label, rates, editingSide, draft, setDraft, setEditingSide, save, cancel, t }) {
  const isEd = editingSide === side;
  return (
    <div className="trycash-admin-wallet-row" data-testid={`rate-row-${currency}-${side}`}>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#f1d875]">{label}</p>
        <p className="trycash-muted text-[10px]">{t.perUnit} {currency} = ? SYP</p>
      </div>
      {isEd ? (
        <>
          <input data-testid={`rate-input-${currency}-${side}`} autoFocus value={draft} onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ""))} className="trycash-input w-32 text-end" dir="ltr" style={{ paddingInline: "0.75rem", paddingBlock: "0.5rem" }} />
          <button data-testid={`rate-save-${currency}-${side}`} onClick={save} className="trycash-icon-btn h-9 w-9 inline-flex items-center justify-center rounded-full"><Check className="h-4 w-4 text-emerald-400" /></button>
          <button data-testid={`rate-cancel-${currency}-${side}`} onClick={cancel} className="trycash-icon-btn h-9 w-9 inline-flex items-center justify-center rounded-full"><X className="h-4 w-4 text-rose-400" /></button>
        </>
      ) : (
        <>
          <p className="trycash-amount text-base" dir="ltr" data-testid={`rate-val-${currency}-${side}`}>{fmtNum(rates[currency]?.[side] || 0)}</p>
          <button data-testid={`rate-edit-${currency}-${side}`} onClick={() => { setEditingSide(side); setDraft(String(rates[currency]?.[side] || 0)); }} className="trycash-icon-btn h-9 w-9 inline-flex items-center justify-center rounded-full"><Pencil className="h-3.5 w-3.5 text-[#d4af37]" /></button>
        </>
      )}
    </div>
  );
}

function RatesModal({ currency, onClose, t, lang, refresh }) {
  const [rates, setLocal] = useState(getRates());
  const [editingSide, setEditingSide] = useState(null);
  const [draft, setDraft] = useState("");
  useEffect(() => { refreshRatesCache().then(setLocal); }, []);
  const cancel = () => { setEditingSide(null); setDraft(""); };
  const save = async () => {
    if (draft === "" || isNaN(Number(draft))) { toast.error(lang === "ar" ? "قيمة غير صالحة" : "Invalid"); return; }
    const r = await updateRate(currency, editingSide, Number(draft));
    setLocal(r);
    toast.success(t.saved);
    setEditingSide(null); setDraft("");
    refresh();
  };
  return (
    <div className="trycash-modal-overlay" data-testid={`rates-modal-${currency}`} onClick={onClose}>
      <div className="trycash-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button data-testid="rates-close" onClick={onClose} className="absolute right-3 top-3 text-[#d4af37]/70 hover:text-[#d4af37]"><X className="h-4 w-4" /></button>
        <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.ratesTitle(currency)}</h3>
        <div className="mt-5 space-y-3">
          <RateRow currency={currency} side="sell" label={t.sellRate} rates={rates} editingSide={editingSide} draft={draft} setDraft={setDraft} setEditingSide={setEditingSide} save={save} cancel={cancel} t={t} />
          <RateRow currency={currency} side="buy"  label={t.buyRate}  rates={rates} editingSide={editingSide} draft={draft} setDraft={setDraft} setEditingSide={setEditingSide} save={save} cancel={cancel} t={t} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*   SECTION 2 — Users                                             */
/* ══════════════════════════════════════════════════════════════ */
function UsersSection({ t, cn, lang, refresh, tick }) {
  const [modal, setModal] = useState(null);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    getAllUsers().then((list) => {
      setUsers([...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });
  }, [modal, tick]);

  return (
    <div className="space-y-2" data-testid="section-users">
      {/* Live counter header */}
      <div className="flex items-center justify-between px-1 pb-1" data-testid="users-live-header">
        <span className="trycash-muted text-[11px]">
          {lang === "ar" ? "المجموع" : lang === "tr" ? "Toplam" : "Total"}: <span className="trycash-amount">{users.length}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
          <span className="trycash-live-dot" /> {lang === "ar" ? "مباشر" : lang === "tr" ? "Canlı" : "Live"}
        </span>
      </div>
      {users.length === 0 && (
        <p className="trycash-muted py-10 text-center text-xs" data-testid="users-empty">{t.usersEmpty}</p>
      )}
      {users.map((u) => (
        <div key={u.email} className="trycash-admin-tile flex-col items-stretch !p-3 gap-2" data-testid={`user-row-${u.email}`}>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#d4af37]" strokeWidth={1.7} />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold">{u.fullName || u.firstName}</p>
              <p className="trycash-muted truncate text-[10px]">{u.email}</p>
            </div>
            {u.banned && <span className="trycash-ban-tag" data-testid={`user-banned-${u.email}`}>{t.bannedTag}</span>}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button data-testid={`user-wallets-${u.email}`} onClick={() => setModal({ type: "wallets", user: u })} className="trycash-admin-mini-btn"><Wallet className="h-3.5 w-3.5" /><span>{t.userWallets}</span></button>
            <button data-testid={`user-info-${u.email}`}   onClick={() => setModal({ type: "info", user: u })}    className="trycash-admin-mini-btn"><Info className="h-3.5 w-3.5" /><span>{t.userInfo}</span></button>
            <button
              data-testid={`user-ban-${u.email}`}
              onClick={async () => { if (u.banned) { await unbanUser(u.email); toast.success(t.unbanned); refresh(); } else setModal({ type: "ban", user: u }); }}
              className={`trycash-admin-mini-btn ${u.banned ? "trycash-admin-mini-btn-unban" : "trycash-admin-mini-btn-danger"}`}
            >
              <Ban className="h-3.5 w-3.5" />
              <span>{u.banned ? t.userUnban : t.userBan}</span>
            </button>
          </div>
        </div>
      ))}

      {modal?.type === "wallets" && <UserWalletsModal user={modal.user} onClose={() => { setModal(null); refresh(); }} t={t} cn={cn} lang={lang} refresh={refresh} />}
      {modal?.type === "info" && <UserInfoModal user={modal.user} onClose={() => setModal(null)} t={t} />}
      {modal?.type === "ban" && <BanUserModal user={modal.user} onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); }} t={t} />}
    </div>
  );
}

function UserWalletsModal({ user, onClose, t, cn, lang, refresh }) {
  const [editingCur, setEditingCur] = useState(null);
  const [draft, setDraft] = useState("");
  const [snapshot, setSnapshot] = useState(user.wallets || { SYP: 0, USD: 0, TRY: 0 });
  const currencies = ["SYP", "USD", "TRY"];
  const beginEdit = (cur) => { setEditingCur(cur); setDraft(String(snapshot[cur] || 0)); };
  const cancel = () => { setEditingCur(null); setDraft(""); };
  const save = async () => {
    if (draft === "" || isNaN(Number(draft))) { toast.error(lang === "ar" ? "قيمة غير صالحة" : "Invalid"); return; }
    const updated = await setUserWallet(user.email, editingCur, Number(draft));
    setSnapshot(updated.wallets);
    toast.success(t.saved);
    setEditingCur(null); setDraft("");
    refresh();
  };
  return (
    <div className="trycash-modal-overlay" data-testid={`user-wallets-modal-${user.email}`} onClick={onClose}>
      <div className="trycash-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 text-[#d4af37]/70 hover:text-[#d4af37]"><X className="h-4 w-4" /></button>
        <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.userWalletsTitle(user.fullName || user.firstName)}</h3>
        <div className="mt-5 space-y-3">
          {currencies.map((cur) => {
            const isEd = editingCur === cur;
            return (
              <div key={cur} className="trycash-admin-wallet-row" data-testid={`u-wallet-${user.email}-${cur}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-widest text-[#d4af37]/70">{cur}</p>
                  <p className="text-[11px] trycash-muted">{cn[cur]}</p>
                </div>
                {isEd ? (
                  <>
                    <input data-testid={`u-wallet-input-${cur}`} autoFocus value={draft} onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ""))} className="trycash-input w-32 text-end" dir="ltr" style={{ paddingInline: "0.75rem", paddingBlock: "0.5rem" }} />
                    <button data-testid={`u-wallet-save-${cur}`} onClick={save} className="trycash-icon-btn h-9 w-9 inline-flex items-center justify-center rounded-full"><Check className="h-4 w-4 text-emerald-400" /></button>
                    <button onClick={cancel} className="trycash-icon-btn h-9 w-9 inline-flex items-center justify-center rounded-full"><X className="h-4 w-4 text-rose-400" /></button>
                  </>
                ) : (
                  <>
                    <p className="trycash-amount text-base" dir="ltr" data-testid={`u-wallet-amt-${cur}`}>{fmtNum(snapshot[cur] || 0)}</p>
                    <button data-testid={`u-wallet-edit-${cur}`} onClick={() => beginEdit(cur)} className="trycash-icon-btn h-9 w-9 inline-flex items-center justify-center rounded-full"><Pencil className="h-3.5 w-3.5 text-[#d4af37]" /></button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UserInfoModal({ user, onClose, t }) {
  const pi = t.pi;
  const rows = [
    [pi.firstName, user.firstName], [pi.fatherName, user.fatherName], [pi.surname, user.surname],
    [pi.motherName, user.motherName], [pi.motherSurname, user.motherSurname],
    [pi.nationalId, user.nationalId], [pi.email, user.email], [pi.phone, user.phone],
    [pi.dob, user.dob], [pi.country, user.country], [pi.region, user.region],
    [pi.marital, user.marital], [pi.health, user.health],
    [pi.profession, user.profession], [pi.companyName, user.companyName],
    [pi.annualIncome, user.annualIncome],
  ];
  const gRows = [
    [pi.gFirstName, user.gFirstName], [pi.gFatherName, user.gFatherName], [pi.gSurname, user.gSurname],
    [pi.gMotherName, user.gMotherName], [pi.gMotherSurname, user.gMotherSurname],
    [pi.gPhone, user.gPhone], [pi.relation, user.relation],
  ];
  return (
    <div className="trycash-modal-overlay" data-testid={`user-info-modal-${user.email}`} onClick={onClose}>
      <div className="trycash-modal-panel max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 text-[#d4af37]/70 hover:text-[#d4af37]"><X className="h-4 w-4" /></button>
        <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.userInfoTitle}</h3>
        <div className="mt-4 space-y-1.5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 rounded-lg border border-[#d4af37]/15 bg-black/30 px-3 py-2">
              <span className="text-[11px] text-[#d4af37]/80">{k}</span>
              <span className="max-w-[60%] truncate text-xs">{v || "—"}</span>
            </div>
          ))}
          <div className="mt-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#d4af37]" strokeWidth={1.7} />
            <p className="text-sm font-semibold text-[#f1d875]">{pi.guardian}</p>
            {user.guardianVerified && <Check className="h-4 w-4 text-emerald-400" data-testid={`user-guardian-verified-${user.email}`} />}
          </div>
          {gRows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 rounded-lg border border-[#d4af37]/15 bg-black/30 px-3 py-2">
              <span className="text-[11px] text-[#d4af37]/80">{k}</span>
              <span className="max-w-[60%] truncate text-xs">{v || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BanUserModal({ user, onClose, onDone, t }) {
  const [reason, setReason] = useState("");
  const submit = async () => {
    if (!reason.trim()) { toast.error("Reason required"); return; }
    await banUser(user.email, reason.trim());
    toast.success(t.banned);
    onDone();
  };
  return (
    <div className="trycash-modal-overlay" data-testid={`ban-modal-${user.email}`} onClick={onClose}>
      <div className="trycash-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 text-[#d4af37]/70 hover:text-[#d4af37]"><X className="h-4 w-4" /></button>
        <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.banTitle}</h3>
        <p className="trycash-muted mt-2 text-xs">{t.banDesc}</p>
        <textarea
          data-testid="ban-reason-input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="trycash-input mt-3 w-full"
          style={{ paddingInline: "0.85rem", paddingBlock: "0.65rem" }}
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="trycash-gold-outline-btn rounded-xl py-3 text-sm font-semibold">{t.cancel}</button>
          <button data-testid="ban-confirm" onClick={submit} className="trycash-gold-btn rounded-xl py-3 text-sm font-bold text-black"><span className="relative z-10">{t.banConfirm}</span></button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*   SECTION 3 — Verification                                      */
/* ══════════════════════════════════════════════════════════════ */
function VerifyRow({ user, kind, viewTestid, verifyTestid, rejectTestid, onView, onVerify, onReject, t }) {
  return (
    <div className="trycash-admin-tile items-center !p-3" data-testid={`${kind}-row-${user.email}`}>
      <IdCard className="h-4 w-4 text-[#d4af37]" strokeWidth={1.7} />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold">{user.fullName || user.firstName}</p>
        <p className="trycash-muted truncate text-[10px]">{user.email}</p>
      </div>
      <div className="flex gap-1.5">
        <button data-testid={viewTestid}   onClick={onView}    className="trycash-admin-mini-btn"><Eye className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t.view}</span></button>
        <button data-testid={verifyTestid} onClick={onVerify}  className="trycash-admin-mini-btn"><Check className="h-3.5 w-3.5 text-emerald-400" /></button>
        <button data-testid={rejectTestid} onClick={onReject}  className="trycash-admin-mini-btn trycash-admin-mini-btn-danger"><X className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

function VerifySection({ t, lang, refresh, tick }) {
  const [modal, setModal] = useState(null);
  const [pendingId, setPendingId] = useState([]);
  const [pendingGuardian, setPendingGuardian] = useState([]);
  void lang;

  useEffect(() => {
    getAllUsers().then((all) => {
      setPendingId(all.filter((u) => u.idFrontUploaded && !u.isVerified));
      setPendingGuardian(all.filter((u) => u.guardianIdUploaded && !u.guardianVerified));
    });
  }, [modal, tick]);

  return (
    <div className="space-y-4" data-testid="section-verify">
      <div>
        <div className="mb-2 flex items-center gap-2 px-1">
          <IdCard className="h-4 w-4 text-[#d4af37]" strokeWidth={1.8} />
          <h3 className="trycash-gold text-base font-semibold" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.subAccount}</h3>
        </div>
        <div className="space-y-2" data-testid="verify-pending-id">
          {pendingId.length === 0 && <p className="trycash-muted py-4 text-center text-xs" data-testid="verify-empty-id">{t.verifyEmpty}</p>}
          {pendingId.map((u) => (
            <VerifyRow
              key={u.email} user={u} kind="id"
              viewTestid={`view-id-${u.email}`}
              verifyTestid={`approve-id-${u.email}`}
              rejectTestid={`reject-id-${u.email}`}
              onView={() => setModal({ type: "view", user: u, kind: "id" })}
              onVerify={() => setModal({ type: "approve", user: u, kind: "id" })}
              onReject={() => setModal({ type: "reject", user: u, kind: "id" })}
              t={t}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 px-1">
          <Shield className="h-4 w-4 text-[#d4af37]" strokeWidth={1.8} />
          <h3 className="trycash-gold text-base font-semibold" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.subGuardian}</h3>
        </div>
        <div className="space-y-2" data-testid="verify-pending-guardian">
          {pendingGuardian.length === 0 && <p className="trycash-muted py-4 text-center text-xs" data-testid="verify-empty-guardian">{t.verifyEmpty}</p>}
          {pendingGuardian.map((u) => (
            <VerifyRow
              key={u.email} user={u} kind="guardian"
              viewTestid={`view-g-${u.email}`}
              verifyTestid={`approve-g-${u.email}`}
              rejectTestid={`reject-g-${u.email}`}
              onView={() => setModal({ type: "view", user: u, kind: "guardian" })}
              onVerify={() => setModal({ type: "approve", user: u, kind: "guardian" })}
              onReject={() => setModal({ type: "reject", user: u, kind: "guardian" })}
              t={t}
            />
          ))}
        </div>
      </div>

      {modal?.type === "view" && <ViewPhotosModal user={modal.user} kind={modal.kind} onClose={() => setModal(null)} t={t} />}
      {modal?.type === "approve" && (
        <ApproveModal
          user={modal.user} kind={modal.kind} onClose={() => setModal(null)}
          onDone={async () => {
            if (modal.kind === "id") await approveUserId(modal.user.email);
            else await approveGuardian(modal.user.email);
            toast.success(t.approved);
            setModal(null); refresh();
          }}
          t={t}
        />
      )}
      {modal?.type === "reject" && (
        <RejectModal
          user={modal.user} kind={modal.kind} onClose={() => setModal(null)}
          onDone={async (reason) => {
            if (modal.kind === "id") await rejectUserId(modal.user.email, reason);
            else await rejectGuardian(modal.user.email, reason);
            toast.success(t.rejected);
            setModal(null); refresh();
          }}
          t={t}
        />
      )}
    </div>
  );
}

function ViewPhotosModal({ user, kind, onClose, t }) {
  return (
    <div className="trycash-modal-overlay" data-testid={`view-photos-modal-${user.email}`} onClick={onClose}>
      <div className="trycash-modal-panel max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 text-[#d4af37]/70 hover:text-[#d4af37]"><X className="h-4 w-4" /></button>
        <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>
          {kind === "id" ? t.idPhotos : t.guardianIdPhoto}
        </h3>
        <p className="text-sm mt-2 opacity-80">{user.fullName || user.firstName}</p>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {kind === "id" ? (
            <>
              {user.idFrontPhoto ? (
                <img src={user.idFrontPhoto} alt="ID front" className="w-full rounded-lg border border-[#d4af37]/40" data-testid={`photo-id-front-${user.email}`} />
              ) : (
                <div className="trycash-photo-preview !aspect-video flex items-center justify-center" data-testid={`photo-id-front-${user.email}`}>
                  <IdCard className="h-16 w-16 text-[#d4af37]/50" strokeWidth={1.2} />
                </div>
              )}
              {user.selfiePhoto ? (
                <img src={user.selfiePhoto} alt="Selfie" className="w-full rounded-lg border border-[#d4af37]/40" data-testid={`photo-selfie-${user.email}`} />
              ) : (
                <div className="trycash-photo-preview !aspect-video flex items-center justify-center" data-testid={`photo-selfie-${user.email}`}>
                  <Users className="h-16 w-16 text-[#d4af37]/50" strokeWidth={1.2} />
                </div>
              )}
            </>
          ) : (
            user.guardianIdPhoto ? (
              <img src={user.guardianIdPhoto} alt="Guardian ID" className="w-full rounded-lg border border-[#d4af37]/40" data-testid={`photo-guardian-${user.email}`} />
            ) : (
              <div className="trycash-photo-preview !aspect-video flex items-center justify-center" data-testid={`photo-guardian-${user.email}`}>
                <Shield className="h-16 w-16 text-[#d4af37]/50" strokeWidth={1.2} />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ApproveModal({ user, kind, onClose, onDone, t }) {
  return (
    <div className="trycash-modal-overlay" data-testid={`approve-modal-${kind}-${user.email}`} onClick={onClose}>
      <div className="trycash-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 text-[#d4af37]/70 hover:text-[#d4af37]"><X className="h-4 w-4" /></button>
        <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.approveConfirm}</h3>
        <p className="mt-2 text-xs opacity-80">{t.approveDesc}</p>
        <p className="mt-2 text-sm font-semibold text-[#f1d875]">{user.fullName || user.firstName}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="trycash-gold-outline-btn rounded-xl py-3 text-sm font-semibold">{t.cancel}</button>
          <button data-testid={`approve-confirm-${kind}-${user.email}`} onClick={onDone} className="trycash-gold-btn rounded-xl py-3 text-sm font-bold text-black"><span className="relative z-10">{t.approve}</span></button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ user, kind, onClose, onDone, t }) {
  const [reason, setReason] = useState("");
  const submit = () => {
    if (!reason.trim()) { toast.error("Reason required"); return; }
    onDone(reason.trim());
  };
  return (
    <div className="trycash-modal-overlay" data-testid={`reject-modal-${kind}-${user.email}`} onClick={onClose}>
      <div className="trycash-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 text-[#d4af37]/70 hover:text-[#d4af37]"><X className="h-4 w-4" /></button>
        <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.rejectTitle}</h3>
        <p className="trycash-muted mt-2 text-xs">{t.rejectDesc}</p>
        <textarea
          data-testid={`reject-reason-${kind}-${user.email}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="trycash-input mt-3 w-full"
          style={{ paddingInline: "0.85rem", paddingBlock: "0.65rem" }}
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="trycash-gold-outline-btn rounded-xl py-3 text-sm font-semibold">{t.cancel}</button>
          <button data-testid={`reject-confirm-${kind}-${user.email}`} onClick={submit} className="trycash-gold-btn rounded-xl py-3 text-sm font-bold text-black"><span className="relative z-10">{t.rejectConfirm}</span></button>
        </div>
      </div>
    </div>
  );
}
