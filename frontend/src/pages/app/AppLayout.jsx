import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Wrench, Receipt, User, ScanLine } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect } from "react";

export default function AppLayout() {
  const { lang } = useLanguage();
  const { current } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!current) navigate("/", { replace: true });
  }, [current, navigate]);

  if (!current) return null;

  const baseTabs = [
    { path: "/app/home",         icon: Home,   labelAr: "الرئيسية",  labelTr: "Ana Sayfa", labelEn: "Home",         testid: "tab-home" },
    { path: "/app/services",     icon: Wrench, labelAr: "الخدمات",   labelTr: "Hizmetler", labelEn: "Services",     testid: "tab-services" },
    { path: "/app/transactions", icon: Receipt,labelAr: "المعاملات", labelTr: "İşlemler",  labelEn: "Transactions", testid: "tab-tx" },
    { path: "/app/profile",      icon: User,   labelAr: "الملف",     labelTr: "Profil",    labelEn: "Profile",      testid: "tab-profile" },
  ];
  // RTL: reverse tab order so Home appears on the right in Arabic
  const tabs = lang === "ar" ? [...baseTabs].reverse() : baseTabs;
  const pathLabel = (t) => lang === "ar" ? t.labelAr : lang === "tr" ? t.labelTr : t.labelEn;

  const isActive = (p) => location.pathname.startsWith(p);
  const isHome = location.pathname === "/app/home" || location.pathname === "/app/home/";

  return (
    <div className="trycash-shell relative min-h-screen overflow-hidden pb-32">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#d4af37]/12 blur-[120px]" />
        <div className="absolute bottom-32 right-10 h-[280px] w-[280px] rounded-full bg-[#0f7b3a]/10 blur-[110px]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-lg px-5 pt-8">
        <Outlet />
      </main>

      {/* Scanner FAB — home page only */}
      {isHome && (
        <button
          data-testid="scanner-fab"
          onClick={() => navigate("/app/scanner")}
          className="trycash-scan-fab"
          aria-label="Scanner"
        >
          <ScanLine className="h-7 w-7" strokeWidth={2} />
        </button>
      )}

      {/* Bottom nav — enlarged, dividers between items, raised */}
      <nav className="trycash-bottom-nav" dir="ltr" data-testid="bottom-nav">
        {tabs.map((t, i) => {
          const active = isActive(t.path);
          const Icon = t.icon;
          return (
            <button
              key={t.path}
              data-testid={t.testid}
              onClick={() => navigate(t.path)}
              className={`trycash-nav-item ${active ? "active" : ""} ${i < tabs.length - 1 ? "trycash-nav-divider" : ""}`}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.6} />
              <span className="text-[11px] font-medium tracking-wider">{pathLabel(t)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
