import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Share2, Check } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { toast } from "sonner";

const L = {
  ar: { title: "استقبال الأموال", subtitle: "شارك عنوانك لاستقبال المدفوعات", copy: "نسخ", copied: "تم النسخ ✓", share: "مشاركة", addressLabel: "عنوانك" },
  tr: { title: "Para Al", subtitle: "Ödeme almak için adresinizi paylaşın", copy: "Kopyala", copied: "Kopyalandı ✓", share: "Paylaş", addressLabel: "Adresiniz" },
  en: { title: "Receive Money", subtitle: "Share your address to receive payments", copy: "Copy", copied: "Copied ✓", share: "Share", addressLabel: "Your address" },
};

export default function AppReceive() {
  const { current } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = L[lang];
  const [copied, setCopied] = useState(false);
  if (!current) return null;

  // Classic QR: black on white, high error-correction so center overlay is safe
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(current.address)}&color=000000&bgcolor=FFFFFF&margin=10&qzone=2&ecc=H`;

  const doCopy = async () => {
    await navigator.clipboard.writeText(current.address);
    setCopied(true);
    toast.success(t.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const doShare = async () => {
    const text = `TRY Cash · ${current.fullName || current.firstName}\n${current.address}`;
    if (navigator.share) {
      try { await navigator.share({ title: "TRY Cash", text }); } catch (err) { /* user canceled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success(t.copied);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button data-testid="receive-back" onClick={() => navigate("/app/home")} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <h1 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.title}</h1>
        <div className="w-10" />
      </div>
      <p className="trycash-muted text-center text-sm">{t.subtitle}</p>

      <div className="trycash-card relative mt-4 flex flex-col items-center rounded-2xl border border-[#d4af37]/25 bg-black/40 p-6 backdrop-blur-xl">
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />

        <div className="trycash-qr-frame" data-testid="qr-frame">
          <div className="trycash-qr-inner">
            <img src={qrUrl} alt="QR" className="trycash-qr-img" data-testid="qr-image" />
            <div className="trycash-qr-logo" data-testid="qr-logo">TC</div>
          </div>
        </div>

        <div className="mt-5 w-full">
          <p className="mb-1.5 text-xs uppercase tracking-wider text-[#d4af37]/80 text-center">{t.addressLabel}</p>
          <p data-testid="user-address" dir="ltr" className="trycash-address">{current.address}</p>
        </div>

        <div className="mt-5 grid w-full grid-cols-2 gap-3">
          <button data-testid="receive-copy-btn" onClick={doCopy} className={`trycash-copy-btn flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wider ${copied ? "trycash-copy-done" : ""}`}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t.copied : t.copy}
          </button>
          <button data-testid="receive-share-btn" onClick={doShare} className="trycash-gold-btn flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wider text-black">
            <Share2 className="h-4 w-4" />
            {t.share}
          </button>
        </div>
      </div>
    </div>
  );
}
