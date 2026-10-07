import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Lock, Check } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { toast } from "sonner";

const L = {
  ar: {
    title: "المعلومات الشخصية",
    fields: {
      firstName: "الاسم", fatherName: "اسم الأب", surname: "الكنية",
      motherName: "اسم الأم", motherSurname: "كنية الأم",
      email: "البريد الإلكتروني", phone: "رقم الهاتف",
      dob: "تاريخ الميلاد", guardian: "اسم الوصي", profession: "المهنة",
      annualIncome: "الدخل السنوي", region: "مكان السكن",
    },
    save: "حفظ التغييرات", cancel: "إلغاء", confirmPw: "تأكيد كلمة السر",
    confirmMsg: "لحفظ التغييرات أدخل كلمة السر الخاصة بحسابك:",
    wrongPw: "كلمة السر غير صحيحة", saved: "تم حفظ التغييرات",
  },
  tr: {
    title: "Kişisel Bilgiler",
    fields: {
      firstName: "Ad", fatherName: "Baba Adı", surname: "Soyad",
      motherName: "Anne Adı", motherSurname: "Anne Soyadı",
      email: "E-posta", phone: "Telefon", dob: "Doğum Tarihi",
      guardian: "Vasi Adı", profession: "Meslek", annualIncome: "Yıllık Gelir", region: "Yaşadığınız Yer",
    },
    save: "Değişiklikleri Kaydet", cancel: "İptal", confirmPw: "Şifreyi Onayla",
    confirmMsg: "Değişiklikleri kaydetmek için hesap şifrenizi girin:",
    wrongPw: "Şifre yanlış", saved: "Değişiklikler kaydedildi",
  },
  en: {
    title: "Personal Information",
    fields: {
      firstName: "First Name", fatherName: "Father's Name", surname: "Surname",
      motherName: "Mother's Name", motherSurname: "Mother's Surname",
      email: "Email", phone: "Phone", dob: "Date of Birth",
      guardian: "Guardian Name", profession: "Profession", annualIncome: "Annual Income", region: "Region",
    },
    save: "Save Changes", cancel: "Cancel", confirmPw: "Confirm Password",
    confirmMsg: "To save changes, enter your account password:",
    wrongPw: "Wrong password", saved: "Changes saved",
  },
};

export default function AppPersonalInfo() {
  const { current, updateUser } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = L[lang];
  const [form, setForm] = useState({
    firstName: current?.firstName || "", fatherName: current?.fatherName || "", surname: current?.surname || "",
    motherName: current?.motherName || "", motherSurname: current?.motherSurname || "",
    email: current?.email || "", phone: current?.phone || "",
    dob: current?.dob || "",
    guardian: [current?.gFirstName, current?.gSurname].filter(Boolean).join(" ") || "",
    profession: current?.profession || "",
    annualIncome: current?.annualIncome || "",
    region: current?.region || "",
  });
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pw, setPw] = useState("");
  if (!current) return null;

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };

  const doSave = () => setConfirming(true);
  const confirm = () => {
    if (pw !== current.password) return toast.error(t.wrongPw);
    updateUser(form);
    toast.success(t.saved);
    setConfirming(false); setPw(""); setDirty(false);
  };

  return (
    <div className="space-y-5" data-testid="personal-info-page">
      <div className="flex items-center justify-between">
        <button data-testid="pi-back" onClick={() => navigate("/app/profile")} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <h1 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.title}</h1>
        <div className="w-10" />
      </div>

      <div className="trycash-card relative rounded-2xl border border-[#d4af37]/25 bg-black/40 p-6 space-y-4 backdrop-blur-xl">
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />

        {Object.entries(t.fields).map(([k, label]) => (
          <div key={k} className="space-y-1.5">
            <label className="trycash-form-label block text-[10px] font-medium tracking-wider uppercase flex items-center gap-1.5">
              {label}
              {k === "guardian" && current.guardianVerified && (
                <Check className="h-3.5 w-3.5 fill-emerald-500 text-white rounded-full bg-emerald-500 p-0.5" data-testid="guardian-verified-badge" />
              )}
            </label>
            <div className="trycash-input-wrap">
              {k === "email" ? <Mail className="trycash-input-icon" strokeWidth={1.6} /> :
               k === "phone" ? <Phone className="trycash-input-icon" strokeWidth={1.6} /> :
               <User className="trycash-input-icon" strokeWidth={1.6} />}
              <input data-testid={`pi-${k}`} value={form[k] || ""} onChange={(e) => set(k, e.target.value)} className="trycash-input" dir={k === "email" || k === "phone" || k === "annualIncome" ? "ltr" : undefined} />
            </div>
          </div>
        ))}

        <button data-testid="pi-save" onClick={doSave} disabled={!dirty} className={`trycash-gold-btn w-full rounded-xl py-3 text-sm font-bold tracking-wider text-black ${!dirty ? "opacity-50 cursor-not-allowed" : ""}`}>
          <span className="relative z-10 flex items-center justify-center gap-2"><Check className="h-4 w-4" />{t.save}</span>
        </button>
      </div>

      {confirming && (
        <div className="trycash-modal-overlay" data-testid="pw-confirm-modal">
          <div className="trycash-modal">
            <span className="trycash-corner trycash-corner-tl" />
            <span className="trycash-corner trycash-corner-tr" />
            <span className="trycash-corner trycash-corner-bl" />
            <span className="trycash-corner trycash-corner-br" />
            <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.confirmPw}</h3>
            <p className="mt-2 text-xs opacity-80">{t.confirmMsg}</p>
            <div className="mt-4 trycash-input-wrap">
              <Lock className="trycash-input-icon" strokeWidth={1.6} />
              <input data-testid="pi-confirm-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="trycash-input" />
            </div>
            <div className="mt-5 flex gap-3">
              <button data-testid="pi-confirm-cancel" onClick={() => { setConfirming(false); setPw(""); }} className="trycash-gold-outline-btn flex-1 rounded-xl py-3 text-sm font-semibold">{t.cancel}</button>
              <button data-testid="pi-confirm-ok" onClick={confirm} className="trycash-gold-btn flex-[2] rounded-xl py-3 text-sm font-bold tracking-wider text-black"><span className="relative z-10">{t.save}</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
