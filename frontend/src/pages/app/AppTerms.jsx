import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { TERMS_TEXT } from "../../data/terms";

export default function AppTerms() {
  const { current } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const T = TERMS_TEXT[lang];
  const acceptance = current ? JSON.parse(localStorage.getItem("trycash_terms_" + current.email) || "null") : null;

  return (
    <div className="space-y-5" data-testid="terms-page">
      <div className="flex items-center justify-between">
        <button data-testid="terms-back" onClick={() => navigate(-1)} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <h1 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{T.readTitle}</h1>
        <div className="w-10" />
      </div>

      {acceptance && (
        <div className="trycash-info-banner rounded-xl px-4 py-3 text-xs" data-testid="terms-acceptance-notice">
          ✓ {T.acceptedNotice} {new Date(acceptance.ts).toLocaleDateString("en-US")}
        </div>
      )}

      <div className="trycash-card relative rounded-2xl border border-[#d4af37]/25 bg-black/40 p-6 backdrop-blur-xl max-h-[70vh] overflow-y-auto" data-testid="terms-content">
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />
        <h2 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{T.title}</h2>
        <p className="trycash-muted mt-1 text-xs">{T.version}</p>
        <div className="mt-4 space-y-4">
          {T.sections.map((s) => (
            <div key={s.h}>
              <h3 className="text-sm font-semibold text-[#d4af37]">{s.h}</h3>
              <p className="mt-1 text-xs leading-relaxed opacity-85">{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
