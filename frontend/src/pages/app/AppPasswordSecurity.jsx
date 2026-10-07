import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, KeyRound, RefreshCw, Copy, Check, Fingerprint, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { generateUniqueSecurityCode, verifySecurityCode } from "../../utils/securityCode";
import { isWebAuthnSupported, getStoredCredential, enrollAdminFingerprint, clearStoredCredential } from "../../utils/webauthn";
import { toast } from "sonner";

const L = {
  ar: {
    title: "كلمة السر والأمان",
    changePw: "تغيير كلمة السر", currentPw: "كلمة السر الحالية", orSec: "أو باستخدام رمز الأمان",
    newPw: "كلمة السر الجديدة", confirmPw: "تأكيد كلمة السر الجديدة",
    saveNewPw: "حفظ كلمة السر", secCodeSection: "رمز الأمان الفريد", currentCode: "رمزك الحالي (مخفي لأسباب أمنية)",
    regenerate: "توليد رمز جديد", regenMsg: "أدخل كلمة السر لتوليد رمز جديد",
    newCodeTitle: "رمز الأمان الجديد", copy: "نسخ", copied: "تم النسخ ✓",
    wrongCurrentPw: "كلمة السر الحالية غير صحيحة", pwsDontMatch: "كلمتا السر غير متطابقتين",
    wrongSecCode: "رمز الأمان غير صحيح", pwUpdated: "تم تحديث كلمة السر", codeUpdated: "تم توليد رمز جديد",
    pwWeak: "كلمة السر لا تستوفي المتطلبات (8 حروف + كبير + صغير + رقم + رمز . _ -)",
    hidden: "•••••••••••••••",
    adminFpTitle: "بصمة المدير",
    adminFpDesc: "سجّل بصمة إصبعك الفريدة على هذا الجهاز. لن يُفتح حساب المدير بأي بصمة أخرى.",
    enrollFp: "تسجيل بصمة جديدة",
    fpEnrolled: "✓ البصمة مُسجّلة",
    fpDelete: "حذف البصمة",
    fpEnrolledMsg: "تم تسجيل البصمة بنجاح",
    fpDeletedMsg: "تم حذف البصمة",
    fpFailedMsg: "فشل تسجيل البصمة",
    fpUnsupportedMsg: "جهازك لا يدعم البصمة",
  },
  tr: {
    title: "Şifre ve Güvenlik",
    changePw: "Şifre Değiştir", currentPw: "Mevcut Şifre", orSec: "veya güvenlik kodu ile",
    newPw: "Yeni Şifre", confirmPw: "Yeni Şifre Tekrar", saveNewPw: "Şifreyi Kaydet",
    secCodeSection: "Benzersiz Güvenlik Kodu", currentCode: "Mevcut kodunuz (güvenlik için gizli)",
    regenerate: "Yeni Kod Üret", regenMsg: "Yeni kod üretmek için şifrenizi girin",
    newCodeTitle: "Yeni Güvenlik Kodu", copy: "Kopyala", copied: "Kopyalandı ✓",
    wrongCurrentPw: "Mevcut şifre yanlış", pwsDontMatch: "Şifreler eşleşmiyor",
    wrongSecCode: "Güvenlik kodu yanlış", pwUpdated: "Şifre güncellendi", codeUpdated: "Yeni kod üretildi",
    pwWeak: "Şifre gereksinimleri karşılamıyor (8 kar + büyük + küçük + rakam + . _ -)",
    hidden: "•••••••••••••••",
    adminFpTitle: "Yönetici Parmak İzi",
    adminFpDesc: "Bu cihazda benzersiz parmak izinizi kaydedin. Yönetici hesabı başka parmak izi ile açılmayacak.",
    enrollFp: "Yeni parmak izi kaydet",
    fpEnrolled: "✓ Parmak izi kayıtlı",
    fpDelete: "Parmak izini sil",
    fpEnrolledMsg: "Parmak izi kaydedildi",
    fpDeletedMsg: "Parmak izi silindi",
    fpFailedMsg: "Parmak izi kaydı başarısız",
    fpUnsupportedMsg: "Cihazınız parmak izini desteklemiyor",
  },
  en: {
    title: "Password & Security",
    changePw: "Change Password", currentPw: "Current Password", orSec: "or using security code",
    newPw: "New Password", confirmPw: "Confirm New Password", saveNewPw: "Save Password",
    secCodeSection: "Unique Security Code", currentCode: "Your current code (hidden for security)",
    regenerate: "Generate New Code", regenMsg: "Enter your password to regenerate the code",
    newCodeTitle: "New Security Code", copy: "Copy", copied: "Copied ✓",
    wrongCurrentPw: "Current password is wrong", pwsDontMatch: "Passwords don't match",
    wrongSecCode: "Security code is wrong", pwUpdated: "Password updated", codeUpdated: "New code generated",
    pwWeak: "Password doesn't meet requirements (8 chars + upper + lower + digit + . _ -)",
    hidden: "•••••••••••••••",
    adminFpTitle: "Admin Fingerprint",
    adminFpDesc: "Enroll your unique fingerprint on this device. The admin account won't open with any other fingerprint.",
    enrollFp: "Enroll new fingerprint",
    fpEnrolled: "✓ Fingerprint enrolled",
    fpDelete: "Delete fingerprint",
    fpEnrolledMsg: "Fingerprint enrolled",
    fpDeletedMsg: "Fingerprint deleted",
    fpFailedMsg: "Fingerprint enrollment failed",
    fpUnsupportedMsg: "Your device doesn't support fingerprint",
  },
};

