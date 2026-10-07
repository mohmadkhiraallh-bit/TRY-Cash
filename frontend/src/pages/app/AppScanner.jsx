import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, ScanLine } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { getUserByAddressPub } from "../../contexts/AuthContext";
import jsQR from "jsqr";
import { toast } from "sonner";

const L = {
  ar: { title: "الماسح الضوئي", hint: "وجّه الكاميرا نحو رمز QR الخاص بالمستلم", enable: "تشغيل الكاميرا", denied: "تم رفض إذن الكاميرا.", back: "رجوع", scanning: "جارٍ البحث عن رمز QR...", invalid: "رمز غير صالح — هذا الرمز ليس عنواناً في تطبيقنا" },
  tr: { title: "Tarayıcı", hint: "Kamerayı alıcının QR koduna yöneltin", enable: "Kamerayı Aç", denied: "Kamera izni reddedildi.", back: "Geri", scanning: "QR kod aranıyor...", invalid: "Geçersiz kod — TRY Cash adresi değil" },
  en: { title: "Scanner", hint: "Point the camera at the recipient's QR code", enable: "Enable Camera", denied: "Camera permission denied.", back: "Back", scanning: "Scanning for QR...", invalid: "Invalid code — not a TRY Cash address" },
};

export default function AppScanner() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = L[lang];
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const decodedOnceRef = useRef(false);

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  const startScanning = () => {
    if (scanIntervalRef.current) return;
    scanIntervalRef.current = setInterval(async () => {
      if (decodedOnceRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "dontInvert" });
      if (code && code.data) {
        const address = code.data.trim();
        decodedOnceRef.current = true;
        const target = await getUserByAddressPub(address);
        if (target) {
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
          navigate("/app/send", { state: { prefillAddress: address, recipient: { fullName: target.fullName, firstName: target.firstName, address: target.address, email: target.email } } });
        } else {
          decodedOnceRef.current = false;
          toast.error(t.invalid);
        }
      }
    }, 400);
  };

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      startScanning();
    } catch {
      toast.error(t.denied);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button data-testid="scanner-back" onClick={() => navigate(-1)} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <h1 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.title}</h1>
        <div className="w-10" />
      </div>
      <p className="trycash-muted text-center text-sm">{t.hint}</p>

      <div className="trycash-scan-viewport" data-testid="scan-viewport">
        {streaming ? (
          <>
            <video ref={videoRef} className="trycash-scan-video" playsInline muted data-testid="scan-video" />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div className="trycash-scan-frame" />
            <div className="trycash-scan-line" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-[#d4af37]/50 bg-black/60 px-3 py-1 text-[10px] text-[#f1d875]">
              <ScanLine className="h-3 w-3" /> {t.scanning}
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
            <Camera className="h-16 w-16 text-[#d4af37]/70" strokeWidth={1.3} />
            <button data-testid="enable-camera-btn" onClick={enableCamera} className="trycash-gold-btn rounded-xl px-6 py-3 text-sm font-bold tracking-wider text-black">
              <span className="relative z-10">{t.enable}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
