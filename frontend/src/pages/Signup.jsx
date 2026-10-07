import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Eye, EyeOff, Mail, Lock, Phone, ChevronDown,
  Check, X, User, IdCard, Heart, Activity, Calendar, MapPin, Users, Shield,
  Camera, ScanFace, Copy, CheckCircle, KeyRound, Briefcase, Building2, DollarSign,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import TopBar from "../components/TopBar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { COUNTRIES } from "../components/Flags";
import { getRegionsByCountry } from "../data/regions";
import { PROFESSIONS } from "../data/professions";
import { generateUniqueSecurityCode } from "../utils/securityCode";
import { useAuth, acceptTerms } from "../contexts/AuthContext";
import { TERMS_TEXT } from "../data/terms";
import { toast } from "sonner";

const STORAGE_KEY = "trycash_registered_emails";
const DRAFT_KEY = "trycash_signup_draft";
const TOTAL_STEPS = 5;

const getEmails = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};
const saveEmail = (email) => {
  const list = getEmails();
  if (!list.includes(email.toLowerCase())) {
    list.push(email.toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
};

const ALLOWED_SYMBOLS = /[._-]/;
const FORBIDDEN_SYMBOLS = /[^\w._-]/; // anything that's not alphanumeric, underscore, dot, or dash

const T = {
  ar: {
    step1Title: "إنشاء حساب جديد",
    step1Subtitle: "أنشئ حسابك في عالم المستقبل المالي",
    step2Title: "البيانات الشخصية",
    step2Subtitle: "أكمل بياناتك للمتابعة",
    step3Title: "معلومات الوصي",
    step3Subtitle: "الشخص المخوّل بالوصول للمال في حال وفاتك",
    step4Title: "المهنة والدخل",
    step4Subtitle: "أخبرنا عن عملك ودخلك السنوي التقريبي",
    step5Title: "توثيق الهوية",
    step5Subtitle: "التقط صورتين للتحقق من هويتك",
    completedTitle: "تم إنشاء حسابك بنجاح",
    completedSubtitle: "احتفظ بهذا الرمز الأمني الفريد في مكان آمن",
    draftRestored: "تم استعادة بياناتك المحفوظة",
    progress: "اكتمال التسجيل",
    profession: "المهنة",
    professionPh: "اختر مهنتك",
    companyName: "اسم الشركة / جهة العمل",
    companyNamePh: "اكتب اسم شركتك أو جهة عملك",
    annualIncome: "الدخل السنوي التقريبي (بالدولار)",
    annualIncomePh: "مثال: 12000",
    errIncomeInvalid: "الرجاء إدخال دخل سنوي صحيح",
    gIdPhotoTitle: "صورة هوية الوصي (اختياري)",
    gIdPhotoHint: "يمكنك إضافة صورة هوية الوصي الآن أو تخطي هذه الخطوة وإضافتها لاحقاً من الإعدادات.",
    optional: "اختياري",
    skip: "تخطي",
    idFrontTitle: "صورة الوجه الأمامي للهوية",
    idFrontHint: "اضغط هنا لفتح الكاميرا والتقاط صورة واضحة للوجه الأمامي من بطاقة هويتك. تأكد من ظهور جميع البيانات بوضوح وبدون انعكاسات.",
    selfieTitle: "صورة الشخص مع الهوية",
    selfieHint: "اضغط هنا لالتقاط صورة لوجهك وأنت تمسك بطاقة الهوية بجانبه. هذه الصورة تستخدم لمطابقة هويتك وتوثيق حسابك.",
    tapToCapture: "اضغط للتقاط الصورة",
    retake: "إعادة الالتقاط",
    secCodeLabel: "رمز الأمان الفريد",
    secCodeHelp: "هذا الرمز ضروري لاستعادة كلمة السر. احفظه في مكان آمن لأنه لن يُعرض لك مرة أخرى.",
    copy: "نسخ الرمز",
    copied: "تم النسخ ✓",
    finish: "إنهاء",
    errPhotosRequired: "يجب رفع الصورتين قبل المتابعة",
    email: "البريد الإلكتروني", emailPh: "example@trycash.app",
    phone: "رقم الهاتف", phonePh: "اكتب رقم هاتفك",
    password: "كلمة السر", passwordPh: "8 أحرف على الأقل",
    confirm: "تأكيد كلمة السر", confirmPh: "أعد كتابة كلمة السر",
    next: "التالي", back: "العودة لتسجيل الدخول", backStep: "السابق",
    selectCountry: "اختر الدولة",
    pwReqTitle: "متطلبات كلمة السر:",
    pwReqLen: "8 أحرف على الأقل",
    pwReqUpper: "حرف كبير واحد على الأقل (A-Z)",
    pwReqLower: "حرف صغير واحد على الأقل (a-z)",
    pwReqDigit: "رقم واحد على الأقل (0-9)",
    pwReqSym: "رمز واحد على الأقل ( . _ - )",
    pwReqNoOther: "بدون رموز أخرى",
    okMatch: "كلمتا السر متطابقتان",
    errInvalidEmail: "صيغة البريد الإلكتروني غير صحيحة",
    errEmailTaken: "هذا البريد مستخدم على حساب آخر",
    errPhoneShort: "رقم الهاتف غير مكتمل",
    errPwWeak: "كلمة السر لا تستوفي جميع المتطلبات",
    errPwMismatch: "كلمتا السر غير متطابقتين",
    errMissing: "يرجى تعبئة جميع الحقول",
    successMsg: "تم حفظ بياناتك بنجاح. الخطوة التالية قيد الإعداد.",
    firstName: "الاسم", fatherName: "اسم الأب", surname: "الكنية",
    motherName: "اسم الأم", motherSurname: "كنية الأم",
    nationalId: "الرقم الوطني للهوية",
    marital: "الحالة الاجتماعية",
    married: "متزوج", single: "أعزب", divorced: "مطلق", widowed: "أرمل",
    health: "الحالة الصحية",
    healthy: "معافى", specialNeeds: "ذوي احتياجات خاصة", healthOther: "أخرى",
    dob: "تاريخ الميلاد", day: "يوم", month: "شهر", year: "سنة",
    country: "الدولة", region: "المحافظة / الولاية",
    selectPlaceholder: "اختر...",
    selectRegionFirst: "اختر الدولة أولاً",
    gFirstName: "اسم الوصي",
    gFatherName: "اسم والد الوصي",
    gSurname: "كنية الوصي",
    gMotherName: "اسم والدة الوصي",
    gMotherSurname: "كنية والدة الوصي",
    gPhone: "رقم هاتف الوصي",
    relation: "صلة القرابة",
    relFirstDegree: "أقارب من الدرجة الأولى",
    relSecondDegree: "أقارب من الدرجة الثانية",
    relPartner: "شريك في العمل",
    relFriend: "صديق",
  },
  tr: {
    step1Title: "Yeni Hesap Oluştur",
    step1Subtitle: "Geleceğin finansal dünyasında hesabınızı oluşturun",
    step2Title: "Kişisel Bilgiler",
    step2Subtitle: "Devam etmek için bilgilerinizi tamamlayın",
    step3Title: "Vasi Bilgileri",
    step3Subtitle: "Vefatınız halinde paraya erişim yetkisi olan kişi",
    step4Title: "Meslek ve Gelir",
    step4Subtitle: "Mesleğiniz ve tahmini yıllık gelirinizi bize bildirin",
    step5Title: "Kimlik Doğrulama",
    step5Subtitle: "Kimliğinizi doğrulamak için iki fotoğraf çekin",
    completedTitle: "Hesabınız Başarıyla Oluşturuldu",
    completedSubtitle: "Bu benzersiz güvenlik kodunu güvenli bir yerde saklayın",
    draftRestored: "Kaydedilmiş bilgileriniz geri yüklendi",
    progress: "Kayıt Tamamlama",
    profession: "Meslek",
    professionPh: "Mesleğinizi seçin",
    companyName: "Şirket / İş Yeri Adı",
    companyNamePh: "Şirket veya iş yerinizin adını yazın",
    annualIncome: "Tahmini Yıllık Gelir (USD)",
    annualIncomePh: "Örn: 12000",
    errIncomeInvalid: "Lütfen geçerli bir yıllık gelir girin",
    gIdPhotoTitle: "Vasi Kimlik Fotoğrafı (isteğe bağlı)",
    gIdPhotoHint: "Vasi kimlik fotoğrafını şimdi ekleyebilir veya bu adımı atlayıp daha sonra Ayarlar'dan ekleyebilirsiniz.",
    optional: "İsteğe bağlı",
    skip: "Atla",
    idFrontTitle: "Kimliğin Ön Yüz Fotoğrafı",
    idFrontHint: "Kameranızı açıp kimlik kartınızın ön yüzünün net bir fotoğrafını çekmek için buraya dokunun. Tüm bilgilerin net ve yansımasız görünmesini sağlayın.",
    selfieTitle: "Kimlikle Birlikte Selfie",
    selfieHint: "Kimliğinizi yanınızda tutarken yüzünüzün fotoğrafını çekmek için buraya dokunun. Bu fotoğraf, kimliğinizi eşleştirmek ve hesabınızı doğrulamak için kullanılır.",
    tapToCapture: "Fotoğraf çekmek için dokunun",
    retake: "Yeniden Çek",
    secCodeLabel: "Benzersiz Güvenlik Kodu",
    secCodeHelp: "Bu kod şifre kurtarma için gereklidir. Bir daha gösterilmeyeceği için güvenli bir yerde saklayın.",
    copy: "Kodu Kopyala",
    copied: "Kopyalandı ✓",
    finish: "Bitir",
    errPhotosRequired: "Devam etmeden önce her iki fotoğrafı da yüklemelisiniz",
    email: "E-posta", emailPh: "example@trycash.app",
    phone: "Telefon Numarası", phonePh: "Telefon numaranızı yazın",
    password: "Şifre", passwordPh: "En az 8 karakter",
    confirm: "Şifre Tekrar", confirmPh: "Şifrenizi tekrar yazın",
    next: "İleri", back: "Girişe Dön", backStep: "Geri",
    selectCountry: "Ülke seç",
    pwReqTitle: "Şifre gereksinimleri:",
    pwReqLen: "En az 8 karakter",
    pwReqUpper: "En az bir büyük harf (A-Z)",
    pwReqLower: "En az bir küçük harf (a-z)",
    pwReqDigit: "En az bir rakam (0-9)",
    pwReqSym: "En az bir sembol ( . _ - )",
    pwReqNoOther: "Başka sembol yok",
    okMatch: "Şifreler eşleşiyor",
    errInvalidEmail: "Geçersiz e-posta biçimi",
    errEmailTaken: "Bu e-posta başka bir hesapta kullanılıyor",
    errPhoneShort: "Telefon numarası eksik",
    errPwWeak: "Şifre tüm gereksinimleri karşılamıyor",
    errPwMismatch: "Şifreler eşleşmiyor",
    errMissing: "Lütfen tüm alanları doldurun",
    successMsg: "Bilgileriniz başarıyla kaydedildi. Sonraki adım hazırlanıyor.",
    firstName: "Ad", fatherName: "Baba Adı", surname: "Soyad",
    motherName: "Anne Adı", motherSurname: "Anne Soyadı",
    nationalId: "Kimlik Numarası",
    marital: "Medeni Durum",
    married: "Evli", single: "Bekar", divorced: "Boşanmış", widowed: "Dul",
    health: "Sağlık Durumu",
    healthy: "Sağlıklı", specialNeeds: "Engelli", healthOther: "Diğer",
    dob: "Doğum Tarihi", day: "Gün", month: "Ay", year: "Yıl",
    country: "Ülke", region: "İl / Eyalet",
    selectPlaceholder: "Seçiniz...",
    selectRegionFirst: "Önce ülke seçin",
    gFirstName: "Vasi Adı",
    gFatherName: "Vasinin Baba Adı",
    gSurname: "Vasi Soyadı",
    gMotherName: "Vasinin Anne Adı",
    gMotherSurname: "Vasinin Anne Soyadı",
    gPhone: "Vasi Telefon Numarası",
    relation: "Yakınlık Derecesi",
    relFirstDegree: "Birinci derece akraba",
    relSecondDegree: "İkinci derece akraba",
    relPartner: "İş ortağı",
    relFriend: "Arkadaş",
  },
  en: {
    step1Title: "Create New Account",
    step1Subtitle: "Create your account in the financial world of the future",
    step2Title: "Personal Information",
    step2Subtitle: "Complete your details to continue",
    step3Title: "Guardian Information",
    step3Subtitle: "Person authorized to access funds in case of your death",
    step4Title: "Profession & Income",
    step4Subtitle: "Tell us about your work and approximate annual income",
    step5Title: "Identity Verification",
    step5Subtitle: "Take two photos to verify your identity",
    completedTitle: "Account Created Successfully",
    completedSubtitle: "Keep this unique security code in a safe place",
    draftRestored: "Your saved data has been restored",
    progress: "Signup Progress",
    profession: "Profession",
    professionPh: "Select your profession",
    companyName: "Company / Workplace Name",
    companyNamePh: "Enter your company or workplace name",
    annualIncome: "Approx. Annual Income (USD)",
    annualIncomePh: "e.g. 12000",
    errIncomeInvalid: "Please enter a valid annual income",
    gIdPhotoTitle: "Guardian ID Photo (Optional)",
    gIdPhotoHint: "You can add the guardian's ID photo now or skip this step and add it later from Settings.",
    optional: "Optional",
    skip: "Skip",
    idFrontTitle: "ID Front Photo",
    idFrontHint: "Tap here to open the camera and take a clear photo of the front of your ID card. Make sure all details are visible without glare or reflections.",
    selfieTitle: "Selfie with ID",
    selfieHint: "Tap here to take a photo of your face while holding your ID card next to it. This photo is used to match your identity and verify your account.",
    tapToCapture: "Tap to capture",
    retake: "Retake",
    secCodeLabel: "Unique Security Code",
    secCodeHelp: "This code is required for password recovery. Save it in a safe place — it will not be shown again.",
    copy: "Copy Code",
    copied: "Copied ✓",
    finish: "Finish",
    errPhotosRequired: "Both photos are required before continuing",
    email: "Email", emailPh: "example@trycash.app",
    phone: "Phone Number", phonePh: "Enter your phone number",
    password: "Password", passwordPh: "At least 8 characters",
    confirm: "Confirm Password", confirmPh: "Re-enter password",
    next: "Next", back: "Back to Sign In", backStep: "Back",
    selectCountry: "Select country",
    pwReqTitle: "Password requirements:",
    pwReqLen: "At least 8 characters",
    pwReqUpper: "At least one uppercase letter (A-Z)",
    pwReqLower: "At least one lowercase letter (a-z)",
    pwReqDigit: "At least one digit (0-9)",
    pwReqSym: "At least one symbol ( . _ - )",
    pwReqNoOther: "No other symbols",
    okMatch: "Passwords match",
    errInvalidEmail: "Invalid email format",
    errEmailTaken: "This email is already in use",
    errPhoneShort: "Phone number is incomplete",
    errPwWeak: "Password doesn't meet all requirements",
    errPwMismatch: "Passwords don't match",
    errMissing: "Please fill in all fields",
    successMsg: "Your data has been saved. Next step coming soon.",
    firstName: "First Name", fatherName: "Father's Name", surname: "Surname",
    motherName: "Mother's Name", motherSurname: "Mother's Surname",
    nationalId: "National ID Number",
    marital: "Marital Status",
    married: "Married", single: "Single", divorced: "Divorced", widowed: "Widowed",
    health: "Health Status",
    healthy: "Healthy", specialNeeds: "Special Needs", healthOther: "Other",
    dob: "Date of Birth", day: "Day", month: "Month", year: "Year",
    country: "Country", region: "Province / State",
    selectPlaceholder: "Select...",
    selectRegionFirst: "Select country first",
    gFirstName: "Guardian First Name",
    gFatherName: "Guardian Father's Name",
    gSurname: "Guardian Surname",
    gMotherName: "Guardian Mother's Name",
    gMotherSurname: "Guardian Mother's Surname",
    gPhone: "Guardian Phone Number",
    relation: "Relationship",
    relFirstDegree: "First-degree relative",
    relSecondDegree: "Second-degree relative",
    relPartner: "Business partner",
    relFriend: "Friend",
  },
};

const checkPwReqs = (pw) => ({
  len: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  digit: /[0-9]/.test(pw),
  sym: ALLOWED_SYMBOLS.test(pw),
  noOther: pw.length > 0 && !FORBIDDEN_SYMBOLS.test(pw),
});

export default function Signup() {
  const { lang } = useLanguage();
  const tr = T[lang];
  const navigate = useNavigate();
  const { register } = useAuth();

  // Lazy initial: read draft once on mount (no state-in-effect issue)
  const draft = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); }
    catch (e) { return {}; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draftHasData = useMemo(() => {
    return Object.keys(draft).some((k) => {
      if (k === "savedAt" || k === "step") return false;
      const v = draft[k];
      return v !== undefined && v !== null && v !== "" && v !== "SY";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findCountry = (code) => COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

  const [step, setStep] = useState(draft.step || 1);

  // Step 1 data
  const [email, setEmail] = useState(draft.email || "");
  const [phone, setPhone] = useState(draft.phone || "");
  const [country, setCountry] = useState(() => findCountry(draft.countryCode));
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const countryRef = useRef(null);

  // Step 2 data
  const [firstName, setFirstName] = useState(draft.firstName || "");
  const [fatherName, setFatherName] = useState(draft.fatherName || "");
  const [surname, setSurname] = useState(draft.surname || "");
  const [motherName, setMotherName] = useState(draft.motherName || "");
  const [motherSurname, setMotherSurname] = useState(draft.motherSurname || "");
  const [nationalId, setNationalId] = useState(draft.nationalId || "");
  const [marital, setMarital] = useState(draft.marital || "");
  const [health, setHealth] = useState(draft.health || "");
  const [dobY, setDobY] = useState(draft.dobY || "");
  const [dobM, setDobM] = useState(draft.dobM || "");
  const [dobD, setDobD] = useState(draft.dobD || "");
  const [country2, setCountry2] = useState(draft.country2 || "");
  const [region, setRegion] = useState(draft.region || "");

  // Step 3 (guardian) data
  const [gFirstName, setGFirstName] = useState(draft.gFirstName || "");
  const [gFatherName, setGFatherName] = useState(draft.gFatherName || "");
  const [gSurname, setGSurname] = useState(draft.gSurname || "");
  const [gMotherName, setGMotherName] = useState(draft.gMotherName || "");
  const [gMotherSurname, setGMotherSurname] = useState(draft.gMotherSurname || "");
  const [gPhone, setGPhone] = useState(draft.gPhone || "");
  const [gCountry, setGCountry] = useState(() => findCountry(draft.gCountryCode));
  const [gOpenCountry, setGOpenCountry] = useState(false);
  const gCountryRef = useRef(null);
  const [relation, setRelation] = useState(draft.relation || "");

  // Step 3 - Guardian ID photo (optional, not persisted for size reasons)
  const [gIdPhoto, setGIdPhoto] = useState(null);

  // Step 4 (Work / Income) data
  const [profession, setProfession] = useState(draft.profession || "");
  const [companyName, setCompanyName] = useState(draft.companyName || "");
  const [annualIncome, setAnnualIncome] = useState(draft.annualIncome || "");

  // Step 5 (ID photos) — not persisted in draft for size reasons
  const [idFrontPhoto, setIdFrontPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);

  // Final screen
  const [securityCode, setSecurityCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Terms & Conditions gate for step 5
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Show "draft restored" toast once after mount
  useEffect(() => {
    if (draftHasData) {
      const id = setTimeout(() => toast.success(T[lang].draftRestored), 500);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft on every change (skip password fields for security)
  useEffect(() => {
    const next = {
      step, email, phone, countryCode: country.code,
      firstName, fatherName, surname, motherName, motherSurname,
      nationalId, marital, health, dobY, dobM, dobD, country2, region,
      gFirstName, gFatherName, gSurname, gMotherName, gMotherSurname,
      gPhone, gCountryCode: gCountry.code, relation,
      profession, companyName, annualIncome,
      savedAt: Date.now(),
    };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); }
    catch (e) { /* localStorage may be full */ }
  }, [
    step, email, phone, country,
    firstName, fatherName, surname, motherName, motherSurname,
    nationalId, marital, health, dobY, dobM, dobD, country2, region,
    gFirstName, gFatherName, gSurname, gMotherName, gMotherSurname,
    gPhone, gCountry, relation,
    profession, companyName, annualIncome,
  ]);

  useEffect(() => {
    const onClick = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) setOpenCountry(false);
      if (gCountryRef.current && !gCountryRef.current.contains(e.target)) setGOpenCountry(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Reset region when country2 changes (handled via setter wrapper)
  const setCountry2WithReset = (c) => {
    setCountry2(c);
    setRegion("");
  };

  const pwReqs = useMemo(() => checkPwReqs(pw), [pw]);
  const pwStrong = Object.values(pwReqs).every(Boolean);
  const pwMatch = pw && pw2 && pw === pw2;

  const handleStep1 = (e) => {
    e.preventDefault();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) return toast.error(tr.errInvalidEmail);
    if (getEmails().includes(email.toLowerCase())) return toast.error(tr.errEmailTaken);
    if (phone.replace(/\D/g, "").length < 6) return toast.error(tr.errPhoneShort);
    if (!pwStrong) return toast.error(tr.errPwWeak);
    if (pw !== pw2) return toast.error(tr.errPwMismatch);

    localStorage.setItem("trycash_signup_step1", JSON.stringify({
      email, phone: `${country.dial} ${phone}`, country: country.code, passwordSet: true, ts: Date.now(),
    }));
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep2 = (e) => {
    e.preventDefault();
    const required = [firstName, fatherName, surname, motherName, motherSurname,
      nationalId, marital, health, dobY, dobM, dobD, country2, region];
    if (required.some((v) => !v)) return toast.error(tr.errMissing);

    localStorage.setItem("trycash_signup_step2", JSON.stringify({
      firstName, fatherName, surname, motherName, motherSurname,
      nationalId, marital, health,
      dob: `${dobY}-${String(dobM).padStart(2,"0")}-${String(dobD).padStart(2,"0")}`,
      country: country2, region, ts: Date.now(),
    }));
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep3 = (e) => {
    e.preventDefault();
    const required = [gFirstName, gFatherName, gSurname, gMotherName, gMotherSurname, gPhone, relation];
    if (required.some((v) => !v)) return toast.error(tr.errMissing);
    if (gPhone.replace(/\D/g, "").length < 6) return toast.error(tr.errPhoneShort);

    localStorage.setItem("trycash_signup_step3", JSON.stringify({
      gFirstName, gFatherName, gSurname, gMotherName, gMotherSurname,
      gPhone: `${gCountry.dial} ${gPhone}`, gCountry: gCountry.code, relation,
      gIdPhotoUploaded: !!gIdPhoto, ts: Date.now(),
    }));
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep4 = (e) => {
    e.preventDefault();
    if (!profession || !companyName.trim() || !annualIncome) return toast.error(tr.errMissing);
    const incomeNum = Number(String(annualIncome).replace(/[^\d.]/g, ""));
    if (!incomeNum || incomeNum < 0) return toast.error(tr.errIncomeInvalid);

    localStorage.setItem("trycash_signup_step4", JSON.stringify({
      profession, companyName: companyName.trim(), annualIncomeUSD: incomeNum, ts: Date.now(),
    }));
    setStep(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep5 = async (e) => {
    e.preventDefault();
    if (!idFrontPhoto || !selfiePhoto) return toast.error(tr.errPhotosRequired);
    if (!termsAccepted) { setShowTerms(true); return; }

    // Register the user via API
    const reg = await register({
      email, password: pw, phone: `${country.dial} ${phone}`, phoneCountry: country.code,
      firstName, fatherName, surname, motherName, motherSurname, nationalId,
      marital, health, dob: `${dobY}-${String(dobM).padStart(2,"0")}-${String(dobD).padStart(2,"0")}`,
      country: country2, region,
      gFirstName, gFatherName, gSurname, gMotherName, gMotherSurname,
      gPhone: `${gCountry.dial} ${gPhone}`, gCountry: gCountry.code, relation,
      profession, companyName: companyName.trim(), annualIncome: Number(annualIncome) || 0,
      idFrontPhoto, selfiePhoto,
    });
    if (!reg.ok) return toast.error(reg.error === "email_taken" ? tr.errEmailTaken : reg.error || tr.errEmailTaken);
    // Record terms acceptance
    acceptTerms(email);

    // Generate unique security code
    const code = generateUniqueSecurityCode(email);
    setSecurityCode(code);
    saveEmail(email);
    localStorage.removeItem(DRAFT_KEY);
    setStep(6);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(securityCode);
      setCopied(true);
      toast.success(tr.copied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleFinish = () => {
    // Clear all signup state and go to login
    localStorage.removeItem(DRAFT_KEY);
    navigate("/");
  };

  // Progress %
  const progressPct = step >= 6 ? 100 : Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="trycash-shell relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#d4af37]/15 blur-[120px]" />
        <div className="absolute bottom-0 left-10 h-[300px] w-[300px] rounded-full bg-[#a07a1f]/10 blur-[100px]" />
        <div className="absolute right-10 top-1/3 h-[280px] w-[280px] rounded-full bg-[#0f7b3a]/10 blur-[110px]" />
      </div>

      <TopBar />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-6 pb-12 pt-24 sm:pt-28">
        <LanguageSwitcher />

        {/* Progress bar with % */}
        {step < 6 && (
          <div className="trycash-progress-wrap mt-7" data-testid="progress-wrap">
            <div className="trycash-progress-labels">
              <span className="text-xs uppercase tracking-wider text-[#d4af37]/80">{tr.progress}</span>
              <span className="trycash-progress-pct" data-testid="progress-pct">{progressPct}%</span>
            </div>
            <div className="trycash-progress-track">
              <div className="trycash-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {/* Step indicator (5 steps) */}
        {step < 6 && (
          <div className="trycash-stepper mt-5" data-testid="step-indicator">
            <StepDot active={step >= 1} done={step > 1} number={1} />
            <span className="trycash-stepper-line" />
            <StepDot active={step >= 2} done={step > 2} number={2} />
            <span className="trycash-stepper-line" />
            <StepDot active={step >= 3} done={step > 3} number={3} />
            <span className="trycash-stepper-line" />
            <StepDot active={step >= 4} done={step > 4} number={4} />
            <span className="trycash-stepper-line" />
            <StepDot active={step >= 5} done={step > 5} number={5} />
          </div>
        )}

        <h1
          data-testid="signup-title"
          className="trycash-gold mt-6 text-center text-4xl font-semibold sm:text-5xl"
          style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic", lineHeight: 1.1 }}
        >
          {step === 1 && tr.step1Title}
          {step === 2 && tr.step2Title}
          {step === 3 && tr.step3Title}
          {step === 4 && tr.step4Title}
          {step === 5 && tr.step5Title}
          {step === 6 && tr.completedTitle}
        </h1>
        <div className="trycash-divider mt-4" />
        <p className="trycash-muted mt-3 text-center text-sm" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif" }}>
          {step === 1 && tr.step1Subtitle}
          {step === 2 && tr.step2Subtitle}
          {step === 3 && tr.step3Subtitle}
          {step === 4 && tr.step4Subtitle}
          {step === 5 && tr.step5Subtitle}
          {step === 6 && tr.completedSubtitle}
        </p>

        {step === 1 && (
          <Step1
            tr={tr} lang={lang}
            email={email} setEmail={setEmail}
            phone={phone} setPhone={setPhone}
            country={country} setCountry={setCountry}
            pw={pw} setPw={setPw} pw2={pw2} setPw2={setPw2}
            showPw={showPw} setShowPw={setShowPw}
            showPw2={showPw2} setShowPw2={setShowPw2}
            openCountry={openCountry} setOpenCountry={setOpenCountry} countryRef={countryRef}
            pwReqs={pwReqs} pwMatch={pwMatch}
            handleSubmit={handleStep1}
            onBackLogin={() => navigate("/")}
          />
        )}
        {step === 2 && (
          <Step2
            tr={tr} lang={lang}
            firstName={firstName} setFirstName={setFirstName}
            fatherName={fatherName} setFatherName={setFatherName}
            surname={surname} setSurname={setSurname}
            motherName={motherName} setMotherName={setMotherName}
            motherSurname={motherSurname} setMotherSurname={setMotherSurname}
            nationalId={nationalId} setNationalId={setNationalId}
            marital={marital} setMarital={setMarital}
            health={health} setHealth={setHealth}
            dobD={dobD} setDobD={setDobD}
            dobM={dobM} setDobM={setDobM}
            dobY={dobY} setDobY={setDobY}
            country2={country2} setCountry2={setCountry2WithReset}
            region={region} setRegion={setRegion}
            handleSubmit={handleStep2}
            onBackStep={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3
            tr={tr} lang={lang}
            gFirstName={gFirstName} setGFirstName={setGFirstName}
            gFatherName={gFatherName} setGFatherName={setGFatherName}
            gSurname={gSurname} setGSurname={setGSurname}
            gMotherName={gMotherName} setGMotherName={setGMotherName}
            gMotherSurname={gMotherSurname} setGMotherSurname={setGMotherSurname}
            gPhone={gPhone} setGPhone={setGPhone}
            gCountry={gCountry} setGCountry={setGCountry}
            gOpenCountry={gOpenCountry} setGOpenCountry={setGOpenCountry} gCountryRef={gCountryRef}
            relation={relation} setRelation={setRelation}
            gIdPhoto={gIdPhoto} setGIdPhoto={setGIdPhoto}
            handleSubmit={handleStep3}
            onBackStep={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4Work
            tr={tr} lang={lang}
            profession={profession} setProfession={setProfession}
            companyName={companyName} setCompanyName={setCompanyName}
            annualIncome={annualIncome} setAnnualIncome={setAnnualIncome}
            handleSubmit={handleStep4}
            onBackStep={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <Step5Photos
            tr={tr} lang={lang}
            idFrontPhoto={idFrontPhoto} setIdFrontPhoto={setIdFrontPhoto}
            selfiePhoto={selfiePhoto} setSelfiePhoto={setSelfiePhoto}
            handleSubmit={handleStep5}
            onBackStep={() => setStep(4)}
          />
        )}
        {step === 6 && (
          <Completed
            tr={tr} code={securityCode} copied={copied}
            onCopy={handleCopyCode} onFinish={handleFinish}
          />
        )}
      </main>
      {showTerms && (
        <TermsModal
          lang={lang}
          onAccept={() => { setTermsAccepted(true); setShowTerms(false); toast.success(lang === "ar" ? "تم قبول الشروط" : lang === "tr" ? "Şartlar kabul edildi" : "Terms accepted"); }}
          onCancel={() => setShowTerms(false)}
        />
      )}
    </div>
  );
}

const TermsModal = ({ lang, onAccept, onCancel }) => {
  const [checked, setChecked] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const T = TERMS_TEXT[lang];
  const cancel = lang === "ar" ? "إلغاء" : lang === "tr" ? "İptal" : "Cancel";
  const accept = lang === "ar" ? "أوافق وأكمل" : lang === "tr" ? "Kabul Et ve Devam Et" : "Accept and Continue";
  const readAll = lang === "ar" ? "الرجاء قراءة الشروط للنهاية" : lang === "tr" ? "Lütfen sonuna kadar okuyun" : "Please scroll to read all";
  return (
    <div className="trycash-modal-overlay" data-testid="terms-modal">
      <div className="trycash-modal max-w-lg">
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />
        <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{T.title}</h3>
        <p className="trycash-muted mt-1 text-[10px]">{T.version}</p>
        <div
          className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-[#d4af37]/20 bg-black/30 p-3 text-xs leading-relaxed"
          data-testid="terms-modal-scroll"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled(true);
          }}
        >
          {T.sections.map((s) => (
            <div key={s.h} className="mb-3">
              <p className="font-semibold text-[#d4af37]">{s.h}</p>
              <p className="mt-0.5 opacity-80">{s.p}</p>
            </div>
          ))}
        </div>
        <label className="mt-3 flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            data-testid="terms-checkbox"
            checked={checked}
            disabled={!scrolled}
            onChange={(e) => setChecked(e.target.checked)}
            className="trycash-gold-checkbox mt-0.5"
          />
          <span className="text-xs leading-relaxed">{T.acceptLabel}</span>
        </label>
        {!scrolled && <p className="mt-1 text-[10px] text-[#d4af37]/70">↓ {readAll}</p>}
        <div className="mt-4 flex gap-3">
          <button data-testid="terms-cancel" onClick={onCancel} className="trycash-gold-outline-btn flex-1 rounded-xl py-3 text-sm font-semibold">{cancel}</button>
          <button
            data-testid="terms-accept"
            onClick={onAccept}
            disabled={!checked}
            className={`trycash-gold-btn flex-[2] rounded-xl py-3 text-sm font-bold tracking-wider text-black ${!checked ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="relative z-10">{accept}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StepDot = ({ active, done, number }) => (
  <div className={`trycash-step-dot ${active ? "active" : ""}`}>
    {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span>{number}</span>}
  </div>
);

/* ---------- STEP 1 ---------- */
const Step1 = ({
  tr, lang, email, setEmail, phone, setPhone, country, setCountry,
  pw, setPw, pw2, setPw2, showPw, setShowPw, showPw2, setShowPw2,
  openCountry, setOpenCountry, countryRef, pwReqs, pwMatch,
  handleSubmit, onBackLogin,
}) => {
  const [pwFocused, setPwFocused] = useState(false);
  return (
    <>
      <form
        onSubmit={handleSubmit}
        data-testid="signup-form"
        className="trycash-card relative mt-8 w-full space-y-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-7 backdrop-blur-xl sm:p-8"
      >
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />

        <Field label={tr.email}>
          <div className="trycash-input-wrap">
            <Mail className="trycash-input-icon" strokeWidth={1.6} />
            <input
              data-testid="signup-email-input"
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={tr.emailPh} autoComplete="email" dir="ltr" className="trycash-input"
            />
          </div>
        </Field>

        <Field label={tr.phone}>
          <div className="relative flex items-stretch gap-2" ref={countryRef} dir="ltr">
            <button
              type="button" data-testid="country-selector"
              onClick={() => setOpenCountry((v) => !v)}
              className="trycash-country-btn flex items-center gap-2 rounded-xl px-3 py-2.5"
            >
              <country.Flag className="trycash-flag-icon" />
              <span className="text-sm font-semibold tracking-wide">{country.dial}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openCountry ? "rotate-180" : ""}`} strokeWidth={1.8} />
            </button>
            <div className="trycash-input-wrap flex-1">
              <Phone className="trycash-input-icon" strokeWidth={1.6} style={{ left: "0.9rem", right: "auto" }} />
              <input
                data-testid="signup-phone-input"
                type="tel" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
                placeholder={tr.phonePh} dir="ltr" className="trycash-input"
                style={{ paddingLeft: "2.5rem", paddingRight: "1rem" }}
              />
            </div>
            {openCountry && (
              <div data-testid="country-dropdown" className="trycash-country-menu absolute top-full left-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-[#d4af37]/40">
                {COUNTRIES.map((c) => {
                  const active = c.code === country.code;
                  return (
                    <button
                      key={c.code} type="button"
                      data-testid={`country-option-${c.code}`}
                      onClick={() => { setCountry(c); setOpenCountry(false); }}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${active ? "bg-[#d4af37]/15" : "hover:bg-[#d4af37]/10"}`}
                    >
                      <c.Flag className="trycash-flag-icon" />
                      <span className="flex-1 text-sm font-medium">{c.name[lang]}</span>
                      <span className="text-sm font-semibold text-[#d4af37]">{c.dial}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Field>

        <Field label={tr.password}>
          <div className="trycash-input-wrap">
            <Lock className="trycash-input-icon" strokeWidth={1.6} />
            <input
              data-testid="signup-password-input"
              type={showPw ? "text" : "password"} value={pw}
              onChange={(e) => setPw(e.target.value)}
              onFocus={() => setPwFocused(true)}
              placeholder={tr.passwordPh} autoComplete="new-password"
              className="trycash-input pr-11"
            />
            <button type="button" data-testid="toggle-pw" onClick={() => setShowPw((v) => !v)} className="trycash-pw-toggle" aria-label="toggle password">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password requirements checklist */}
          {(pwFocused || pw.length > 0) && (
            <div className="trycash-pw-reqs" data-testid="pw-requirements">
              <div className="trycash-pw-reqs-title">{tr.pwReqTitle}</div>
              <ReqItem ok={pwReqs.len} label={tr.pwReqLen} testid="pw-req-len" />
              <ReqItem ok={pwReqs.upper} label={tr.pwReqUpper} testid="pw-req-upper" />
              <ReqItem ok={pwReqs.lower} label={tr.pwReqLower} testid="pw-req-lower" />
              <ReqItem ok={pwReqs.digit} label={tr.pwReqDigit} testid="pw-req-digit" />
              <ReqItem ok={pwReqs.sym} label={tr.pwReqSym} testid="pw-req-sym" />
              <ReqItem ok={pwReqs.noOther} label={tr.pwReqNoOther} testid="pw-req-noother" />
            </div>
          )}
        </Field>

        <Field label={tr.confirm}>
          <div className="trycash-input-wrap">
            <Lock className="trycash-input-icon" strokeWidth={1.6} />
            <input
              data-testid="signup-confirm-input"
              type={showPw2 ? "text" : "password"} value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder={tr.confirmPh} autoComplete="new-password"
              className="trycash-input pr-11"
            />
            <button type="button" data-testid="toggle-pw2" onClick={() => setShowPw2((v) => !v)} className="trycash-pw-toggle" aria-label="toggle confirm password">
              {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pw2.length > 0 && (
            <div data-testid="pw-match-indicator" className={`flex items-center gap-1.5 pt-1 text-xs ${pwMatch ? "text-emerald-400" : "text-rose-400"}`}>
              {pwMatch ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              <span>{pwMatch ? tr.okMatch : tr.errPwMismatch}</span>
            </div>
          )}
        </Field>

        <NextBtn lang={lang} label={tr.next} testid="signup-next-btn" />
      </form>

      <button data-testid="back-to-login" type="button" onClick={onBackLogin} className="trycash-gold-link mt-6 text-sm">
        {tr.back}
      </button>
    </>
  );
};

/* ---------- STEP 2 ---------- */
const Step2 = ({
  tr, lang, firstName, setFirstName, fatherName, setFatherName, surname, setSurname,
  motherName, setMotherName, motherSurname, setMotherSurname, nationalId, setNationalId,
  marital, setMarital, health, setHealth,
  dobD, setDobD, dobM, setDobM, dobY, setDobY,
  country2, setCountry2, region, setRegion,
  handleSubmit, onBackStep,
}) => {
  const regions = useMemo(() => getRegionsByCountry(country2), [country2]);
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 100 }, (_, i) => currentYear - 18 - i), [currentYear]);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = useMemo(() => {
    if (!dobY || !dobM) return 31;
    return new Date(Number(dobY), Number(dobM), 0).getDate();
  }, [dobY, dobM]);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  return (
    <>
      <form
        onSubmit={handleSubmit}
        data-testid="signup-form-step2"
        className="trycash-card relative mt-8 w-full space-y-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-7 backdrop-blur-xl sm:p-8"
      >
        <span className="trycash-corner trycash-corner-tl" />
        <span className="trycash-corner trycash-corner-tr" />
        <span className="trycash-corner trycash-corner-bl" />
        <span className="trycash-corner trycash-corner-br" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={tr.firstName}>
            <IconInput icon={User} testid="firstName" value={firstName} onChange={setFirstName} />
          </Field>
          <Field label={tr.fatherName}>
            <IconInput icon={User} testid="fatherName" value={fatherName} onChange={setFatherName} />
          </Field>
          <Field label={tr.surname}>
            <IconInput icon={User} testid="surname" value={surname} onChange={setSurname} />
          </Field>
          <Field label={tr.motherName}>
            <IconInput icon={User} testid="motherName" value={motherName} onChange={setMotherName} />
          </Field>
          <Field label={tr.motherSurname}>
            <IconInput icon={User} testid="motherSurname" value={motherSurname} onChange={setMotherSurname} />
          </Field>
          <Field label={tr.nationalId}>
            <IconInput icon={IdCard} testid="nationalId" value={nationalId} onChange={(v) => setNationalId(v.replace(/\D/g, ""))} dir="ltr" />
          </Field>
        </div>

        <Field label={tr.marital}>
          <GoldSelect
            testid="marital-select"
            icon={Heart}
            value={marital} onChange={setMarital}
            placeholder={tr.selectPlaceholder}
            options={[
              { value: "married", label: tr.married },
              { value: "single", label: tr.single },
              { value: "divorced", label: tr.divorced },
              { value: "widowed", label: tr.widowed },
            ]}
          />
        </Field>

        <Field label={tr.health}>
          <GoldSelect
            testid="health-select"
            icon={Activity}
            value={health} onChange={setHealth}
            placeholder={tr.selectPlaceholder}
            options={[
              { value: "healthy", label: tr.healthy },
              { value: "specialNeeds", label: tr.specialNeeds },
              { value: "other", label: tr.healthOther },
            ]}
          />
        </Field>

        <Field label={tr.dob}>
          <div className="flex items-stretch gap-2" dir="ltr">
            <div className="flex-1">
              <GoldSelect
                testid="dob-day" icon={Calendar} compact
                value={dobD} onChange={setDobD} placeholder={tr.day}
                options={days.map((d) => ({ value: String(d), label: String(d) }))}
              />
            </div>
            <div className="flex-1">
              <GoldSelect
                testid="dob-month" compact
                value={dobM} onChange={setDobM} placeholder={tr.month}
                options={months.map((m) => ({ value: String(m), label: String(m) }))}
              />
            </div>
            <div className="flex-1">
              <GoldSelect
                testid="dob-year" compact
                value={dobY} onChange={setDobY} placeholder={tr.year}
                options={years.map((y) => ({ value: String(y), label: String(y) }))}
              />
            </div>
          </div>
        </Field>

        <Field label={tr.country}>
          <GoldSelect
            testid="country2-select" icon={MapPin}
            value={country2} onChange={setCountry2} placeholder={tr.selectPlaceholder}
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.name[lang], FlagIcon: c.Flag }))}
          />
        </Field>

        <Field label={tr.region}>
          <GoldSelect
            testid="region-select" icon={MapPin}
            value={region} onChange={setRegion}
            placeholder={country2 ? tr.selectPlaceholder : tr.selectRegionFirst}
            disabled={!country2}
            options={regions.map((r) => ({ value: r.code, label: r[lang] }))}
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            data-testid="step2-back-btn"
            onClick={onBackStep}
            className="trycash-gold-outline-btn flex-1 rounded-xl py-3 text-sm font-semibold tracking-wider"
          >
            {tr.backStep}
          </button>
          <div className="flex-[2]">
            <NextBtn lang={lang} label={tr.next} testid="step2-next-btn" />
          </div>
        </div>
      </form>
    </>
  );
};

/* ---------- STEP 3 (Guardian) ---------- */
const Step3 = ({
  tr, lang,
  gFirstName, setGFirstName, gFatherName, setGFatherName, gSurname, setGSurname,
  gMotherName, setGMotherName, gMotherSurname, setGMotherSurname,
  gPhone, setGPhone, gCountry, setGCountry,
  gOpenCountry, setGOpenCountry, gCountryRef,
  relation, setRelation,
  gIdPhoto, setGIdPhoto,
  handleSubmit, onBackStep,
}) => {
  return (
    <form
      onSubmit={handleSubmit}
      data-testid="signup-form-step3"
      className="trycash-card relative mt-8 w-full space-y-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-7 backdrop-blur-xl sm:p-8"
    >
      <span className="trycash-corner trycash-corner-tl" />
      <span className="trycash-corner trycash-corner-tr" />
      <span className="trycash-corner trycash-corner-bl" />
      <span className="trycash-corner trycash-corner-br" />

      {/* Info banner */}
      <div className="trycash-info-banner flex items-start gap-2.5 rounded-xl px-4 py-3">
        <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#d4af37]" strokeWidth={1.7} />
        <p className="text-xs leading-relaxed">
          {lang === "ar" && "الوصي هو الشخص الذي يحق له الوصول إلى أموالك في حال وفاتك (لا قدر الله). يجب أن تكون معلوماته دقيقة وموثقة."}
          {lang === "tr" && "Vasi, vefatınız halinde paranıza erişim hakkına sahip olan kişidir. Bilgilerinin doğru ve doğrulanabilir olması gerekir."}
          {lang === "en" && "The guardian is the person authorized to access your funds in case of your death. Their information must be accurate and verifiable."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={tr.gFirstName}>
          <IconInput icon={User} testid="gFirstName" value={gFirstName} onChange={setGFirstName} />
        </Field>
        <Field label={tr.gFatherName}>
          <IconInput icon={User} testid="gFatherName" value={gFatherName} onChange={setGFatherName} />
        </Field>
        <Field label={tr.gSurname}>
          <IconInput icon={User} testid="gSurname" value={gSurname} onChange={setGSurname} />
        </Field>
        <Field label={tr.gMotherName}>
          <IconInput icon={User} testid="gMotherName" value={gMotherName} onChange={setGMotherName} />
        </Field>
        <Field label={tr.gMotherSurname}>
          <IconInput icon={User} testid="gMotherSurname" value={gMotherSurname} onChange={setGMotherSurname} />
        </Field>
      </div>

      {/* Guardian Phone with country code */}
      <Field label={tr.gPhone}>
        <div className="relative flex items-stretch gap-2" ref={gCountryRef} dir="ltr">
          <button
            type="button" data-testid="guardian-country-selector"
            onClick={() => setGOpenCountry((v) => !v)}
            className="trycash-country-btn flex items-center gap-2 rounded-xl px-3 py-2.5"
          >
            <gCountry.Flag className="trycash-flag-icon" />
            <span className="text-sm font-semibold tracking-wide">{gCountry.dial}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${gOpenCountry ? "rotate-180" : ""}`} strokeWidth={1.8} />
          </button>
          <div className="trycash-input-wrap flex-1">
            <Phone className="trycash-input-icon" strokeWidth={1.6} style={{ left: "0.9rem", right: "auto" }} />
            <input
              data-testid="guardian-phone-input"
              type="tel" value={gPhone}
              onChange={(e) => setGPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
              placeholder={tr.phonePh} dir="ltr" className="trycash-input"
              style={{ paddingLeft: "2.5rem", paddingRight: "1rem" }}
            />
          </div>
          {gOpenCountry && (
            <div data-testid="guardian-country-dropdown" className="trycash-country-menu absolute top-full left-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-[#d4af37]/40">
              {COUNTRIES.map((c) => {
                const active = c.code === gCountry.code;
                return (
                  <button
                    key={c.code} type="button"
                    data-testid={`guardian-country-option-${c.code}`}
                    onClick={() => { setGCountry(c); setGOpenCountry(false); }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${active ? "bg-[#d4af37]/15" : "hover:bg-[#d4af37]/10"}`}
                  >
                    <c.Flag className="trycash-flag-icon" />
                    <span className="flex-1 text-sm font-medium">{c.name[lang]}</span>
                    <span className="text-sm font-semibold text-[#d4af37]">{c.dial}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Field>

      {/* Relationship dropdown */}
      <Field label={tr.relation}>
        <GoldSelect
          testid="relation-select"
          icon={Users}
          value={relation} onChange={setRelation}
          placeholder={tr.selectPlaceholder}
          options={[
            { value: "first_degree",  label: tr.relFirstDegree },
            { value: "second_degree", label: tr.relSecondDegree },
            { value: "partner",       label: tr.relPartner },
            { value: "friend",        label: tr.relFriend },
          ]}
        />
      </Field>

      {/* OPTIONAL Guardian ID photo */}
      <div className="space-y-2.5" data-testid="guardian-id-photo">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IdCard className="h-4 w-4 text-[#d4af37]" strokeWidth={1.7} />
            <h3 className="trycash-form-label text-xs font-semibold uppercase tracking-wider text-[#d4af37]/90">
              {tr.gIdPhotoTitle}
            </h3>
          </div>
          <span className="trycash-optional-badge">{tr.optional}</span>
        </div>
        <p className="trycash-muted text-xs leading-relaxed">{tr.gIdPhotoHint}</p>
        <OptionalPhotoBox
          testid="guardian-id-box"
          photo={gIdPhoto}
          setPhoto={setGIdPhoto}
          tapLabel={tr.tapToCapture}
          retakeLabel={tr.retake}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          data-testid="step3-back-btn"
          onClick={onBackStep}
          className="trycash-gold-outline-btn flex-1 rounded-xl py-3 text-sm font-semibold tracking-wider"
        >
          {tr.backStep}
        </button>
        <div className="flex-[2]">
          <NextBtn lang={lang} label={tr.next} testid="step3-next-btn" />
        </div>
      </div>
    </form>
  );
};

/* ---------- STEP 4 (Work / Income) ---------- */
const Step4Work = ({
  tr, lang,
  profession, setProfession,
  companyName, setCompanyName,
  annualIncome, setAnnualIncome,
  handleSubmit, onBackStep,
}) => {
  return (
    <form
      onSubmit={handleSubmit}
      data-testid="signup-form-step4"
      className="trycash-card relative mt-8 w-full space-y-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-7 backdrop-blur-xl sm:p-8"
    >
      <span className="trycash-corner trycash-corner-tl" />
      <span className="trycash-corner trycash-corner-tr" />
      <span className="trycash-corner trycash-corner-bl" />
      <span className="trycash-corner trycash-corner-br" />

      <Field label={tr.profession}>
        <GoldSelect
          testid="profession-select"
          icon={Briefcase}
          value={profession} onChange={setProfession}
          placeholder={tr.professionPh}
          options={PROFESSIONS.map((p) => ({ value: p.code, label: p[lang] }))}
        />
      </Field>

      <Field label={tr.companyName}>
        <div className="trycash-input-wrap">
          <Building2 className="trycash-input-icon" strokeWidth={1.6} />
          <input
            data-testid="signup-companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={tr.companyNamePh}
            className="trycash-input"
          />
        </div>
      </Field>

      <Field label={tr.annualIncome}>
        <div className="trycash-input-wrap">
          <DollarSign className="trycash-input-icon" strokeWidth={1.7} />
          <input
            data-testid="signup-annualIncome"
            type="text"
            inputMode="numeric"
            value={annualIncome}
            onChange={(e) => setAnnualIncome(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={tr.annualIncomePh}
            dir="ltr"
            className="trycash-input"
          />
        </div>
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          data-testid="step4-back-btn"
          onClick={onBackStep}
          className="trycash-gold-outline-btn flex-1 rounded-xl py-3 text-sm font-semibold tracking-wider"
        >
          {tr.backStep}
        </button>
        <div className="flex-[2]">
          <NextBtn lang={lang} label={tr.next} testid="step4-next-btn" />
        </div>
      </div>
    </form>
  );
};

/* ---------- STEP 5 (ID verification photos) ---------- */
const Step5Photos = ({ tr, lang, idFrontPhoto, setIdFrontPhoto, selfiePhoto, setSelfiePhoto, handleSubmit, onBackStep }) => {
  return (
    <form
      onSubmit={handleSubmit}
      data-testid="signup-form-step5"
      className="trycash-card relative mt-8 w-full space-y-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-7 backdrop-blur-xl sm:p-8"
    >
      <span className="trycash-corner trycash-corner-tl" />
      <span className="trycash-corner trycash-corner-tr" />
      <span className="trycash-corner trycash-corner-bl" />
      <span className="trycash-corner trycash-corner-br" />

      <PhotoBox
        testid="id-front-box"
        icon={IdCard}
        title={tr.idFrontTitle}
        hint={tr.idFrontHint}
        photo={idFrontPhoto}
        setPhoto={setIdFrontPhoto}
        tapLabel={tr.tapToCapture}
        retakeLabel={tr.retake}
      />

      <PhotoBox
        testid="selfie-box"
        icon={ScanFace}
        title={tr.selfieTitle}
        hint={tr.selfieHint}
        photo={selfiePhoto}
        setPhoto={setSelfiePhoto}
        tapLabel={tr.tapToCapture}
        retakeLabel={tr.retake}
      />

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          data-testid="step5-back-btn"
          onClick={onBackStep}
          className="trycash-gold-outline-btn flex-1 rounded-xl py-3 text-sm font-semibold tracking-wider"
        >
          {tr.backStep}
        </button>
        <div className="flex-[2]">
          <NextBtn lang={lang} label={tr.next} testid="step5-next-btn" />
        </div>
      </div>
    </form>
  );
};

const PhotoBox = ({ testid, icon: Icon, title, hint, photo, setPhoto, tapLabel, retakeLabel }) => {
  const inputRef = useRef(null);

  const onChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2.5" data-testid={testid}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#d4af37]" strokeWidth={1.7} />
        <h3 className="trycash-form-label text-xs font-semibold uppercase tracking-wider text-[#d4af37]/90">{title}</h3>
      </div>
      <p className="trycash-muted text-xs leading-relaxed">{hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onChange}
        className="hidden"
        data-testid={`${testid}-input`}
      />

      {photo ? (
        <div className="relative">
          <img src={photo} alt={title} className="trycash-photo-preview" data-testid={`${testid}-preview`} />
          <button
            type="button"
            data-testid={`${testid}-retake`}
            onClick={() => inputRef.current?.click()}
            className="trycash-photo-retake"
          >
            <Camera className="h-3.5 w-3.5" strokeWidth={2} />
            {retakeLabel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid={`${testid}-tap`}
          onClick={() => inputRef.current?.click()}
          className="trycash-photo-dropzone"
        >
          <Camera className="h-9 w-9 text-[#d4af37]" strokeWidth={1.4} />
          <span className="mt-2 text-sm font-medium text-[#d4af37]">{tapLabel}</span>
        </button>
      )}
    </div>
  );
};

/* ---------- Optional Photo Box (compact version for guardian ID) ---------- */
const OptionalPhotoBox = ({ testid, photo, setPhoto, tapLabel, retakeLabel }) => {
  const inputRef = useRef(null);

  const onChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onChange}
        className="hidden"
        data-testid={`${testid}-input`}
      />
      {photo ? (
        <div className="relative">
          <img src={photo} alt="Guardian ID" className="trycash-photo-preview trycash-photo-compact" data-testid={`${testid}-preview`} />
          <button type="button" data-testid={`${testid}-retake`} onClick={() => inputRef.current?.click()} className="trycash-photo-retake">
            <Camera className="h-3.5 w-3.5" strokeWidth={2} />
            {retakeLabel}
          </button>
          <button
            type="button"
            data-testid={`${testid}-remove`}
            onClick={() => setPhoto(null)}
            className="trycash-photo-remove"
            aria-label="remove"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid={`${testid}-tap`}
          onClick={() => inputRef.current?.click()}
          className="trycash-photo-dropzone trycash-photo-dropzone-compact"
        >
          <Camera className="h-7 w-7 text-[#d4af37]" strokeWidth={1.4} />
          <span className="mt-1.5 text-xs font-medium text-[#d4af37]">{tapLabel}</span>
        </button>
      )}
    </>
  );
};

/* ---------- COMPLETED (security code) screen ---------- */
const Completed = ({ tr, code, copied, onCopy, onFinish }) => {
  return (
    <div
      data-testid="completion-card"
      className="trycash-card relative mt-8 w-full space-y-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-7 backdrop-blur-xl sm:p-8"
    >
      <span className="trycash-corner trycash-corner-tl" />
      <span className="trycash-corner trycash-corner-tr" />
      <span className="trycash-corner trycash-corner-bl" />
      <span className="trycash-corner trycash-corner-br" />

      {/* Success badge */}
      <div className="flex justify-center">
        <div className="trycash-success-badge">
          <CheckCircle className="h-12 w-12" strokeWidth={1.6} />
        </div>
      </div>

      {/* Code label */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-[#d4af37]/90">
          <KeyRound className="h-4 w-4" strokeWidth={1.7} />
          <span className="text-xs font-semibold uppercase tracking-[0.25em]">{tr.secCodeLabel}</span>
        </div>
      </div>

      {/* The 15-char code */}
      <div className="trycash-seccode-box" data-testid="security-code">
        <span className="trycash-seccode" dir="ltr">{code}</span>
      </div>

      {/* Help text */}
      <p className="trycash-muted text-center text-xs leading-relaxed">{tr.secCodeHelp}</p>

      {/* Copy button */}
      <button
        type="button"
        data-testid="copy-code-btn"
        onClick={onCopy}
        className={`trycash-copy-btn group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-base font-bold tracking-wider ${copied ? "trycash-copy-done" : ""}`}
      >
        {copied ? (
          <>
            <CheckCircle className="h-5 w-5" strokeWidth={2.2} />
            <span>{tr.copied}</span>
          </>
        ) : (
          <>
            <Copy className="h-5 w-5" strokeWidth={2.2} />
            <span>{tr.copy}</span>
          </>
        )}
      </button>

      {/* Finish button */}
      <button
        type="button"
        data-testid="finish-btn"
        onClick={onFinish}
        className="trycash-gold-btn group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-base font-bold tracking-[0.2em] text-black"
      >
        <span className="relative z-10">{tr.finish}</span>
        <span className="trycash-gold-shine" />
      </button>
    </div>
  );
};

/* ---------- helper components ---------- */
const Field = ({ label, children }) => (
  <div className="space-y-2">
    <label className="trycash-form-label block text-xs font-medium tracking-wider text-[#d4af37]/90 uppercase">{label}</label>
    {children}
  </div>
);

const IconInput = ({ icon: Icon, testid, value, onChange, dir }) => (
  <div className="trycash-input-wrap">
    <Icon className="trycash-input-icon" strokeWidth={1.6} />
    <input
      data-testid={`signup-${testid}`}
      value={value} onChange={(e) => onChange(e.target.value)}
      className="trycash-input" dir={dir}
    />
  </div>
);

const ReqItem = ({ ok, label, testid }) => (
  <div data-testid={testid} className={`trycash-pw-req-item ${ok ? "ok" : ""}`}>
    {ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
    <span>{label}</span>
  </div>
);

const NextBtn = ({ lang, label, testid }) => (
  <button
    data-testid={testid} type="submit"
    className="trycash-gold-btn group relative mt-3 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-base font-bold tracking-[0.2em] text-black"
  >
    <span className="relative z-10 flex items-center gap-2">
      {label}
      {lang === "ar" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
    </span>
    <span className="trycash-gold-shine" />
  </button>
);

/* ---------- Custom Gold Select ---------- */
const GoldSelect = ({ testid, icon: Icon, value, onChange, placeholder, options, disabled = false, compact = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-testid={testid}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`trycash-select-btn flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {Icon && !compact && <Icon className="h-4 w-4 text-[#d4af37]/70 flex-shrink-0" strokeWidth={1.6} />}
        {selected?.FlagIcon && <selected.FlagIcon className="trycash-flag-icon flex-shrink-0" />}
        <span className={`flex-1 truncate text-sm ${selected ? "" : "trycash-muted"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#d4af37]/70 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} strokeWidth={1.8} />
      </button>
      {open && options.length > 0 && (
        <div data-testid={`${testid}-menu`} className="trycash-country-menu absolute left-0 right-0 top-full z-30 mt-2 max-h-60 overflow-y-auto rounded-xl border border-[#d4af37]/40">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value} type="button"
                data-testid={`${testid}-option-${opt.value}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${active ? "bg-[#d4af37]/15" : "hover:bg-[#d4af37]/10"}`}
              >
                {opt.FlagIcon && <opt.FlagIcon className="trycash-flag-icon flex-shrink-0" />}
                <span className="flex-1 text-sm font-medium">{opt.label}</span>
                {active && <Check className="h-4 w-4 text-[#d4af37]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
