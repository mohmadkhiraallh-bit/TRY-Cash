import { useLanguage } from "../contexts/LanguageContext";

export const LanguageSwitcher = () => {
  const { lang, setLang, translations } = useLanguage();
  const order = ["ar", "tr", "en"];

  return (
    <div
      data-testid="language-switcher"
      className="trycash-lang-pill inline-flex items-center gap-1 rounded-full p-1 backdrop-blur-md"
    >
      {order.map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            data-testid={`lang-btn-${code}`}
            onClick={() => setLang(code)}
            className={`relative rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-300 sm:text-sm ${
              active
                ? "bg-gradient-to-b from-[#f1d875] via-[#d4af37] to-[#a07a1f] text-black shadow-[0_2px_12px_rgba(212,175,55,0.45)]"
                : "trycash-lang-inactive"
            }`}
            aria-pressed={active}
          >
            {translations[code].name}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
