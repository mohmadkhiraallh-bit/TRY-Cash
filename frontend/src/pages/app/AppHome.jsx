import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, BadgeCheck, ArrowDownToLine, Send, ArrowLeftRight } from "lucide-react";
import { useAuth, fmtNum, getTx } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { SyrianFlagIcon, TurkishFlagIcon, USFlagIcon } from "../../components/Flags";
import NotificationBell from "../../components/NotificationBell";

const WALLETS = [
  { key: "TRY", nameAr: "الليرة التركية",   nameTr: "Türk Lirası",   nameEn: "Turkish Lira",  symbol: "₺",   Flag: TurkishFlagIcon },
  { key: "USD", nameAr: "الدولار الأمريكي", nameTr: "ABD Doları",    nameEn: "US Dollar",     symbol: "$",   Flag: USFlagIcon },
  { key: "SYP", nameAr: "الليرة السورية",   nameTr: "Suriye Lirası", nameEn: "Syrian Pound",  symbol: "ل.س", Flag: SyrianFlagIcon },
];

const L = {
  ar: { balance: "الرصيد", exchange: "صرف العملات", receive: "استلام", send: "إرسال", recent: "آخر المعاملات", emptyTx: "لا توجد معاملات بعد", unknown: "غير معروف" },
  tr: { balance: "Bakiye", exchange: "Döviz", receive: "Al", send: "Gönder", recent: "Son İşlemler", emptyTx: "Henüz işlem yok", unknown: "Bilinmiyor" },
  en: { balance: "Balance", exchange: "Exchange", receive: "Receive", send: "Send", recent: "Recent Transactions", emptyTx: "No transactions yet", unknown: "Unknown" },
};

const dateLocale = { ar: "ar-EG", tr: "tr-TR", en: "en-US" };

