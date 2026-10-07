import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowLeftRight, ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth, getTx, fmtNum } from "../../contexts/AuthContext";

const L = {
  ar: {
    title: "المعاملات",
    empty: "لا توجد معاملات",
    all: "الكل",
    exchange: "الصرف",
    sent: "المرسلة",
    received: "المستلمة",
    labelExchange: "عملية صرف",
    paid: "دفع",
    receivedLbl: "استلم",
  },
  tr: {
    title: "İşlemler",
    empty: "İşlem yok",
    all: "Tümü",
    exchange: "Değişim",
    sent: "Gönderilen",
    received: "Alınan",
    labelExchange: "Değişim",
    paid: "Ödedi",
    receivedLbl: "Aldı",
  },
  en: {
    title: "Transactions",
    empty: "No transactions",
    all: "All",
    exchange: "Exchange",
    sent: "Sent",
    received: "Received",
    labelExchange: "Exchange",
    paid: "Paid",
    receivedLbl: "Received",
  },
};

const dateLocale = { ar: "ar-EG", tr: "tr-TR", en: "en-US" };

const FILTERS = [
  { key: "all",      testid: "filter-all" },
  { key: "exchange", testid: "filter-exchange" },
  { key: "sent",     testid: "filter-sent" },
  { key: "received", testid: "filter-received" },
];

export default function AppTransactions() {
  const { current } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = L[lang];
  const [filter, setFilter] = useState("all");

  const list = useMemo(() => current ? getTx(current.email) : [], [current]);
  if (!current) return null;

  const filtered = list.filter((tx) => {
    if (filter === "all") return true;
    if (filter === "exchange") return tx.type === "exchange";
    if (filter === "sent") return tx.type === "send";
    if (filter === "received") return tx.type === "received";
    return true;
  });

  const fmtDate = (ts) => {
    try {
      return new Date(ts).toLocaleString(dateLocale[lang], {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      });
    } catch { return ""; }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button data-testid="tx-back" onClick={() => navigate("/app/home")} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <h1 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }} data-testid="tx-title">{t.title}</h1>
        <div className="w-10" />
      </div>

      {/* Filter tabs */}
      <div className="trycash-tx-filters" data-testid="tx-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            data-testid={f.testid}
            onClick={() => setFilter(f.key)}
            className={`trycash-tx-filter ${filter === f.key ? "trycash-tx-filter-active" : ""}`}
          >
            {t[f.key]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="trycash-muted py-20 text-center text-sm" data-testid="tx-empty">{t.empty}</p>
      )}

      <div className="space-y-2" data-testid="tx-list">
        {filtered.map((tx) => (
          <TxCard key={tx.id} tx={tx} t={t} lang={lang} fmtDate={fmtDate} />
        ))}
      </div>
    </div>
  );
}

function TxCard({ tx, t, lang, fmtDate }) {
  if (tx.type === "exchange") {
    return (
      <div className="trycash-tx-row items-start" data-testid={`tx-${tx.id}`}>
        <div className="flex flex-1 items-start gap-3 min-w-0">
          <div className="trycash-tx-icon trycash-tx-icon-exchange">
            <ArrowLeftRight className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#f1d875]" data-testid={`tx-label-${tx.id}`}>{t.labelExchange}</p>
            <p className="trycash-muted mt-0.5 text-[11px]">{fmtDate(tx.ts)}</p>
          </div>
        </div>
        <div className="text-end">
          <p className="text-xs text-rose-400" dir="ltr" data-testid={`tx-paid-${tx.id}`}>
            <span className="trycash-muted me-1 text-[10px]">{t.paid}:</span>
            -{fmtNum(tx.paid)} {tx.paidCurrency}
          </p>
          <p className="mt-0.5 text-xs text-emerald-400" dir="ltr" data-testid={`tx-received-${tx.id}`}>
            <span className="trycash-muted me-1 text-[10px]">{t.receivedLbl}:</span>
            +{fmtNum(tx.received)} {tx.receivedCurrency}
          </p>
        </div>
      </div>
    );
  }

  const isSend = tx.type === "send";
  const isReceived = tx.type === "received";
  const sign = isSend ? "-" : "+";
  const color = isSend ? "text-rose-400" : "text-emerald-400";
  const Icon = isSend ? ArrowUpRight : (isReceived ? ArrowDownLeft : Wallet);
  const bgClass = isSend ? "trycash-tx-icon-send" : "trycash-tx-icon-recv";

  return (
    <div className="trycash-tx-row" data-testid={`tx-${tx.id}`}>
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className={`trycash-tx-icon ${bgClass}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{tx.toName || tx.fromName || tx.to || "—"}</p>
          <p className="trycash-muted mt-0.5 text-[11px]">{fmtDate(tx.ts)}</p>
        </div>
      </div>
      <p className={`text-sm font-bold ${color}`} dir="ltr">
        {sign}{fmtNum(tx.amount)} {tx.currency}
      </p>
    </div>
  );
}
