import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import TopBar from "../components/TopBar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import SyrianFlag from "../components/SyrianFlag";
import AdminFingerprintModal from "../components/AdminFingerprintModal";
import { toast } from "sonner";

export default function Login() {
  const { t, lang } = useLanguage();
  const { login, completeAdminAuth, verifyAdminSecurity } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pendingAdmin, setPendingAdmin] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(
        lang === "ar" ? "يرجى إدخال البريد وكلمة السر" :
        lang === "tr" ? "Lütfen e-posta ve şifrenizi girin" :
        "Please enter email and password"
      );
      return;
    }
    const res = await login(email.toLowerCase().trim(), password);
    if (res.needsFingerprint) { setPendingAdmin(res.user); return; }
    if (!res.ok) {
      if (res.error === "banned") {
        toast.error(
          (lang === "ar" ? "تم حظر حسابك: " : lang === "tr" ? "Hesabınız yasaklandı: " : "Account banned: ") +
          (res.banReason || "")
        );
        return;
      }
      toast.error(
        lang === "ar" ? "البريد أو كلمة السر غير صحيحة" :
        lang === "tr" ? "E-posta veya şifre yanlış" :
        "Wrong email or password"
      );
      return;
    }
    navigate("/app/home");
  };

  return (
    <div className="trycash-shell relative min-h-screen overflow-hidden">
      {/* Ambient gold glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#d4af37]/15 blur-[120px]" />
        <div className="absolute bottom-0 left-10 h-[300px] w-[300px] rounded-full bg-[#a07a1f]/10 blur-[100px]" />
        <div className="absolute right-10 top-1/3 h-[280px] w-[280px] rounded-full bg-[#0f7b3a]/10 blur-[110px]" />
      </div>

      <TopBar />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 pb-12 pt-24 sm:pt-28">
        {/* Language switcher - ABOVE TRY Cash */}
        <LanguageSwitcher />

        {/* Tagline - "عالم المستقبل" ABOVE TRY Cash (now larger) */}
        <h2
          data-testid="tagline"
          className="trycash-gold mt-10 text-center text-2xl font-medium tracking-[0.35em] sm:text-3xl"
          style={{
            fontFamily: "'Cormorant Garamond', 'Amiri', serif",
            letterSpacing: lang === "ar" ? "0.2em" : "0.35em",
            lineHeight: 1.1,
          }}
        >
          {t.tagline}
        </h2>

        {/* Gold ornamental divider */}
        <div className="trycash-divider mt-4" />

        {/* Syrian Revolution Flag - small, refined */}
        <div className="mt-5 w-20 sm:w-24">
          <SyrianFlag />
        </div>

        {/* TRY Cash Brand */}
        <h1
          data-testid="brand-title"
          className="trycash-gold mt-6 text-center text-6xl font-semibold sm:text-7xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            letterSpacing: "0.01em",
            lineHeight: 1,
          }}
        >
          TRY Cash
        </h1>

        {/* Ornamental gold flourish under brand */}
        <div className="trycash-flourish mt-4" aria-hidden="true">
          <span />
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
          </svg>
          <span />
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          data-testid="login-form"
          className="trycash-card relative mt-12 w-full space-y-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-7 backdrop-blur-xl sm:p-8"
        >
          {/* Corner ornaments */}
          <span className="trycash-corner trycash-corner-tl" />
          <span className="trycash-corner trycash-corner-tr" />
          <span className="trycash-corner trycash-corner-bl" />
          <span className="trycash-corner trycash-corner-br" />

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="trycash-form-label block text-xs font-medium tracking-wider text-[#d4af37]/90 uppercase">
              {t.email}
            </label>
            <div className="trycash-input-wrap">
              <Mail className="trycash-input-icon" strokeWidth={1.6} />
              <input
                data-testid="email-input"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                autoComplete="email"
                className="trycash-input"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="trycash-form-label block text-xs font-medium tracking-wider text-[#d4af37]/90 uppercase">
              {t.password}
            </label>
            <div className="trycash-input-wrap">
              <Lock className="trycash-input-icon" strokeWidth={1.6} />
              <input
                data-testid="password-input"
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                autoComplete="current-password"
                className="trycash-input pr-11"
              />
              <button
                data-testid="toggle-password"
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="trycash-pw-toggle"
                aria-label="toggle password"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Forgot password link */}
          <div className={`flex ${lang === "ar" ? "justify-start" : "justify-end"} -mt-1`}>
            <button
              data-testid="forgot-password-link"
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="trycash-gold-link text-xs"
            >
              {t.forgotPassword}
            </button>
          </div>

          {/* Login button - gold with black text */}
          <button
            data-testid="login-button"
            type="submit"
            className="trycash-gold-btn group relative mt-3 w-full overflow-hidden rounded-xl py-3.5 text-base font-bold tracking-[0.2em] text-black"
          >
            <span className="relative z-10">{t.login}</span>
            <span className="trycash-gold-shine" />
          </button>
        </form>

        {/* Create account — text-style gold link */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <span className="trycash-muted">
            {lang === "ar" && "لا تملك حساباً؟"}
            {lang === "tr" && "Hesabınız yok mu?"}
            {lang === "en" && "Don't have an account?"}
          </span>
          <button
            data-testid="signup-button"
            type="button"
            onClick={() => navigate("/signup")}
            className="trycash-gold-link"
          >
            {t.createAccount}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500" data-testid="footer-note">
          © {new Date().getFullYear()} TRY Cash · {t.tagline}
        </p>
      </main>
      {pendingAdmin && (
        <AdminFingerprintModal
          onSuccess={() => { completeAdminAuth(); setPendingAdmin(null); navigate("/app/home"); }}
          onCancel={() => setPendingAdmin(null)}
          verifyAnswer={verifyAdminSecurity}
        />
      )}
    </div>
  );
}