const isPwStrong = (v) =>
  v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /[._-]/.test(v) && !/[^\w._-]/.test(v);

export default function AppPasswordSecurity() {
  const { current, updateUser } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = L[lang];
  const [currentPw, setCurrentPw] = useState("");
  const [secCodeInput, setSecCodeInput] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [regenPw, setRegenPw] = useState("");
  const [newCode, setNewCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [fpEnrolled, setFpEnrolled] = useState(!!getStoredCredential());
  const [fpBusy, setFpBusy] = useState(false);
  if (!current) return null;

  const enrollFp = async () => {
    if (!isWebAuthnSupported()) { toast.error(t.fpUnsupportedMsg); return; }
    setFpBusy(true);
    const res = await enrollAdminFingerprint({
      userId: current.email,
      userName: current.email,
      displayName: current.fullName || current.firstName || "Admin",
    });
    setFpBusy(false);
    if (res.ok) { setFpEnrolled(true); toast.success(t.fpEnrolledMsg); }
    else { toast.error(t.fpFailedMsg); }
  };

  const removeFp = () => {
    clearStoredCredential();
    setFpEnrolled(false);
    toast.success(t.fpDeletedMsg);
  };

  const savePw = () => {
    const oldOk = currentPw && currentPw === current.password;
    const codeOk = secCodeInput && verifySecurityCode(current.email, secCodeInput);
    if (!oldOk && !codeOk) return toast.error(t.wrongCurrentPw);
    if (!isPwStrong(newPw)) return toast.error(t.pwWeak);
    if (newPw !== newPw2) return toast.error(t.pwsDontMatch);
    updateUser({ password: newPw });
    setCurrentPw(""); setSecCodeInput(""); setNewPw(""); setNewPw2("");
    toast.success(t.pwUpdated);
  };

  const regenerate = () => {
    if (regenPw !== current.password) return toast.error(t.wrongCurrentPw);
    // Clear the stored code for this email so a fresh one is issued
    const store = JSON.parse(localStorage.getItem("trycash_security_codes") || "{}");
    delete store[current.email];
    localStorage.setItem("trycash_security_codes", JSON.stringify(store));
    const code = generateUniqueSecurityCode(current.email);
    setNewCode(code); setRegenPw("");
    toast.success(t.codeUpdated);
  };

  const doCopy = async () => {
    await navigator.clipboard.writeText(newCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5" data-testid="password-security-page">
      <div className="flex items-center justify-between">
        <button data-testid="ps-back" onClick={() => navigate("/app/profile")} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <h1 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.title}</h1>
        <div className="w-10" />
      </div>

      {/* Change password card */}
      <div className="trycash-card relative rounded-2xl border border-[#d4af37]/25 bg-black/40 p-6 space-y-3 backdrop-blur-xl">
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#d4af37]">{t.changePw}</h2>

        <Field label={t.currentPw}><InputPw testid="ps-current-pw" value={currentPw} setValue={setCurrentPw} /></Field>
        <p className="trycash-muted text-center text-[10px]">— {t.orSec} —</p>
        <Field label={t.secCodeSection}>
          <div className="trycash-input-wrap"><KeyRound className="trycash-input-icon" strokeWidth={1.6} />
            <input data-testid="ps-sec-code" value={secCodeInput} onChange={(e) => setSecCodeInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} maxLength={15} dir="ltr" className="trycash-input" style={{ fontFamily: "Courier New, monospace", letterSpacing: "0.15em" }} />
          </div>
        </Field>
        <Field label={t.newPw}><InputPw testid="ps-new-pw" value={newPw} setValue={setNewPw} /></Field>
        <Field label={t.confirmPw}><InputPw testid="ps-new-pw2" value={newPw2} setValue={setNewPw2} /></Field>
        <button data-testid="ps-save-pw" onClick={savePw} className="trycash-gold-btn mt-3 w-full rounded-xl py-3 text-sm font-bold tracking-wider text-black">
          <span className="relative z-10">{t.saveNewPw}</span>
        </button>
      </div>

      {/* Admin fingerprint enrollment — visible only to admin */}
      {current.isAdmin && (
        <div className="trycash-card relative rounded-2xl border border-[#d4af37]/25 bg-black/40 p-6 space-y-3 backdrop-blur-xl" data-testid="admin-fp-card">
          <span className="trycash-corner trycash-corner-tl" />
          <span className="trycash-corner trycash-corner-tr" />
          <span className="trycash-corner trycash-corner-bl" />
          <span className="trycash-corner trycash-corner-br" />
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-[#d4af37]" strokeWidth={1.7} />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#d4af37]">{t.adminFpTitle}</h2>
          </div>
          <p className="trycash-muted text-xs leading-relaxed">{t.adminFpDesc}</p>

          {fpEnrolled ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300" data-testid="admin-fp-enrolled">
                {t.fpEnrolled}
              </div>
              <button
                data-testid="admin-fp-delete"
                onClick={removeFp}
                className="trycash-gold-outline-btn w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
              >
                <Trash2 className="h-4 w-4" /> {t.fpDelete}
              </button>
            </div>
          ) : (
            <button
              data-testid="admin-fp-enroll"
              onClick={enrollFp}
              disabled={fpBusy}
              className="trycash-gold-btn w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wider text-black disabled:opacity-50"
            >
              <Fingerprint className="h-4 w-4" />
              <span className="relative z-10">{t.enrollFp}</span>
            </button>
          )}
        </div>
      )}

      {/* Regenerate security code card */}
      <div className="trycash-card relative rounded-2xl border border-[#d4af37]/25 bg-black/40 p-6 space-y-3 backdrop-blur-xl">
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#d4af37]">{t.secCodeSection}</h2>
        <p className="trycash-muted text-xs">{t.currentCode}</p>
        <div className="trycash-seccode-box"><span className="trycash-seccode">{t.hidden}</span></div>
        <p className="trycash-muted text-xs mt-2">{t.regenMsg}</p>
        <Field label={t.currentPw}><InputPw testid="ps-regen-pw" value={regenPw} setValue={setRegenPw} /></Field>
        <button data-testid="ps-regen-btn" onClick={regenerate} className="trycash-gold-outline-btn w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold">
          <RefreshCw className="h-4 w-4" /> {t.regenerate}
        </button>

        {newCode && (
          <div className="mt-3 space-y-2" data-testid="new-code-block">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-emerald-400">✓ {t.newCodeTitle}</p>
            <div className="trycash-seccode-box"><span className="trycash-seccode" dir="ltr" data-testid="ps-new-code">{newCode}</span></div>
            <button data-testid="ps-copy-new" onClick={doCopy} className={`trycash-copy-btn w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold ${copied ? "trycash-copy-done" : ""}`}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? t.copied : t.copy}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="trycash-form-label block text-[10px] font-medium tracking-wider uppercase">{label}</label>
    {children}
  </div>
);

const InputPw = ({ testid, value, setValue }) => (
  <div className="trycash-input-wrap">
    <Lock className="trycash-input-icon" strokeWidth={1.6} />
    <input data-testid={testid} type="password" value={value} onChange={(e) => setValue(e.target.value)} className="trycash-input" />
  </div>
);
