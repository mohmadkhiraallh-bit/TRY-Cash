import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Clipboard, Search, UserPlus, Send as SendIcon, BadgeCheck, User } from "lucide-react";
import { useAuth, getFriends, addFriend, addTx, fmtNum } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { SyrianFlagIcon, TurkishFlagIcon, USFlagIcon } from "../../components/Flags";
import { toast } from "sonner";

const L = {
  ar: {
    title: "إرسال", tabSend: "إرسال", tabFriends: "الأصدقاء",
    uploadHint: "ارفع صورة رمز QR", or: "أو", pastePh: "الصق العنوان", paste: "لصق", show: "إظهار الحساب",
    recipient: "المستلم", amount: "المبلغ", notes: "ملاحظات (اختياري)", from: "الإرسال من",
    send: "إرسال", addFriend: "إضافة صديق", confirm: "تأكيد الإرسال", cancel: "إلغاء",
    confirmMsg: (n, a, c) => `هل تريد إرسال ${fmtNum(a)} ${c} إلى ${n}؟`,
    sent: (n, a, c) => `تم إرسال ${fmtNum(a)} ${c} إلى ${n} بنجاح`,
    notFound: "لم يتم العثور على الحساب", noFriends: "لا يوجد أصدقاء بعد",
    friendAdded: "تمت إضافة الصديق", enterAmount: "الرجاء إدخال المبلغ", insufficient: "الرصيد غير كافٍ",
  },
  tr: {
    title: "Gönder", tabSend: "Gönder", tabFriends: "Arkadaşlar",
    uploadHint: "QR kodu resmi yükleyin", or: "veya", pastePh: "Adresi yapıştırın", paste: "Yapıştır", show: "Hesabı Göster",
    recipient: "Alıcı", amount: "Tutar", notes: "Not (isteğe bağlı)", from: "Gönderilen Cüzdan",
    send: "Gönder", addFriend: "Arkadaş Ekle", confirm: "Göndermeyi Onayla", cancel: "İptal",
    confirmMsg: (n, a, c) => `${fmtNum(a)} ${c} tutarını ${n} adlı kişiye göndermek istiyor musunuz?`,
    sent: (n, a, c) => `${fmtNum(a)} ${c} tutarı ${n} adlı kişiye başarıyla gönderildi`,
    notFound: "Hesap bulunamadı", noFriends: "Henüz arkadaş yok",
    friendAdded: "Arkadaş eklendi", enterAmount: "Lütfen tutar girin", insufficient: "Yetersiz bakiye",
  },
  en: {
    title: "Send", tabSend: "Send", tabFriends: "Friends",
    uploadHint: "Upload QR code image", or: "or", pastePh: "Paste address", paste: "Paste", show: "Show Account",
    recipient: "Recipient", amount: "Amount", notes: "Notes (optional)", from: "Send from",
    send: "Send", addFriend: "Add Friend", confirm: "Confirm Send", cancel: "Cancel",
    confirmMsg: (n, a, c) => `Send ${fmtNum(a)} ${c} to ${n}?`,
    sent: (n, a, c) => `Successfully sent ${fmtNum(a)} ${c} to ${n}`,
    notFound: "Account not found", noFriends: "No friends yet",
    friendAdded: "Friend added", enterAmount: "Please enter amount", insufficient: "Insufficient balance",
  },
};

const WALLETS = [
  { key: "SYP", name: "SYP", Flag: SyrianFlagIcon },
  { key: "USD", name: "USD", Flag: USFlagIcon },
  { key: "TRY", name: "TRY", Flag: TurkishFlagIcon },
];

