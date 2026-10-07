import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowLeftRight, ArrowRight, X, Check } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth, fmtNum, getRates, executeExchange, refreshRatesCache } from "../../contexts/AuthContext";
import { SyrianFlagIcon, TurkishFlagIcon, USFlagIcon } from "../../components/Flags";
import { toast } from "sonner";

const CUR = {
  SYP: { Flag: SyrianFlagIcon, symbol: "ل.س", nameAr: "الليرة السورية", nameTr: "SYP", nameEn: "SYP" },
  USD: { Flag: USFlagIcon,     symbol: "$",   nameAr: "الدولار",         nameTr: "USD", nameEn: "USD" },
  TRY: { Flag: TurkishFlagIcon,symbol: "₺",   nameAr: "الليرة التركية",   nameTr: "TRY", nameEn: "TRY" },
};

const L = {
  ar: {
    title: "صرف العملات",
    from: "من", to: "إلى",
    amount: "المبلغ", receive: "ستستلم",
    rate: "السعر",
    exchange: "صرف",
    confirmTitle: "تأكيد عملية الصرف",
    confirmDesc: "الرجاء مراجعة التفاصيل قبل التأكيد",
    youPay: "تدفع",
    youGet: "تستلم",
    confirm: "تأكيد",
    cancel: "إلغاء",
    ok: "تم الصرف بنجاح",
    noRoute: "الصرف بين هاتين العملتين غير متاح — يجب أن تكون إحداهما الليرة السورية",
    insufficient: "رصيدك غير كافٍ",
    zeroAmount: "أدخل مبلغاً صحيحاً",
    liquidity: "السيولة المتاحة لدينا غير كافية حالياً، الرجاء المحاولة لاحقاً",
    swap: "تبديل",
  },
  tr: {
    title: "Döviz Değişimi",
    from: "Kaynak", to: "Hedef",
    amount: "Tutar", receive: "Alacağınız",
    rate: "Kur",
    exchange: "Değiştir",
    confirmTitle: "Değişimi Onayla",
    confirmDesc: "Onaylamadan önce lütfen bilgileri kontrol edin",
    youPay: "Ödersiniz",
    youGet: "Alırsınız",
    confirm: "Onayla",
    cancel: "İptal",
    ok: "Değişim başarılı",
    noRoute: "Bu iki para birimi arasında değişim yok — birinin SYP olması gerekiyor",
    insufficient: "Yetersiz bakiye",
    zeroAmount: "Geçerli bir tutar girin",
    liquidity: "Şu anda yeterli likidite yok, lütfen sonra tekrar deneyin",
    swap: "Değiştir",
  },
  en: {
    title: "Currency Exchange",
    from: "From", to: "To",
    amount: "Amount", receive: "You'll receive",
    rate: "Rate",
    exchange: "Exchange",
    confirmTitle: "Confirm Exchange",
    confirmDesc: "Please review the details before confirming",
    youPay: "You pay",
    youGet: "You receive",
    confirm: "Confirm",
    cancel: "Cancel",
    ok: "Exchange completed",
    noRoute: "Exchange between these currencies isn't available — one side must be SYP",
    insufficient: "Insufficient balance",
    zeroAmount: "Enter a valid amount",
    liquidity: "Not enough liquidity right now, please try later",
    swap: "Swap",
  },
};

/* Compute what user will receive.
   Rules:
     - Only SYP ↔ {USD, TRY} routes allowed
     - Selling foreign (from = foreign, to = SYP): received = amount * sellRate
     - Buying foreign (from = SYP,     to = foreign): received = amount / buyRate
*/
function computeQuote(from, to, amount, rates) {
  const a = Number(amount) || 0;
  if (a <= 0) return { ok: false, reason: "zero" };
  if (from === to) return { ok: false, reason: "same" };
  if (from !== "SYP" && to !== "SYP") return { ok: false, reason: "route" };

  if (from !== "SYP" && to === "SYP") {
    const rate = rates[from]?.sell || 0;
    if (rate <= 0) return { ok: false, reason: "rate" };
    return { ok: true, received: a * rate, rate, side: "sell", foreign: from };
  }
  if (from === "SYP" && to !== "SYP") {
    const rate = rates[to]?.buy || 0;
    if (rate <= 0) return { ok: false, reason: "rate" };
    return { ok: true, received: a / rate, rate, side: "buy", foreign: to };
  }
  return { ok: false, reason: "route" };
}

