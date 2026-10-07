import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  ArrowLeft, User, Lock, IdCard, Shield, Headphones, FileText, RefreshCw, LayoutDashboard, LogOut, BadgeCheck, ChevronRight,
} from "lucide-react";

const L = {
  ar: {
    title: "الملف الشخصي",
    personal: "المعلومات الشخصية",
    password: "كلمة السر والأمان",
    idVerify: "توثيق الهوية",
    guardianVerify: "توثيق الوصي",
    support: "التواصل مع الدعم",
    terms: "الشروط والأحكام",
    update: "تحديث التطبيق",
    admin: "لوحة الإدارة",
    logout: "تسجيل الخروج",
    verified: "موثّق",
    notVerified: "غير موثّق",
    memberSince: "عضو منذ",
  },
  tr: {
    title: "Profil", personal: "Kişisel Bilgiler", password: "Şifre ve Güvenlik",
    idVerify: "Kimlik Doğrulama", guardianVerify: "Vasi Doğrulama",
    support: "Destek", terms: "Şartlar ve Koşullar", update: "Uygulamayı Güncelle",
    admin: "Yönetici Paneli", logout: "Çıkış Yap",
    verified: "Doğrulanmış", notVerified: "Doğrulanmamış", memberSince: "Üyelik",
  },
  en: {
    title: "Profile", personal: "Personal Information", password: "Password & Security",
    idVerify: "ID Verification", guardianVerify: "Guardian Verification",
    support: "Contact Support", terms: "Terms & Conditions", update: "Update App",
    admin: "Admin Panel", logout: "Sign Out",
    verified: "Verified", notVerified: "Not verified", memberSince: "Member since",
  },
};

export default function AppProfile() {
  const { current, logout } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = L[lang];
  if (!current) return null;

  const rows = [
    { icon: User, label: t.personal, testid: "profile-personal", to: "/app/personal-info" },
    { icon: Lock, label: t.password, testid: "profile-password", to: "/app/password-security" },
    ...(current.isVerified ? [] : [{ icon: IdCard, label: t.idVerify, testid: "profile-id-verify", to: "/app/verify-id" }]),
    ...(current.guardianIdUploaded ? [] : [{ icon: Shield, label: t.guardianVerify, testid: "profile-guardian-verify", to: "/app/verify-guardian" }]),
    { icon: Headphones, label: t.support, testid: "profile-support", to: "/app/support" },
    { icon: FileText, label: t.terms, testid: "profile-terms", to: "/app/terms" },
    { icon: RefreshCw, label: t.update, testid: "profile-update", to: "#" },
    ...(current.isAdmin ? [{ icon: LayoutDashboard, label: t.admin, testid: "profile-admin", to: "/app/admin" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button data-testid="back-home" onClick={() => navigate("/app/home")} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <h1 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.title}</h1>
        <div className="w-10" />
      </div>

      {/* Avatar & name */}
      <div className="flex flex-col items-center pt-2">
        <div className="trycash-avatar-large" data-testid="profile-avatar">
          <User className="h-14 w-14 text-[#d4af37]/80" strokeWidth={1.4} />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <h2
            className="trycash-gold text-2xl font-semibold"
            style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}
            data-testid="profile-name"
          >
            {current.fullName || current.firstName}
          </h2>
          {current.isVerified && (
            <BadgeCheck className="h-6 w-6 fill-emerald-500 text-white" data-testid="profile-verified-badge" />
          )}
        </div>
        <span
          className={`mt-1 text-xs tracking-wider ${current.isVerified ? "text-emerald-400" : "text-[#d4af37]/60"}`}
          data-testid="profile-verified-status"
        >
          {current.isVerified ? t.verified : t.notVerified}
        </span>
      </div>

      {/* Menu rows */}
      <div className="space-y-2" data-testid="profile-menu">
        {rows.map((r) => (
          <button
            key={r.label}
            data-testid={r.testid}
            onClick={() => r.to && r.to !== "#" && navigate(r.to)}
            className="trycash-menu-row"
          >
            <r.icon className="h-4 w-4 text-[#d4af37]" strokeWidth={1.7} />
            <span className="flex-1 text-start text-sm font-medium">{r.label}</span>
            <ChevronRight className={`h-4 w-4 text-[#d4af37]/50 ${lang === "ar" ? "rotate-180" : ""}`} />
          </button>
        ))}

        <button
          data-testid="profile-logout"
          onClick={() => { logout(); navigate("/"); }}
          className="trycash-menu-row trycash-menu-danger"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.7} />
          <span className="flex-1 text-start text-sm font-medium">{t.logout}</span>
        </button>
      </div>
    </div>
  );
}
