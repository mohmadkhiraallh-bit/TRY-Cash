import { useEffect, useState } from "react";
import { Fingerprint, ShieldQuestion, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { isWebAuthnSupported, getStoredCredential, verifyAdminFingerprint } from "../utils/webauthn";

/**
 * Admin login fingerprint modal.
 * - If an admin fingerprint is enrolled (WebAuthn), tapping the sensor triggers the real biometric prompt.
 * - Otherwise, falls back to the security question ("فاطمة بطيخ").
 */
export const AdminFingerprintModal = ({ onSuccess, onCancel, verifyAnswer }) => {
  const { lang } = useLanguage();
  const [mode, setMode] = useState("fp");
  const [answer, setAnswer] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const enrolled = !!getStoredCredential();
  const supported = isWebAuthnSupported();

  const L = {
    ar: {
      fpTitle: "التحقق ببصمة الإصبع",
      fpHintEnrolled: "المس مستشعر البصمة على جهازك",
      fpHintNotEnrolled: "لم تسجّل بصمة بعد — استخدم سؤال الأمان",
      cantFp: "لا يمكنني وضع البصمة",
      qTitle: "سؤال الأمان",
      qLabel: "ما اسم صديقك المفضل؟",
      qPh: "أجب باللغة العربية",
      verify: "تحقق",
      cancel: "إلغاء",
      wrong: "الإجابة غير صحيحة",
      touchToVerify: "المس للتحقق",
      scanning: "جاري القراءة...",
      unsupported: "جهازك لا يدعم البصمة",
      denied: "تم رفض التحقق",
      generalError: "فشلت عملية التحقق",
    },
    tr: {
      fpTitle: "Parmak İzi Doğrulama",
      fpHintEnrolled: "Cihazınızın parmak izi sensörüne dokunun",
      fpHintNotEnrolled: "Henüz parmak izi kayıtlı değil — güvenlik sorusunu kullanın",
      cantFp: "Parmak izi kullanamıyorum",
      qTitle: "Güvenlik Sorusu",
      qLabel: "En iyi arkadaşınızın adı?",
      qPh: "Arapça olarak cevap verin",
      verify: "Doğrula",
      cancel: "İptal",
      wrong: "Yanlış cevap",
      touchToVerify: "Doğrulamak için dokunun",
      scanning: "Taranıyor...",
      unsupported: "Cihazınız parmak izini desteklemiyor",
      denied: "Doğrulama reddedildi",
      generalError: "Doğrulama başarısız",
    },
    en: {
      fpTitle: "Fingerprint Verification",
      fpHintEnrolled: "Touch your device's fingerprint sensor",
      fpHintNotEnrolled: "No fingerprint enrolled — use the security question",
      cantFp: "I can't use fingerprint",
      qTitle: "Security Question",
      qLabel: "What is your best friend's name?",
      qPh: "Answer in Arabic",
      verify: "Verify",
      cancel: "Cancel",
      wrong: "Wrong answer",
      touchToVerify: "Touch to verify",
      scanning: "Scanning...",
      unsupported: "Your device doesn't support fingerprint",
      denied: "Verification denied",
      generalError: "Verification failed",
    },
  }[lang];

  useEffect(() => {
    if (!enrolled) setMode("question");
  }, [enrolled]);

  const doFingerprint = async () => {
    setError("");
    if (!supported) { setError(L.unsupported); return; }
    if (!enrolled) { setMode("question"); return; }
    setScanning(true);
    const res = await verifyAdminFingerprint();
    setScanning(false);
    if (res.ok) {
      onSuccess();
    } else {
      setError(res.error === "NotAllowedError" || res.error === "AbortError" ? L.denied : L.generalError);
    }
  };

  const submitAnswer = async () => {
    const ok = await verifyAnswer(answer);
    if (ok) onSuccess();
    else setError(L.wrong);
  };

  return (
    <div className="trycash-modal-overlay" data-testid="fp-modal">
      <div className="trycash-modal max-w-sm text-center">
        <button onClick={onCancel} className="absolute right-3 top-3 text-[#d4af37]/60 hover:text-[#d4af37]" data-testid="fp-close">
          <X className="h-4 w-4" />
        </button>
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />

        {mode === "fp" ? (
          <>
            <h3 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>
              {L.fpTitle}
            </h3>
            <p className="trycash-muted mt-2 text-xs">
              {enrolled ? L.fpHintEnrolled : L.fpHintNotEnrolled}
            </p>
            <div className="mt-6 flex justify-center">
              <button
                data-testid="fp-scan"
                onClick={doFingerprint}
                disabled={scanning}
                className={`trycash-fp-btn ${scanning ? "scanning" : ""}`}
                aria-label={L.touchToVerify}
              >
                <Fingerprint className="h-14 w-14" strokeWidth={1.4} />
              </button>
            </div>
            <p className="mt-3 text-xs text-[#d4af37]/70">{scanning ? L.scanning : L.touchToVerify}</p>
            {error && <p className="mt-3 text-xs text-rose-400" data-testid="fp-error">{error}</p>}
            <button data-testid="fp-cant" onClick={() => { setError(""); setMode("question"); }} className="trycash-gold-link mt-6 inline-flex items-center gap-1 text-xs">
              <ShieldQuestion className="h-3.5 w-3.5" /> {L.cantFp}
            </button>
          </>
        ) : (
          <>
            <h3 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>
              {L.qTitle}
            </h3>
            <p className="mt-3 text-sm">{L.qLabel}</p>
            <div className="mt-4 trycash-input-wrap">
              <input data-testid="fp-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={L.qPh} className="trycash-input text-center" style={{ paddingLeft: "1rem", paddingRight: "1rem" }} />
            </div>
            {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
            <div className="mt-5 flex gap-3">
              {enrolled && (
                <button data-testid="fp-back-fp" onClick={() => { setError(""); setMode("fp"); }} className="trycash-gold-outline-btn flex-1 rounded-xl py-3 text-sm font-semibold">
                  {L.cancel}
                </button>
              )}
              <button data-testid="fp-verify-answer" onClick={submitAnswer} className="trycash-gold-btn flex-[2] rounded-xl py-3 text-sm font-bold text-black">
                <span className="relative z-10">{L.verify}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminFingerprintModal;
