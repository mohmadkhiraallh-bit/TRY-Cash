import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Shield, IdCard, ScanFace, Check } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { toast } from "sonner";

const L = {
  ar: {
    idTitle: "توثيق الهوية", idHint: "ارفع صورة الوجه الأمامي للهوية وصورتك مع الهوية",
    idFront: "صورة الوجه الأمامي للهوية", selfie: "صورة الشخص مع الهوية",
    guardianTitle: "توثيق الوصي", guardianHint: "ارفع صورة هوية الوصي (اختياري لكن يُنصح به)",
    guardianId: "صورة هوية الوصي",
    tap: "اضغط للتقاط", retake: "إعادة",
    confirm: "تأكيد", done: "تم الرفع، سيتم مراجعته من الإدارة",
    both: "يجب رفع الصورتين", oneRequired: "الرجاء رفع صورة الوصي",
  },
  tr: {
    idTitle: "Kimlik Doğrulama", idHint: "Kimlik ön yüz ve selfie fotoğraflarını yükleyin",
    idFront: "Kimlik ön yüz", selfie: "Kimlikle selfie",
    guardianTitle: "Vasi Doğrulama", guardianHint: "Vasi kimlik fotoğrafını yükleyin (isteğe bağlı)",
    guardianId: "Vasi kimlik fotoğrafı",
    tap: "Fotoğraf çek", retake: "Yeniden",
    confirm: "Onayla", done: "Yüklendi, yönetim inceleyecek",
    both: "Her iki fotoğraf gerekli", oneRequired: "Vasi fotoğrafı yükleyin",
  },
  en: {
    idTitle: "ID Verification", idHint: "Upload ID front and a selfie with your ID",
    idFront: "ID Front Photo", selfie: "Selfie with ID",
    guardianTitle: "Guardian Verification", guardianHint: "Upload the guardian's ID photo (optional but recommended)",
    guardianId: "Guardian ID photo",
    tap: "Tap to capture", retake: "Retake",
    confirm: "Confirm", done: "Uploaded — pending admin review",
    both: "Both photos required", oneRequired: "Please upload guardian photo",
  },
};

export function AppVerifyId() {
  const { current, updateUser } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = L[lang];
  const [front, setFront] = useState(null);
  const [selfie, setSelfie] = useState(null);

  const submit = () => {
    if (!front || !selfie) return toast.error(t.both);
    // MOCKED — real backend will run OCR/face match
    updateUser({ idFrontUploaded: true, selfieUploaded: true, verificationPending: true, idFrontPhoto: front, selfiePhoto: selfie });
    toast.success(t.done);
    navigate("/app/profile");
  };

  return (
    <VerifyShell title={t.idTitle} hint={t.idHint} navigate={navigate} lang={lang} testidBack="verify-id-back">
      <PhotoBox testid="verify-id-front" icon={IdCard} label={t.idFront} photo={front} setPhoto={setFront} t={t} />
      <PhotoBox testid="verify-id-selfie" icon={ScanFace} label={t.selfie} photo={selfie} setPhoto={setSelfie} t={t} />
      <button data-testid="verify-id-submit" onClick={submit} className="trycash-gold-btn w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wider text-black">
        <span className="relative z-10 flex items-center gap-2"><Check className="h-4 w-4" />{t.confirm}</span>
      </button>
    </VerifyShell>
  );
}

export function AppVerifyGuardian() {
  const { current, updateUser } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = L[lang];
  const [gPhoto, setGPhoto] = useState(null);

  const submit = () => {
    if (!gPhoto) return toast.error(t.oneRequired);
    updateUser({ guardianIdUploaded: true, guardianIdPhoto: gPhoto });
    toast.success(t.done);
    navigate("/app/profile");
  };

  return (
    <VerifyShell title={t.guardianTitle} hint={t.guardianHint} navigate={navigate} lang={lang} testidBack="verify-guardian-back">
      <PhotoBox testid="verify-guardian-box" icon={Shield} label={t.guardianId} photo={gPhoto} setPhoto={setGPhoto} t={t} />
      <button data-testid="verify-guardian-submit" onClick={submit} className="trycash-gold-btn w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wider text-black">
        <span className="relative z-10 flex items-center gap-2"><Check className="h-4 w-4" />{t.confirm}</span>
      </button>
    </VerifyShell>
  );
}

const VerifyShell = ({ title, hint, navigate, lang, testidBack, children }) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <button data-testid={testidBack} onClick={() => navigate("/app/profile")} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
        <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
      </button>
      <h1 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{title}</h1>
      <div className="w-10" />
    </div>
    <p className="trycash-muted text-center text-sm">{hint}</p>
    <div className="trycash-card relative rounded-2xl border border-[#d4af37]/25 bg-black/40 p-6 space-y-4 backdrop-blur-xl">
      <span className="trycash-corner trycash-corner-tl" />
      <span className="trycash-corner trycash-corner-tr" />
      <span className="trycash-corner trycash-corner-bl" />
      <span className="trycash-corner trycash-corner-br" />
      {children}
    </div>
  </div>
);

const PhotoBox = ({ testid, icon: Icon, label, photo, setPhoto, t }) => {
  const inputRef = useRef(null);
  const onChange = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhoto(r.result);
    r.readAsDataURL(f);
  };
  return (
    <div className="space-y-2" data-testid={testid}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#d4af37]" strokeWidth={1.7} />
        <h3 className="trycash-form-label text-xs font-semibold uppercase tracking-wider">{label}</h3>
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onChange} className="hidden" data-testid={`${testid}-input`} />
      {photo ? (
        <div className="relative">
          <img src={photo} alt={label} className="trycash-photo-preview" />
          <button type="button" onClick={() => inputRef.current?.click()} className="trycash-photo-retake"><Camera className="h-3.5 w-3.5" />{t.retake}</button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="trycash-photo-dropzone" data-testid={`${testid}-tap`}>
          <Camera className="h-9 w-9 text-[#d4af37]" strokeWidth={1.4} />
          <span className="mt-2 text-sm font-medium text-[#d4af37]">{t.tap}</span>
        </button>
      )}
    </div>
  );
};
