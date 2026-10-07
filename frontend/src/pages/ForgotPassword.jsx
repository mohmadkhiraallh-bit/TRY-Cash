import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Mail, User, KeyRound, Lock, Eye, EyeOff, Check, X, ShieldCheck,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import TopBar from "../components/TopBar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { verifySecurityCode, getResetOtp } from "../utils/securityCode";
import { toast } from "sonner";

const PW_REQS_RE = {
  len: (v) => v.length >= 8,
  upper: (v) => /[A-Z]/.test(v),
  lower: (v) => /[a-z]/.test(v),
  digit: (v) => /[0-9]/.test(v),
  sym: (v) => /[._-]/.test(v),
  noOther: (v) => v.length > 0 && !/[^\w._-]/.test(v),
};

const T = {
  ar: {
    titleA: "استعادة كلمة السر",
    subA: "أدخل بريدك الإلكتروني واسمك للمتابعة",
    titleB: "التحقق من الهوية",
    subB: "أدخل رمز التحقق المؤلف من 6 أرقام المُرسل لك",
    titleC: "كلمة سر جديدة",
    subC: "ألصق رمز الأمان الفريد واختر كلمة سر جديدة",
    successTitle: "تم تحديث كلمة السر",
    successSub: "يمكنك الآن تسجيل الدخول بكلمة السر الجديدة",
    email: "البريد الإلكتروني",
    name: "الاسم",
    otp: "رمز التحقق",
    otpHint: "رمز تجريبي: 123456",
    secCode: "رمز الأمان الفريد",
    secCodeHint: "ألصق الرمز المكوّن من 15 حرفاً الذي حصلت عليه عند إنشاء الحساب",
    newPw: "كلمة السر الجديدة",
    confirmPw: "تأكيد كلمة السر",
    next: "التالي",
    finish: "حفظ كلمة السر",
    backToLogin: "العودة لتسجيل الدخول",
    backStep: "السابق",
    errMissing: "يرجى تعبئة جميع الحقول",
    errOtpInvalid: "رمز التحقق غير صحيح",
    errOtpLen: "رمز التحقق يجب أن يكون 6 أرقام",
    errSecInvalid: "رمز الأمان غير صحيح. لم يتم تغيير كلمة السر.",
    errPwWeak: "كلمة السر لا تستوفي المتطلبات",
    errPwMismatch: "كلمتا السر غير متطابقتين",
    pwReqLen: "8 أحرف على الأقل",
    pwReqUpper: "حرف كبير (A-Z)",
    pwReqLower: "حرف صغير (a-z)",
    pwReqDigit: "رقم (0-9)",
    pwReqSym: "رمز مسموح ( . _ - )",
    pwReqNoOther: "بدون رموز أخرى",
  },
  tr: {
    titleA: "Şifre Sıfırlama",
    subA: "Devam etmek için e-postanızı ve adınızı girin",
    titleB: "Kimlik Doğrulama",
    subB: "Size gönderilen 6 haneli doğrulama kodunu girin",
    titleC: "Yeni Şifre",
    subC: "Benzersiz güvenlik kodunu yapıştırın ve yeni bir şifre seçin",
    successTitle: "Şifre Güncellendi",
    successSub: "Artık yeni şifrenizle giriş yapabilirsiniz",
    email: "E-posta",
    name: "Ad",
    otp: "Doğrulama Kodu",
    otpHint: "Test kodu: 123456",
    secCode: "Benzersiz Güvenlik Kodu",
    secCodeHint: "Hesabı oluştururken aldığınız 15 karakterlik kodu yapıştırın",
    newPw: "Yeni Şifre",
    confirmPw: "Şifreyi Onayla",
    next: "İleri",
    finish: "Şifreyi Kaydet",
    backToLogin: "Girişe Dön",
    backStep: "Geri",
    errMissing: "Lütfen tüm alanları doldurun",
    errOtpInvalid: "Doğrulama kodu yanlış",
    errOtpLen: "Doğrulama kodu 6 haneli olmalıdır",
    errSecInvalid: "Güvenlik kodu yanlış. Şifre değiştirilmedi.",
    errPwWeak: "Şifre gereksinimleri karşılamıyor",
    errPwMismatch: "Şifreler eşleşmiyor",
    pwReqLen: "En az 8 karakter",
    pwReqUpper: "Büyük harf (A-Z)",
    pwReqLower: "Küçük harf (a-z)",
    pwReqDigit: "Rakam (0-9)",
    pwReqSym: "İzin verilen sembol ( . _ - )",
    pwReqNoOther: "Başka sembol yok",
  },
  en: {
    titleA: "Reset Password",
    subA: "Enter your email and name to continue",
    titleB: "Identity Verification",
    subB: "Enter the 6-digit verification code sent to you",
    titleC: "New Password",
    subC: "Paste the unique security code and choose a new password",
    successTitle: "Password Updated",
    successSub: "You can now sign in with your new password",
    email: "Email",
    name: "Name",
    otp: "Verification Code",
    otpHint: "Test code: 123456",
    secCode: "Unique Security Code",
    secCodeHint: "Paste the 15-character code you received when creating the account",
    newPw: "New Password",
    confirmPw: "Confirm Password",
    next: "Next",
    finish: "Save Password",
    backToLogin: "Back to Sign In",
    backStep: "Back",
    errMissing: "Please fill in all fields",
    errOtpInvalid: "Verification code is incorrect",
    errOtpLen: "Verification code must be 6 digits",
    errSecInvalid: "Security code is incorrect. Password was not changed.",
    errPwWeak: "Password doesn't meet requirements",
    errPwMismatch: "Passwords don't match",
    pwReqLen: "At least 8 characters",
    pwReqUpper: "Uppercase (A-Z)",
    pwReqLower: "Lowercase (a-z)",
    pwReqDigit: "Digit (0-9)",
    pwReqSym: "Allowed symbol ( . _ - )",
    pwReqNoOther: "No other symbols",
  },
};

