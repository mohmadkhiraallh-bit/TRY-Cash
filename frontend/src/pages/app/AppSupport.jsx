import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send as SendIcon, Mic, MicOff, Paperclip, X, Camera as CameraIcon, FileText, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { toast } from "sonner";

const L = {
  ar: { title: "التواصل مع الدعم", tagline: "عالم المستقبل", brand: "TRY Cash", placeholder: "اكتب رسالتك...", botReply: "الرجاء الإنتظار، سيقوم الدعم بالرد عليك في أقرب وقت ممكن.", record: "تسجيل صوتي", stop: "إيقاف", attachPdf: "PDF فقط", attachImages: "صور (5 كحد أقصى)", takePhoto: "التقط صورة", maxImgs: "الحد الأقصى 5 صور", pdfOnly: "الرجاء اختيار ملف PDF فقط", startRec: "بدأ التسجيل", online: "متصل الآن" },
  tr: { title: "Destek", tagline: "Geleceğin Dünyası", brand: "TRY Cash", placeholder: "Mesajınızı yazın...", botReply: "Lütfen bekleyin, destek en kısa sürede size dönüş yapacaktır.", record: "Ses kaydı", stop: "Durdur", attachPdf: "Sadece PDF", attachImages: "Fotoğraf (maks 5)", takePhoto: "Fotoğraf çek", maxImgs: "Maks 5 resim", pdfOnly: "Yalnızca PDF seçin", startRec: "Kayıt başladı", online: "Çevrimiçi" },
  en: { title: "Contact Support", tagline: "World of the Future", brand: "TRY Cash", placeholder: "Type your message...", botReply: "Please wait, support will reply as soon as possible.", record: "Record audio", stop: "Stop", attachPdf: "PDF only", attachImages: "Images (max 5)", takePhoto: "Take photo", maxImgs: "Max 5 images", pdfOnly: "Please select PDF only", startRec: "Recording started", online: "Online now" },
};

export default function AppSupport() {
  const { current } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = L[lang];
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [attaching, setAttaching] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const scrollRef = useRef(null);
  const pdfRef = useRef(null);
  const imgsRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const pushUser = (msg) => {
    setMessages((m) => [...m, { id: Date.now(), from: "user", ...msg }]);
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, from: "bot", text: t.botReply }]);
    }, 700);
  };

  const send = () => {
    const v = input.trim();
    if (!v) return;
    pushUser({ text: v });
    setInput("");
  };

  const onPdf = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.type !== "application/pdf") return toast.error(t.pdfOnly);
    pushUser({ file: { name: f.name, size: f.size } });
    setAttaching(false);
  };

  const onImgs = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    if (!files.length) return;
    if ((e.target.files || []).length > 5) toast.warning(t.maxImgs);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => pushUser({ image: reader.result });
      reader.readAsDataURL(f);
    });
    setAttaching(false);
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        pushUser({ audio: URL.createObjectURL(blob) });
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      toast.success(t.startRec);
    } catch { toast.error("Mic denied"); }
  };
  const stopRec = () => { recorderRef.current?.stop(); setRecording(false); };

  if (!current) return null;

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      {/* Ornamental header (like login page) */}
      <div className="flex items-center justify-between pb-3">
        <button data-testid="support-back" onClick={() => navigate("/app/profile")} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <div className="text-center">
          <p className="trycash-gold text-xs tracking-[0.35em]" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif" }}>{t.tagline}</p>
          <h1 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", letterSpacing: "0.02em" }}>{t.brand}</h1>
          <p className="text-[10px] text-emerald-400">● {t.online}</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="trycash-divider mx-auto" />

      {/* Messages */}
      <div ref={scrollRef} className="mt-3 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#d4af37]/20 bg-black/30 p-4 backdrop-blur-md" data-testid="chat-messages">
        {messages.length === 0 && <p className="trycash-muted mt-16 text-center text-sm">— {t.title} —</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`trycash-msg ${m.from === "user" ? "trycash-msg-user" : "trycash-msg-bot"}`}>
              {m.text && <p className="text-sm leading-relaxed">{m.text}</p>}
              {m.image && <img src={m.image} alt="" className="max-h-48 rounded-lg" />}
              {m.audio && <audio src={m.audio} controls className="w-56" />}
              {m.file && (
                <div className="flex items-center gap-2 rounded-lg bg-black/40 p-2">
                  <FileText className="h-5 w-5 text-[#d4af37]" />
                  <span className="text-xs">{m.file.name}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input row */}
      <div className="mt-3 flex items-end gap-2" dir="ltr">
        <div className="relative">
          <button data-testid="attach-btn" onClick={() => setAttaching((v) => !v)} className="trycash-icon-btn h-11 w-11 inline-flex items-center justify-center rounded-full">
            {attaching ? <X className="h-4 w-4 text-[#d4af37]" /> : <Paperclip className="h-4 w-4 text-[#d4af37]" />}
          </button>
          {attaching && (
            <div className="trycash-country-menu absolute bottom-14 left-0 w-52 rounded-xl border border-[#d4af37]/40 py-1" data-testid="attach-menu">
              <button data-testid="attach-pdf" onClick={() => pdfRef.current?.click()} className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-[#d4af37]/10">
                <FileText className="h-4 w-4 text-[#d4af37]" /> <span className="text-sm">{t.attachPdf}</span>
              </button>
              <button data-testid="attach-imgs" onClick={() => imgsRef.current?.click()} className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-[#d4af37]/10">
                <ImageIcon className="h-4 w-4 text-[#d4af37]" /> <span className="text-sm">{t.attachImages}</span>
              </button>
              <button data-testid="attach-camera" onClick={() => cameraRef.current?.click()} className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-[#d4af37]/10">
                <CameraIcon className="h-4 w-4 text-[#d4af37]" /> <span className="text-sm">{t.takePhoto}</span>
              </button>
            </div>
          )}
        </div>
        <input ref={pdfRef} type="file" accept="application/pdf" onChange={onPdf} className="hidden" />
        <input ref={imgsRef} type="file" accept="image/*" multiple onChange={onImgs} className="hidden" />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onImgs} className="hidden" />

        <div className="trycash-input-wrap flex-1">
          <input data-testid="chat-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={t.placeholder} className="trycash-input" style={{ paddingLeft: "1rem", paddingRight: "1rem" }} />
        </div>

        {input.trim() ? (
          <button data-testid="send-msg-btn" onClick={send} className="trycash-gold-btn h-11 w-11 rounded-full text-black flex items-center justify-center"><SendIcon className="h-4 w-4 relative z-10" /></button>
        ) : (
          <button data-testid="rec-btn" onClick={recording ? stopRec : startRec} className={`trycash-icon-btn h-11 w-11 rounded-full flex items-center justify-center ${recording ? "trycash-rec-active" : ""}`}>
            {recording ? <MicOff className="h-4 w-4 text-red-400" /> : <Mic className="h-4 w-4 text-[#d4af37]" />}
          </button>
        )}
      </div>
    </div>
  );
}
