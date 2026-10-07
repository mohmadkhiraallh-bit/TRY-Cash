import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, ShieldAlert, ArrowDownCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { getNotifs, markAllRead, unreadCount } from "../utils/notifications";
import { toast } from "sonner";

const L = {
  ar: {
    title: "الإشعارات",
    verifyTitle: "يلزم توثيق حسابك",
    verifyDesc: "اضغط لبدء رفع صور الهوية",
    pending: "تم استلام طلبك، الرجاء انتظار الموافقة على التوثيق",
    approvedTitle: "✓ تم توثيق حسابك",
    approvedDesc: "مبروك! أصبح حسابك موثقاً",
    rejectedTitle: "تم رفض طلب توثيق حسابك",
    guardianApprovedTitle: "✓ تم توثيق الوصي",
    guardianRejectedTitle: "تم رفض توثيق الوصي",
    empty: "لا إشعارات جديدة",
    receivedFmt: (a, c, n) => `وصلتك حوالة بقيمة ${a} ${c}${n ? " من " + n : ""}`,
  },
  tr: {
    title: "Bildirimler",
    verifyTitle: "Hesabınızı doğrulamanız gerekiyor",
    verifyDesc: "Kimlik fotoğraflarını yüklemek için dokunun",
    pending: "İsteğiniz alındı, doğrulama onayını bekleyin",
    approvedTitle: "✓ Hesabınız doğrulandı",
    approvedDesc: "Tebrikler! Hesabınız doğrulandı",
    rejectedTitle: "Doğrulama reddedildi",
    guardianApprovedTitle: "✓ Vasi doğrulandı",
    guardianRejectedTitle: "Vasi doğrulaması reddedildi",
    empty: "Yeni bildirim yok",
    receivedFmt: (a, c, n) => `${a} ${c} tutarında havale aldınız${n ? " (" + n + ")" : ""}`,
  },
  en: {
    title: "Notifications",
    verifyTitle: "Verify your account",
    verifyDesc: "Tap to upload ID photos",
    pending: "Your request is received, waiting for admin approval",
    approvedTitle: "✓ Account verified",
    approvedDesc: "Congratulations! Your account is verified",
    rejectedTitle: "Verification rejected",
    guardianApprovedTitle: "✓ Guardian verified",
    guardianRejectedTitle: "Guardian verification rejected",
    empty: "No new notifications",
    receivedFmt: (a, c, n) => `You received ${a} ${c}${n ? " from " + n : ""}`,
  },
};

export default function NotificationBell() {
  const { current } = useAuth();
  const { lang } = useLanguage();
  const t = L[lang];
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const notifs = useMemo(() => current ? getNotifs(current) : [], [current, open]);
  const count = useMemo(() => current ? unreadCount(current) : 0, [current, open]);

  useEffect(() => {
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, []);

  useEffect(() => { if (open && current) markAllRead(current.email); }, [open, current]);

  if (!current) return null;

  const onNotifClick = (n) => {
    setOpen(false);
    if (n.type === "verify") {
      if (n.pending) return toast.info(t.pending);
      navigate("/app/verify-id");
    }
  };

  return (
    <div ref={ref} className="relative" data-testid="notif-bell-wrap">
      <button
        data-testid="notif-bell-btn"
        onClick={() => setOpen((v) => !v)}
        className="trycash-bell-btn"
        aria-label={t.title}
      >
        <Bell className="h-5 w-5 text-[#d4af37]" strokeWidth={1.7} />
        {count > 0 && <span className="trycash-bell-dot" data-testid="notif-count">{count > 9 ? "9+" : count}</span>}
      </button>
      {open && (
        <div className="trycash-notif-menu" data-testid="notif-menu">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#d4af37]/25">
            <h4 className="text-sm font-semibold text-[#d4af37]" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.title}</h4>
            <button data-testid="notif-close" onClick={() => setOpen(false)} className="text-[#d4af37]/60 hover:text-[#d4af37]"><X className="h-4 w-4" /></button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifs.length === 0 && <p className="trycash-muted p-5 text-center text-xs">{t.empty}</p>}
            {notifs.map((n) => (
              <button
                key={n.id}
                data-testid={`notif-${n.id}`}
                onClick={() => onNotifClick(n)}
                className={`trycash-notif-item ${n.persistent ? "trycash-notif-persistent" : ""}`}
              >
                {n.type === "verify" && <ShieldAlert className="h-4 w-4 flex-shrink-0 text-amber-400" />}
                {n.type === "received" && <ArrowDownCircle className="h-4 w-4 flex-shrink-0 text-emerald-400" />}
                {n.type === "verify_approved" && <ShieldAlert className="h-4 w-4 flex-shrink-0 text-emerald-400" />}
                {n.type === "verify_rejected" && <ShieldAlert className="h-4 w-4 flex-shrink-0 text-rose-400" />}
                {n.type === "guardian_approved" && <ShieldAlert className="h-4 w-4 flex-shrink-0 text-emerald-400" />}
                {n.type === "guardian_rejected" && <ShieldAlert className="h-4 w-4 flex-shrink-0 text-rose-400" />}
                <div className="flex-1 text-start">
                  {n.type === "verify" && (
                    <>
                      <p className="text-xs font-semibold">{t.verifyTitle}</p>
                      <p className="trycash-muted mt-0.5 text-[10px]">{n.pending ? t.pending : t.verifyDesc}</p>
                    </>
                  )}
                  {n.type === "received" && (
                    <>
                      <p className="text-xs font-semibold">{t.receivedFmt(n.amount, n.currency, n.fromName)}</p>
                      <p className="trycash-muted mt-0.5 text-[10px]" dir="ltr">{new Date(n.ts).toLocaleString("en-US")}</p>
                    </>
                  )}
                  {n.type === "verify_approved" && (
                    <>
                      <p className="text-xs font-semibold text-emerald-400">{t.approvedTitle}</p>
                      <p className="trycash-muted mt-0.5 text-[10px]">{t.approvedDesc}</p>
                    </>
                  )}
                  {n.type === "verify_rejected" && (
                    <>
                      <p className="text-xs font-semibold text-rose-400">{t.rejectedTitle}</p>
                      <p className="mt-0.5 text-[10px] opacity-90">{n.reason}</p>
                    </>
                  )}
                  {n.type === "guardian_approved" && (
                    <>
                      <p className="text-xs font-semibold text-emerald-400">{t.guardianApprovedTitle}</p>
                    </>
                  )}
                  {n.type === "guardian_rejected" && (
                    <>
                      <p className="text-xs font-semibold text-rose-400">{t.guardianRejectedTitle}</p>
                      <p className="mt-0.5 text-[10px] opacity-90">{n.reason}</p>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
