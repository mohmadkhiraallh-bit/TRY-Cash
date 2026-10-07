import { Headphones, Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export const TopBar = () => {
  const { theme, toggle } = useTheme();
  const { t, lang } = useLanguage();

  return (
    <div dir="ltr" className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
      {/* Support button - left corner */}
      <Dialog>
        <DialogTrigger asChild>
          <button
            data-testid="support-button"
            aria-label={t.support}
            className="trycash-icon-btn group inline-flex h-11 w-11 items-center justify-center rounded-full transition-all"
          >
            <Headphones className="h-5 w-5 text-[#d4af37] transition-transform group-hover:scale-110" strokeWidth={1.75} />
          </button>
        </DialogTrigger>
        <DialogContent className="border-[#d4af37]/30 bg-[#0a0a0a] text-white sm:max-w-md" data-testid="support-dialog">
          <DialogHeader>
            <DialogTitle className="text-[#d4af37]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {t.support}
            </DialogTitle>
            <DialogDescription className="text-zinc-300">
              {lang === "ar" && "فريق دعم TRY Cash متواجد على مدار الساعة. تواصل معنا عبر:"}
              {lang === "tr" && "TRY Cash destek ekibi 7/24 hizmetinizdedir. Bizimle iletişime geçin:"}
              {lang === "en" && "TRY Cash support team is available 24/7. Contact us at:"}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-[#d4af37]/20 bg-black/40 px-4 py-3">
              <span className="text-zinc-400">Email</span>
              <span className="font-mono text-[#d4af37]">support@trycash.app</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#d4af37]/20 bg-black/40 px-4 py-3">
              <span className="text-zinc-400">Telegram</span>
              <span className="font-mono text-[#d4af37]">@TRYCashSupport</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Theme toggle - right corner */}
      <button
        data-testid="theme-toggle"
        aria-label={t.theme}
        onClick={toggle}
        className="trycash-icon-btn group relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-all"
      >
        <Sun
          className={`h-5 w-5 text-[#d4af37] transition-all duration-500 ${
            theme === "dark" ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          }`}
          strokeWidth={1.75}
          style={{ position: theme === "dark" ? "absolute" : "static" }}
        />
        <Moon
          className={`h-5 w-5 text-[#d4af37] transition-all duration-500 ${
            theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"
          }`}
          strokeWidth={1.75}
          style={{ position: theme === "light" ? "absolute" : "static" }}
        />
      </button>
    </div>
  );
};

export default TopBar;
