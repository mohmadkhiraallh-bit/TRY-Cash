import { createContext, useContext, useEffect, useState } from "react";

const translations = {
  ar: {
    dir: "rtl",
    name: "العربية",
    short: "ع",
    tagline: "عالم المستقبل",
    brand: "TRY Cash",
    email: "البريد الإلكتروني",
    emailPlaceholder: "أدخل بريدك الإلكتروني",
    password: "كلمة السر",
    passwordPlaceholder: "أدخل كلمة السر",
    login: "تسجيل الدخول",
    createAccount: "إنشاء حساب",
    forgotPassword: "نسيت كلمة السر؟",
    support: "تواصل مع الدعم",
    theme: "تبديل الإضاءة",
    welcome: "مرحبا بك في عالم المستقبل المالي",
    signupTitle: "إنشاء حساب جديد",
    signupSoon: "سيتم تفعيل إنشاء الحساب قريباً بعد إضافة إجراءات الأمان.",
    back: "العودة",
  },
  tr: {
    dir: "ltr",
    name: "Türkçe",
    short: "TR",
    tagline: "Geleceğin Dünyası",
    brand: "TRY Cash",
    email: "E-posta",
    emailPlaceholder: "E-posta adresinizi girin",
    password: "Şifre",
    passwordPlaceholder: "Şifrenizi girin",
    login: "Giriş Yap",
    createAccount: "Hesap Oluştur",
    forgotPassword: "Şifrenizi mi unuttunuz?",
    support: "Destek ile İletişim",
    theme: "Tema Değiştir",
    welcome: "Finansal geleceğin dünyasına hoş geldiniz",
    signupTitle: "Yeni Hesap Oluştur",
    signupSoon: "Hesap oluşturma, güvenlik önlemleri eklendikten sonra etkinleştirilecektir.",
    back: "Geri",
  },
  en: {
    dir: "ltr",
    name: "English",
    short: "EN",
    tagline: "World of the Future",
    brand: "TRY Cash",
    email: "Email",
    emailPlaceholder: "Enter your email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    login: "Sign In",
    createAccount: "Create Account",
    forgotPassword: "Forgot password?",
    support: "Contact Support",
    theme: "Toggle Theme",
    welcome: "Welcome to the financial world of the future",
    signupTitle: "Create New Account",
    signupSoon: "Account creation will be enabled soon after security measures are added.",
    back: "Back",
  },
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem("trycash_lang") || "ar");

  useEffect(() => {
    localStorage.setItem("trycash_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = translations[lang].dir;
  }, [lang]);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: Object.keys(translations), translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