function CurrencyPicker({ value, onChange, testid, disabledKey }) {
  return (
    <div className="flex items-center gap-2" data-testid={testid}>
      {Object.keys(CUR).map((k) => {
        const active = value === k;
        const disabled = k === disabledKey;
        const F = CUR[k].Flag;
        return (
          <button
            key={k}
            data-testid={`${testid}-${k}`}
            disabled={disabled}
            onClick={() => onChange(k)}
            className={`trycash-cur-pill ${active ? "trycash-cur-pill-active" : ""} ${disabled ? "trycash-cur-pill-disabled" : ""}`}
          >
            <F className="trycash-flag-icon-sm" />
            <span className="text-xs font-bold tracking-wider">{k}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function AppExchange() {
  const { lang } = useLanguage();
  const t = L[lang];
  const navigate = useNavigate();
  const { current, refreshCurrent } = useAuth();

  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("SYP");
  const [amount, setAmount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [ratesCache, setRatesCache] = useState(getRates());
  useEffect(() => { refreshRatesCache().then(setRatesCache); }, []);
  const rates = ratesCache;
  const quote = useMemo(() => computeQuote(from, to, amount, rates), [from, to, amount, rates]);

  if (!current) return null;

  const cname = (k) => lang === "ar" ? CUR[k].nameAr : lang === "tr" ? CUR[k].nameTr : CUR[k].nameEn;
  const balance = current.wallets?.[from] || 0;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const proceed = () => {
    if (!quote.ok) {
      if (quote.reason === "route") return toast.error(t.noRoute);
      if (quote.reason === "zero" || quote.reason === "same") return toast.error(t.zeroAmount);
      return toast.error(t.zeroAmount);
    }
    if (Number(amount) > balance) return toast.error(t.insufficient);
    setConfirming(true);
  };

  const doExchange = async () => {
    const res = await executeExchange({
      from, to,
      fromAmount: Number(amount),
    });
    if (!res.ok) {
      if (res.error === "insufficient_liquidity") toast.error(t.liquidity);
      else if (res.error === "insufficient_balance") toast.error(t.insufficient);
      else toast.error(res.error || "Error");
      setConfirming(false);
      return;
    }
    toast.success(t.ok);
    setConfirming(false);
    setAmount("");
    refreshCurrent();
    setTimeout(() => navigate("/app/home"), 200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button data-testid="exchange-back" onClick={() => navigate("/app/home")} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <h1 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }} data-testid="exchange-title">
          {t.title}
        </h1>
        <div className="w-10" />
      </div>

      {/* From */}
      <div className="trycash-balance-hero" data-testid="exchange-from-card">
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-[#d4af37]/60">
            {lang === "ar" ? `الرصيد: ${fmtNum(balance)} ${CUR[from].symbol}` : `Balance: ${fmtNum(balance)} ${CUR[from].symbol}`}
          </span>
          <span className="trycash-gold text-xs font-semibold tracking-widest">{t.from}</span>
        </div>

        <div className="mt-3">
          <CurrencyPicker value={from} onChange={(k) => { if (k === to) setTo(from); setFrom(k); }} testid="exchange-from-picker" disabledKey={to !== "SYP" && from !== "SYP" ? null : null} />
        </div>

        <input
          data-testid="exchange-amount-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          className="trycash-input mt-4 w-full text-end text-2xl font-bold"
          style={{ paddingInline: "1rem", paddingBlock: "0.75rem" }}
          dir="ltr"
          inputMode="decimal"
        />
      </div>

      {/* Swap */}
      <div className="flex justify-center">
        <button
          data-testid="exchange-swap-btn"
          onClick={swap}
          className="trycash-exchange-swap"
          aria-label={t.swap}
        >
          <ArrowLeftRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* To */}
      <div className="trycash-balance-hero" data-testid="exchange-to-card">
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-[#d4af37]/60">
            {quote.ok ? `${t.rate} · 1 ${quote.foreign} = ${fmtNum(quote.rate)} SYP` : ""}
          </span>
          <span className="trycash-gold text-xs font-semibold tracking-widest">{t.to}</span>
        </div>

        <div className="mt-3">
          <CurrencyPicker value={to} onChange={(k) => { if (k === from) setFrom(to); setTo(k); }} testid="exchange-to-picker" />
        </div>

        <div
          className="trycash-input mt-4 w-full text-end text-2xl font-bold"
          style={{ fontFamily: "'Cormorant Garamond', serif", paddingInline: "1rem", paddingBlock: "0.75rem" }}
          dir="ltr"
          data-testid="exchange-received-display"
        >
          {quote.ok ? fmtNum(quote.received) : "—"}
        </div>
      </div>

      <button
        data-testid="exchange-submit-btn"
        onClick={proceed}
        disabled={!quote.ok}
        className="trycash-gold-btn mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold tracking-wider text-black disabled:opacity-40"
      >
        <ArrowLeftRight className="h-4 w-4" strokeWidth={2} />
        <span>{t.exchange}</span>
      </button>

      {/* Confirmation modal */}
      {confirming && (
        <div className="trycash-modal-overlay" data-testid="exchange-confirm-modal" onClick={() => setConfirming(false)}>
          <div className="trycash-modal-panel" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setConfirming(false)} className="absolute right-3 top-3 text-[#d4af37]/70 hover:text-[#d4af37]" data-testid="exchange-confirm-close">
              <X className="h-4 w-4" />
            </button>
            <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>
              {t.confirmTitle}
            </h3>
            <p className="trycash-muted mt-1 text-xs">{t.confirmDesc}</p>

            <div className="mt-5 space-y-3">
              <div className="trycash-confirm-row" data-testid="confirm-you-pay">
                <div>
                  <p className="trycash-muted text-[11px]">{t.youPay}</p>
                  <p className="text-sm text-rose-400" dir="ltr">
                    {fmtNum(Number(amount))} {from} <span className="opacity-60">({cname(from)})</span>
                  </p>
                </div>
                <ArrowRight className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
              </div>
              <div className="trycash-confirm-row" data-testid="confirm-you-get">
                <div>
                  <p className="trycash-muted text-[11px]">{t.youGet}</p>
                  <p className="text-sm text-emerald-400" dir="ltr">
                    {fmtNum(quote.received || 0)} {to} <span className="opacity-60">({cname(to)})</span>
                  </p>
                </div>
                <Check className="h-4 w-4 text-emerald-400" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button data-testid="exchange-confirm-cancel" onClick={() => setConfirming(false)} className="trycash-gold-outline-btn rounded-xl py-3 text-sm font-semibold">
                {t.cancel}
              </button>
              <button data-testid="exchange-confirm-ok" onClick={doExchange} className="trycash-gold-btn rounded-xl py-3 text-sm font-bold text-black">
                <span className="relative z-10">{t.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
