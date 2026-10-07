import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function AppServices() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const title = lang === "ar" ? "الخدمات" : lang === "tr" ? "Hizmetler" : "Services";
  const soon = lang === "ar" ? "قيد التطوير — قريباً" : lang === "tr" ? "Yakında" : "Coming soon";
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button data-testid="services-back" onClick={() => navigate("/app/home")} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <h1 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{title}</h1>
        <div className="w-10" />
      </div>
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Wrench className="h-14 w-14 text-[#d4af37]/60" strokeWidth={1.3} />
        <p className="trycash-muted text-sm">{soon}</p>
      </div>
    </div>
  );
}