export default function AppHome() {
  const { current } = useAuth();
  const { lang } = useLanguage();
  const { theme, toggle } = useTheme();
  const t = L[lang];
  const navigate = useNavigate();
  const [selected, setSelected] = useState("SYP");
  const txs = useMemo(() => current ? getTx(current.email).slice(0, 5) : [], [current]);
  if (!current) return null;

  const wname = (w) => lang === "ar" ? w.nameAr : lang === "tr" ? w.nameTr : w.nameEn;
  const activeWallet = WALLETS.find((w) => w.key === selected);

  const fmtDate = (ts) => {
    try {
      return new Date(ts).toLocaleString(dateLocale[lang], {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      });
    } catch { return ""; }
  };

  return (
    <div className="space-y-5">
      {/* ── Top row: identity (right in RTL) · bell + theme (left) ── */}
      <div className="flex items-center justify-between" data-testid="home-header">
        <div className="flex items-center gap-2" data-testid="home-identity">
          {current.isVerified && <BadgeCheck className="h-5 w-5 fill-emerald-500 text-white" data-testid="verified-badge" />}
          <h1
            className="trycash-gold text-xl font-semibold"
            style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}
            data-testid="home-username"
          >
            {current.fullName || current.firstName}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            data-testid="home-theme-toggle"
            onClick={toggle}
            className="trycash-bell-btn"
            aria-label="theme"
          >
            <Sun className={`h-5 w-5 text-[#d4af37] transition-all duration-500 ${theme === "dark" ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`} strokeWidth={1.75} style={{ position: theme === "dark" ? "absolute" : "static" }} />
            <Moon className={`h-5 w-5 text-[#d4af37] transition-all duration-500 ${theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"}`} strokeWidth={1.75} style={{ position: theme === "light" ? "absolute" : "static" }} />
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* ── Currency selector row (3 mini cards) ── */}
      <div className="grid grid-cols-3 gap-3" data-testid="wallets-list">
        {WALLETS.map((w) => {
          const active = selected === w.key;
          return (
            <button
              key={w.key}
              data-testid={`wallet-${w.key}`}
              onClick={() => setSelected(w.key)}
              className={`trycash-wallet-mini ${active ? "trycash-wallet-mini-active" : ""}`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <w.Flag className="trycash-flag-icon-md" />
              <p className="trycash-amount text-lg leading-none" dir="ltr">{fmtNum(current.wallets[w.key])}</p>
                <p className="text-[10px] font-medium tracking-widest text-[#d4af37]/70">{w.symbol}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Active balance detail card ── */}
      <div className="trycash-balance-hero" data-testid="active-balance-card">
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />

        <div className="flex items-start justify-between gap-3">
          <button
            data-testid="btn-exchange"
            onClick={() => navigate("/app/exchange")}
            className="trycash-exchange-pill"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={1.9} />
            <span>{t.exchange}</span>
          </button>
          <p className="trycash-muted mt-1 text-xs" data-testid="active-balance-label">
            {t.balance} — {wname(activeWallet)}
          </p>
        </div>

        <div className="mt-4 flex items-baseline gap-2" dir="ltr">
          <span className="trycash-gold text-[10px] tracking-widest uppercase">{activeWallet.symbol}</span>
          <p
            className="trycash-amount text-4xl leading-none"
            data-testid="active-balance-amount"
          >
            {fmtNum(current.wallets[activeWallet.key])}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            data-testid="btn-receive"
            onClick={() => navigate("/app/receive")}
            className="trycash-copy-btn flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wider"
          >
            <ArrowDownToLine className="h-4 w-4" />
            {t.receive}
          </button>
          <button
            data-testid="btn-send"
            onClick={() => navigate("/app/send")}
            className="trycash-gold-btn flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wider text-black"
          >
            <Send className="h-4 w-4" />
            {t.send}
          </button>
        </div>
      </div>

      {/* ── Recent transactions ── */}
      <div className="trycash-tx-section" data-testid="recent-tx-section">
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />

        <div className="flex items-center justify-between px-1">
          <button
            data-testid="tx-see-all"
            onClick={() => navigate("/app/transactions")}
            className="trycash-gold-link text-xs"
          >
            {lang === "ar" ? "عرض الكل" : lang === "tr" ? "Tümü" : "See all"}
          </button>
          <h3
            className="trycash-gold text-lg font-semibold"
            style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}
          >
            {t.recent}
          </h3>
        </div>

        <div className="mt-3 space-y-2" data-testid="tx-list">
          {txs.length === 0 && (
            <p className="trycash-muted py-6 text-center text-xs" data-testid="tx-empty">{t.emptyTx}</p>
          )}
          {txs.map((tx) => {
            if (tx.type === "exchange") {
              return (
                <div key={tx.id} className="trycash-tx-row items-start" data-testid={`tx-${tx.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#f1d875]">
                      {lang === "ar" ? "عملية صرف" : lang === "tr" ? "Değişim" : "Exchange"}
                    </p>
                    <p className="trycash-muted mt-0.5 text-[11px]">{fmtDate(tx.ts)}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-rose-400" dir="ltr">-{fmtNum(tx.paid)} {tx.paidCurrency}</p>
                    <p className="mt-0.5 text-xs text-emerald-400" dir="ltr">+{fmtNum(tx.received)} {tx.receivedCurrency}</p>
                  </div>
                </div>
              );
            }
            const isSend = tx.type === "send";
            const sign = isSend ? "-" : "+";
            const colorClass = isSend ? "text-rose-400" : "text-emerald-400";
            return (
              <div key={tx.id} className="trycash-tx-row" data-testid={`tx-${tx.id}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{tx.toName || tx.fromName || t.unknown}</p>
                  <p className="trycash-muted mt-0.5 text-[11px]">{fmtDate(tx.ts)}</p>
                </div>
                <p className={`text-sm font-bold ${colorClass}`} dir="ltr">
                  {sign}{fmtNum(tx.amount)} {tx.currency}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
