/**
 * Notifications system (mock).
 * - Persistent "verify your account" notification for unverified users
 * - Transaction notifications ("لقد وصلتك حوالة بقيمة X SYP")
 */
const NOTIF_KEY_PREFIX = "trycash_notifs_";

const read = (email) => {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY_PREFIX + email) || "[]"); }
  catch { return []; }
};
const write = (email, list) => localStorage.setItem(NOTIF_KEY_PREFIX + email, JSON.stringify(list));

export const getNotifs = (user) => {
  if (!user) return [];
  const list = read(user.email);
  // Prepend persistent verification prompt if not verified
  if (!user.isVerified) {
    const alreadyPending = user.verificationPending || user.idFrontUploaded;
    list.unshift({
      id: "system-verify",
      persistent: true,
      type: "verify",
      pending: alreadyPending,
      ts: Date.now(),
    });
  }
  return list;
};

export const pushNotif = (email, notif) => {
  const list = read(email);
  list.unshift({ id: `N${Date.now()}`, read: false, ts: Date.now(), ...notif });
  write(email, list.slice(0, 50));
};

export const markAllRead = (email) => {
  const list = read(email);
  write(email, list.map((n) => ({ ...n, read: true })));
};

export const unreadCount = (user) => {
  if (!user) return 0;
  const list = getNotifs(user);
  return list.filter((n) => n.persistent || !n.read).length;
};