export default function ForgotPassword() {
  const { lang } = useLanguage();
  const tr = T[lang];
  const navigate = useNavigate();

  const [stage, setStage] = useState("A"); // A → B → C → SUCCESS
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [secCode, setSecCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [showPw, setShowPw] = useState(false);

  const pwReqs = useMemo(() => ({
    len: PW_REQS_RE.len(newPw),
    upper: PW_REQS_RE.upper(newPw),
    lower: PW_REQS_RE.lower(newPw),
    digit: PW_REQS_RE.digit(newPw),
    sym: PW_REQS_RE.sym(newPw),
    noOther: PW_REQS_RE.noOther(newPw),
  }), [newPw]);
  const pwStrong = Object.values(pwReqs).every(Boolean);
  const pwMatch = newPw && newPw2 && newPw === newPw2;

  // Auto-focus OTP input on stage B
  const otpRef = useRef(null);
  useEffect(() => {
    if (stage === "B") setTimeout(() => otpRef.current?.focus(), 200);
  }, [stage]);

  const handleA = (e) => {
    e.preventDefault();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email) || !name.trim()) return toast.error(tr.errMissing);
    // MOCKED: pretend we sent an OTP
    toast.success(`OTP: ${getResetOtp()}`, { duration: 5000 });
    setStage("B");
  };

  const handleB = (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error(tr.errOtpLen);
    if (otp !== getResetOtp()) return toast.error(tr.errOtpInvalid);
    setStage("C");
  };

  const handleC = (e) => {
    e.preventDefault();
    if (!secCode || !newPw || !newPw2) return toast.error(tr.errMissing);
    if (!pwStrong) return toast.error(tr.errPwWeak);
    if (newPw !== newPw2) return toast.error(tr.errPwMismatch);

    // Verify the security code against the email's stored unique code
    if (!verifySecurityCode(email, secCode)) {
      return toast.error(tr.errSecInvalid);
    }
    // Password updated (MOCKED — backend will hash & store on next phase)
    setStage("SUCCESS");
  };

  const progressPct = stage === "A" ? 33 : stage === "B" ? 66 : stage === "C" ? 100 : 100;

  return (
    <div className="trycash-shell relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#d4af37]/15 blur-[120px]" />
        <div className="absolute right-10 top-1/3 h-[280px] w-[280px] rounded-full bg-[#0f7b3a]/10 blur-[110px]" />
      </div>

      <TopBar />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-6 pb-12 pt-24 sm:pt-28">
        <LanguageSwitcher />

        {/* Progress bar */}
        {stage !== "SUCCESS" && (
          <div className="trycash-progress-wrap mt-7">
            <div className="trycash-progress-labels">
              <span className="text-xs uppercase tracking-wider text-[#d4af37]/80">{T[lang].titleA}</span>
              <span className="trycash-progress-pct">{progressPct}%</span>
            </div>
            <div className="trycash-progress-track">
              <div className="trycash-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <h1
          data-testid="forgot-title"
          className="trycash-gold mt-6 text-center text-4xl font-semibold sm:text-5xl"
          style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic", lineHeight: 1.1 }}
        >
          {stage === "A" && tr.titleA}
          {stage === "B" && tr.titleB}
          {stage === "C" && tr.titleC}
          {stage === "SUCCESS" && tr.successTitle}
        </h1>
        <div className="trycash-divider mt-4" />
        <p className="trycash-muted mt-3 text-center text-sm" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif" }}>
          {stage === "A" && tr.subA}
          {stage === "B" && tr.subB}
          {stage === "C" && tr.subC}
          {stage === "SUCCESS" && tr.successSub}
        </p>

        {stage === "A" && (
          <form onSubmit={handleA} data-testid="forgot-form-a" className="trycash-card relative mt-8 w-full space-y-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-7 backdrop-blur-xl sm:p-8">
            <span className="trycash-corner trycash-corner-tl" />
            <span className="trycash-corner trycash-corner-tr" />
            <span className="trycash-corner trycash-corner-bl" />
            <span className="trycash-corner trycash-corner-br" />

            <FieldFP label={tr.email}>
              <div className="trycash-input-wrap">
                <Mail className="trycash-input-icon" strokeWidth={1.6} />
                <input data-testid="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@trycash.app" dir="ltr" className="trycash-input" />
              </div>
            </FieldFP>

            <FieldFP label={tr.name}>
              <div className="trycash-input-wrap">
                <User className="trycash-input-icon" strokeWidth={1.6} />
                <input data-testid="fp-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="trycash-input" />
              </div>
            </FieldFP>

            <NextBtnFP lang={lang} label={tr.next} testid="fp-next-a" />
          </form>
        )}

        {stage === "B" && (
          <form onSubmit={handleB} data-testid="forgot-form-b" className="trycash-card relative mt-8 w-full space-y-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-7 backdrop-blur-xl sm:p-8">
            <span className="trycash-corner trycash-corner-tl" />
            <span className="trycash-corner trycash-corner-tr" />
            <span className="trycash-corner trycash-corner-bl" />
            <span className="trycash-corner trycash-corner-br" />

            <FieldFP label={tr.otp}>
              <div className="trycash-input-wrap">
                <ShieldCheck className="trycash-input-icon" strokeWidth={1.6} />
                <input
                  ref={otpRef}
                  data-testid="fp-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  dir="ltr"
                  className="trycash-input"
                  style={{ letterSpacing: "0.6em", fontSize: "1.25rem", textAlign: "center", paddingLeft: "1rem", paddingRight: "1rem" }}
                />
              </div>
              <p className="trycash-muted mt-1 text-center text-xs">{tr.otpHint}</p>
            </FieldFP>

            <div className="flex items-center gap-3">
              <button type="button" data-testid="fp-back-b" onClick={() => setStage("A")} className="trycash-gold-outline-btn flex-1 rounded-xl py-3 text-sm font-semibold tracking-wider">
                {tr.backStep}
              </button>
              <div className="flex-[2]">
                <NextBtnFP lang={lang} label={tr.next} testid="fp-next-b" />
              </div>
            </div>
          </form>
        )}

        {stage === "C" && (
          <form onSubmit={handleC} data-testid="forgot-form-c" className="trycash-card relative mt-8 w-full space-y-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-7 backdrop-blur-xl sm:p-8">
            <span className="trycash-corner trycash-corner-tl" />
            <span className="trycash-corner trycash-corner-tr" />
            <span className="trycash-corner trycash-corner-bl" />
            <span className="trycash-corner trycash-corner-br" />

            <FieldFP label={tr.secCode}>
              <div className="trycash-input-wrap">
                <KeyRound className="trycash-input-icon" strokeWidth={1.6} />
                <input
                  data-testid="fp-seccode"
                  type="text"
                  value={secCode}
                  onChange={(e) => setSecCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                  placeholder="ABCDEFGHIJKLMNO"
                  maxLength={15}
                  dir="ltr"
                  className="trycash-input"
                  style={{ letterSpacing: "0.2em", fontFamily: "Courier New, monospace", fontWeight: 700 }}
                />
              </div>
              <p className="trycash-muted mt-1 text-xs">{tr.secCodeHint}</p>
            </FieldFP>

            <FieldFP label={tr.newPw}>
              <div className="trycash-input-wrap">
                <Lock className="trycash-input-icon" strokeWidth={1.6} />
                <input data-testid="fp-newpw" type={showPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="trycash-input pr-11" />
                <button type="button" data-testid="fp-toggle-pw" onClick={() => setShowPw((v) => !v)} className="trycash-pw-toggle">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPw.length > 0 && (
                <div className="trycash-pw-reqs" data-testid="fp-pw-reqs">
                  <ReqFP ok={pwReqs.len} label={tr.pwReqLen} />
                  <ReqFP ok={pwReqs.upper} label={tr.pwReqUpper} />
                  <ReqFP ok={pwReqs.lower} label={tr.pwReqLower} />
                  <ReqFP ok={pwReqs.digit} label={tr.pwReqDigit} />
                  <ReqFP ok={pwReqs.sym} label={tr.pwReqSym} />
                  <ReqFP ok={pwReqs.noOther} label={tr.pwReqNoOther} />
                </div>
              )}
            </FieldFP>

            <FieldFP label={tr.confirmPw}>
              <div className="trycash-input-wrap">
                <Lock className="trycash-input-icon" strokeWidth={1.6} />
                <input data-testid="fp-newpw2" type={showPw ? "text" : "password"} value={newPw2} onChange={(e) => setNewPw2(e.target.value)} className="trycash-input" />
              </div>
              {newPw2.length > 0 && (
                <div data-testid="fp-pw-match" className={`flex items-center gap-1.5 pt-1 text-xs ${pwMatch ? "text-emerald-400" : "text-rose-400"}`}>
                  {pwMatch ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  <span>{pwMatch ? "✓" : tr.errPwMismatch}</span>
                </div>
              )}
            </FieldFP>

            <div className="flex items-center gap-3">
              <button type="button" data-testid="fp-back-c" onClick={() => setStage("B")} className="trycash-gold-outline-btn flex-1 rounded-xl py-3 text-sm font-semibold tracking-wider">
                {tr.backStep}
              </button>
              <div className="flex-[2]">
                <NextBtnFP lang={lang} label={tr.finish} testid="fp-finish" />
              </div>
            </div>
          </form>
        )}

        {stage === "SUCCESS" && (
          <div data-testid="fp-success" className="trycash-card relative mt-8 w-full space-y-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-8 text-center backdrop-blur-xl">
            <span className="trycash-corner trycash-corner-tl" />
            <span className="trycash-corner trycash-corner-tr" />
            <span className="trycash-corner trycash-corner-bl" />
            <span className="trycash-corner trycash-corner-br" />

            <div className="flex justify-center">
              <div className="trycash-success-badge">
                <Check className="h-12 w-12" strokeWidth={2.4} />
              </div>
            </div>

            <button
              type="button"
              data-testid="fp-go-login"
              onClick={() => navigate("/")}
              className="trycash-gold-btn group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-base font-bold tracking-[0.2em] text-black"
            >
              <span className="relative z-10">{tr.backToLogin}</span>
              <span className="trycash-gold-shine" />
            </button>
          </div>
        )}

        {stage === "A" && (
          <button data-testid="fp-back-login" type="button" onClick={() => navigate("/")} className="trycash-gold-link mt-6 text-sm">
            {tr.backToLogin}
          </button>
        )}
      </main>
    </div>
  );
}

const FieldFP = ({ label, children }) => (
  <div className="space-y-2">
    <label className="trycash-form-label block text-xs font-medium tracking-wider text-[#d4af37]/90 uppercase">{label}</label>
    {children}
  </div>
);

const NextBtnFP = ({ lang, label, testid }) => (
  <button data-testid={testid} type="submit" className="trycash-gold-btn group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-base font-bold tracking-[0.2em] text-black">
    <span className="relative z-10 flex items-center gap-2">
      {label}
      {lang === "ar" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
    </span>
    <span className="trycash-gold-shine" />
  </button>
);

const ReqFP = ({ ok, label }) => (
  <div className={`trycash-pw-req-item ${ok ? "ok" : ""}`}>
    {ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
    <span>{label}</span>
  </div>
);