export default function AppSend() {
  const { current, getUserByAddress, updateUser } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const t = L[lang];
  const [tab, setTab] = useState("send"); // send | friends
  const [address, setAddress] = useState("");
  const [recipient, setRecipient] = useState(null); // resolved user
  const [wallet, setWallet] = useState("USD");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef(null);

  const friends = useMemo(() => current ? getFriends(current.email) : [], [current]);

  // Pre-fill recipient/address if arriving from scanner
  useEffect(() => {
    const st = location.state;
    if (st?.prefillAddress) {
      setAddress(st.prefillAddress);
      if (st.recipient) setRecipient(st.recipient);
      // Clear so back/forward doesn't reapply
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  if (!current) return null;

  const doPaste = async () => {
    try { const txt = await navigator.clipboard.readText(); setAddress(txt.trim()); }
    catch { toast.error("Clipboard access denied"); }
  };

  const doShow = async () => {
    const addr = address.trim();
    const user = await getUserByAddress(addr);
    if (!user) return toast.error(t.notFound);
    if (user.email === current.email) return toast.error(t.notFound);
    setRecipient(user);
  };

  const doAddFriend = () => {
    if (!recipient) return;
    addFriend(current.email, {
      address: recipient.address,
      fullName: recipient.fullName || recipient.firstName,
      isVerified: recipient.isVerified,
    });
    toast.success(t.friendAdded);
  };

  const doSend = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error(t.enterAmount);
    if ((current.wallets[wallet] || 0) < amt) return toast.error(t.insufficient);
    setConfirming(true);
  };

  const confirmSend = async () => {
    const amt = Number(amount);
    try {
      await api.send(recipient.address, amt, wallet, notes.trim() || null);
      await refreshCurrent();
      toast.success(t.sent(recipient.fullName || recipient.firstName, amt, wallet));
    } catch (e) {
      toast.error(e.message || "Send failed");
      setConfirming(false);
      return;
    }
    setConfirming(false);
    navigate("/app/home");
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // MOCKED QR scan from image — we just remind user to paste for now
    toast.info("Please paste address instead (image scan pending backend)");
  };

  return (
    <div className="space-y-5" data-testid="send-page">
      <div className="flex items-center justify-between">
        <button data-testid="send-back" onClick={() => navigate("/app/home")} className="trycash-icon-btn h-10 w-10 inline-flex items-center justify-center rounded-full">
          <ArrowLeft className={`h-4 w-4 text-[#d4af37] ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
        <h1 className="trycash-gold text-2xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.title}</h1>
        <div className="w-10" />
      </div>

      {/* Tabs */}
      <div className="trycash-tabs" data-testid="send-tabs">
        <button data-testid="tab-send-btn" onClick={() => { setTab("send"); setRecipient(null); }} className={`trycash-tab ${tab === "send" ? "active" : ""}`}>{t.tabSend}</button>
        <button data-testid="tab-friends-btn" onClick={() => setTab("friends")} className={`trycash-tab ${tab === "friends" ? "active" : ""}`}>{t.tabFriends}</button>
      </div>

      {tab === "send" && !recipient && (
        <div className="trycash-card relative rounded-2xl border border-[#d4af37]/25 bg-black/40 p-6 space-y-4 backdrop-blur-xl">
          <span className="trycash-corner trycash-corner-tl" />
          <span className="trycash-corner trycash-corner-tr" />
          <span className="trycash-corner trycash-corner-bl" />
          <span className="trycash-corner trycash-corner-br" />

          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" data-testid="qr-file-input" />
          <button data-testid="upload-qr-btn" onClick={() => fileRef.current?.click()} className="trycash-photo-dropzone trycash-photo-dropzone-compact w-full">
            <Upload className="h-7 w-7 text-[#d4af37]" strokeWidth={1.4} />
            <span className="mt-1.5 text-xs font-medium text-[#d4af37]">{t.uploadHint}</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-[#d4af37]/60">
            <div className="flex-1 h-px bg-[#d4af37]/30" />
            <span>{t.or}</span>
            <div className="flex-1 h-px bg-[#d4af37]/30" />
          </div>

          <div className="flex items-stretch gap-2" dir="ltr">
            <div className="trycash-input-wrap flex-1">
              <Search className="trycash-input-icon" strokeWidth={1.6} style={{ left: "0.9rem", right: "auto" }} />
              <input data-testid="address-input" value={address} onChange={(e) => setAddress(e.target.value.toUpperCase())} placeholder={t.pastePh} className="trycash-input" style={{ paddingLeft: "2.5rem", paddingRight: "1rem" }} />
            </div>
            <button type="button" data-testid="paste-btn" onClick={doPaste} className="trycash-country-btn flex items-center gap-1.5 rounded-xl px-3 text-xs">
              <Clipboard className="h-4 w-4" /> {t.paste}
            </button>
          </div>

          <button data-testid="show-account-btn" onClick={doShow} disabled={!address.trim()} className={`trycash-gold-btn w-full rounded-xl py-3 text-sm font-bold tracking-wider text-black ${!address.trim() ? "opacity-50 cursor-not-allowed" : ""}`}>
            <span className="relative z-10">{t.show}</span>
          </button>
        </div>
      )}

      {tab === "send" && recipient && (
        <SendForm
          recipient={recipient} wallet={wallet} setWallet={setWallet}
          amount={amount} setAmount={setAmount} notes={notes} setNotes={setNotes}
          onCancel={() => setRecipient(null)} onSend={doSend} onAddFriend={doAddFriend}
          t={t} current={current}
        />
      )}

      {tab === "friends" && (
        <div className="space-y-2" data-testid="friends-list">
          {friends.length === 0 && <p className="trycash-muted py-12 text-center text-sm">{t.noFriends}</p>}
          {friends.map((f) => (
            <button key={f.address} data-testid={`friend-${f.address}`} onClick={() => { setRecipient(f); setTab("send"); }} className="trycash-menu-row">
              <div className="trycash-avatar-small"><User className="h-4 w-4" /></div>
              <div className="flex-1 text-start">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{f.fullName}</span>
                  {f.isVerified && <BadgeCheck className="h-3.5 w-3.5 fill-emerald-500 text-white" />}
                </div>
                <span className="trycash-muted text-[10px]" dir="ltr">{f.address}</span>
              </div>
              <SendIcon className="h-4 w-4 text-[#d4af37]" />
            </button>
          ))}
        </div>
      )}

      {confirming && (
        <div className="trycash-modal-overlay" data-testid="confirm-modal" onClick={() => setConfirming(false)}>
          <div className="trycash-modal" onClick={(e) => e.stopPropagation()}>
            <span className="trycash-corner trycash-corner-tl" />
            <span className="trycash-corner trycash-corner-tr" />
            <span className="trycash-corner trycash-corner-bl" />
            <span className="trycash-corner trycash-corner-br" />
            <h3 className="trycash-gold text-xl" style={{ fontFamily: "'Cormorant Garamond', 'Amiri', serif", fontStyle: "italic" }}>{t.confirm}</h3>
            <p className="mt-3 text-sm leading-relaxed">{t.confirmMsg(recipient.fullName || recipient.firstName, Number(amount), wallet)}</p>
            <div className="mt-5 flex gap-3">
              <button data-testid="confirm-cancel" onClick={() => setConfirming(false)} className="trycash-gold-outline-btn flex-1 rounded-xl py-3 text-sm font-semibold">{t.cancel}</button>
              <button data-testid="confirm-send" onClick={confirmSend} className="trycash-gold-btn flex-[2] rounded-xl py-3 text-sm font-bold tracking-wider text-black"><span className="relative z-10">{t.confirm}</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SendForm = ({ recipient, wallet, setWallet, amount, setAmount, notes, setNotes, onCancel, onSend, onAddFriend, t, current }) => (
  <div className="trycash-card relative rounded-2xl border border-[#d4af37]/25 bg-black/40 p-6 space-y-4 backdrop-blur-xl">
    <span className="trycash-corner trycash-corner-tl" />
    <span className="trycash-corner trycash-corner-tr" />
    <span className="trycash-corner trycash-corner-bl" />
    <span className="trycash-corner trycash-corner-br" />

    {/* Recipient card */}
    <div className="rounded-xl border border-[#d4af37]/30 bg-black/40 px-4 py-3" data-testid="recipient-card">
      <p className="mb-1 text-[10px] uppercase tracking-wider text-[#d4af37]/70">{t.recipient}</p>
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold">{recipient.fullName || recipient.firstName}</span>
        {recipient.isVerified && <BadgeCheck className="h-4 w-4 fill-emerald-500 text-white" data-testid="recipient-verified" />}
      </div>
      <p dir="ltr" className="trycash-muted mt-0.5 text-[11px]">{recipient.address}</p>
    </div>

    {/* Wallet selector */}
    <div>
      <p className="mb-2 text-xs uppercase tracking-wider text-[#d4af37]/80">{t.from}</p>
      <div className="grid grid-cols-3 gap-2" data-testid="wallet-selector">
        {WALLETS.map((w) => {
          const active = w.key === wallet;
          return (
            <button key={w.key} data-testid={`wallet-btn-${w.key}`} onClick={() => setWallet(w.key)} className={`trycash-wallet-btn ${active ? "active" : ""}`}>
              <w.Flag className="trycash-flag-icon" />
              <span className="text-xs font-semibold">{w.key}</span>
              <span className="trycash-muted text-[10px]" dir="ltr">{fmtNum(current.wallets[w.key])}</span>
            </button>
          );
        })}
      </div>
    </div>

    {/* Amount */}
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wider text-[#d4af37]/80">{t.amount}</p>
      <input data-testid="amount-input" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" inputMode="decimal" dir="ltr" className="trycash-input text-center" style={{ fontSize: "1.5rem", fontWeight: 700, paddingLeft: "1rem", paddingRight: "1rem", fontFamily: "'Cormorant Garamond', serif" }} />
    </div>

    {/* Notes */}
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wider text-[#d4af37]/80">{t.notes}</p>
      <textarea data-testid="notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="trycash-input" style={{ paddingLeft: "1rem", paddingRight: "1rem", resize: "none" }} />
    </div>

    <div className="flex items-center gap-3 pt-2">
      <button type="button" data-testid="add-friend-btn" onClick={onAddFriend} className="trycash-gold-outline-btn flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold">
        <UserPlus className="h-4 w-4" /> {t.addFriend}
      </button>
      <button data-testid="do-send-btn" onClick={onSend} className="trycash-gold-btn flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wider text-black">
        <span className="relative z-10 flex items-center gap-2"><SendIcon className="h-4 w-4" /> {t.send}</span>
      </button>
    </div>
    <button type="button" data-testid="send-form-cancel" onClick={onCancel} className="trycash-gold-link mx-auto block text-xs">{t.cancel}</button>
  </div>
);
