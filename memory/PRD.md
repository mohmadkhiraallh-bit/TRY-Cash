# TRY Cash - PRD

## Original Problem Statement
The user wants to build a financial app named **TRY Cash** ("عالم المستقبل" / World of the Future).
Phase 1: Login UI only. Auth backend will be added later with security measures.

### Specific UI requirements (verbatim from user)
- Email field + password field
- Big **Sign In** button below password (gold background, black text)
- **Create Account** as a *functional button* (gold), below Sign In
- "TRY Cash" word in **shiny gold**
- "عالم المستقبل" in gold **above** TRY Cash
- **Three language buttons** above TRY Cash: Arabic, Turkish, English
- **Top right corner**: light/dark theme toggle
- **Top left corner**: contact support button
- **Below "عالم المستقبل" (above TRY Cash)**: Syrian Revolution Flag (green / white / black with 3 red stars on the white center)
- **No Google sign-in for now** — user wants to set up security measures first

## User Personas
- Future TRY Cash customer (Arabic / Turkish / English speaker) needing a luxury, trust-instilling financial app

## Core Requirements
1. Tri-lingual login UI (AR / TR / EN) with RTL handling for Arabic
2. Light / dark theme toggle with persistence (localStorage)
3. Luxury gold aesthetic on dark + light theme
4. Syrian Revolution Flag SVG component
5. Support dialog from top-left
6. Working Create Account button → routes to /signup placeholder

## What's been implemented (2026-02-08)
- React Router with `/` (Login) and `/signup` (placeholder)
- `LanguageContext` with AR / TR / EN translations + RTL/LTR direction handling
- `ThemeContext` with dark/light toggle persisted to localStorage
- `TopBar` with support dialog (left) + theme toggle (right) — fixed-position regardless of RTL
- `LanguageSwitcher` pill (above TRY Cash)
- `SyrianFlag` SVG (3 stripes + 3 red 5-pointed stars)
- `Login` page with email, password (with show/hide), gold Sign In btn, gold outlined Create Account btn
- `Signup` 5-step KYC flow, `ForgotPassword`, Terms & Conditions
- Internal app: AppLayout (RTL bottom-nav with dividers, scanner FAB restricted to /app/home), AppHome (redesigned with luxury arrangement), AppServices, AppTransactions, AppProfile, AppReceive, AppSend, AppScanner, AppSupport chat, AppVerify, AppExchange (placeholder)
- Admin bypass: fingerprint modal + fallback security question ("فاطمة بطيخ")
- Notification system: `NotificationBell` component + persistent "verify account" notif for unverified users
- Luxury gold shimmer text effect (`.trycash-gold`) + gold gradient buttons (`.trycash-gold-btn`)
- Custom fonts: Cormorant Garamond (luxury serif for brand) + Tajawal / Amiri (Arabic)
- Toaster (sonner) styled with gold border
- All interactive elements have `data-testid`

## What's been implemented (2026-02-08 – Home page luxury redesign)
- **AppHome full redesign** matching user's reference screenshot:
  - Top header row: user name + verified badge on RIGHT (RTL), theme toggle + notification bell on LEFT
  - 3 currency mini-cards in horizontal grid (SYP / USD / TRY); active card highlighted with gold border + glow; clicking a card updates the balance detail
  - Active balance hero card with "صرف العملات" exchange pill + big golden amount + Receive (outlined) & Send (gold) buttons
  - Recent transactions section ("آخر المعاملات") with "عرض الكل" link
- **AppLayout**: bottom nav reversed in RTL (Home rightmost in Arabic), 1px gold dividers between tabs, larger buttons, raised rounded bar; scanner FAB now only on /app/home
- **AppReceive**: QR changed to classic white/black print with golden "TC" logo overlay centered
- **AppScanner**: removed non-functional upload button
- **AppExchange**: new placeholder ("قريباً") registered at /app/exchange
- Tested via testing_agent: 33/34 + 6/6 regression → all green

## What's been implemented (2026-02-08 – Admin Panel: Users + Verification + Live Tracking + KYC photos + Real QR)
- **AdminPanel refactored** into 3 tabs (العملات والصرف / المستخدمين / التوثيق)
- **Section 2 · Users** — every non-admin user auto-listed (newest first):
  - `تعديل الأرصدة` — inline edit SYP/USD/TRY per user
  - `المعلومات الشخصية` — full signup data + guardian info + green verified badge
  - `حظر / إلغاء الحظر` — textarea for reason, blocks login with the message
- **Section 3 · Verification** — 2 sub-lists auto-sorted:
  - `توثيق الحساب` (idFrontUploaded && !isVerified)
  - `توثيق الوصي` (guardianIdUploaded && !guardianVerified)
  - Each row: View (real photos as `<img src=dataURL>`) / Verify (with confirm) / Reject (with reason → user notification)
- **STRONG LIVE TRACKING** for user list:
  - 2-second polling safety net
  - `storage` event listener (cross-tab)
  - custom `trycash:users-changed` event (dispatched from register() — same-tab instant)
  - `focus` + `visibilitychange` listeners
  - Manual refresh button
  - Live tab badges + 'مباشر' pulsing indicator
  - Newest-first sort
- **KYC photos** — signup + verify pages now persist idFront/selfie/guardian dataURLs so admin's View modal shows real images
- **Exchange bug fixes**:
  - Admin acting as user: skips self-cancellation (only user-side wallets mutate)
  - Non-admin user's exchange properly deducts/credits admin's wallets
- **Real QR scanning** — jsQR-based decoder validates address via `getUserByAddressPub`, then navigates to `/app/send` with prefilled recipient state
- **Numbers cleanup** — new `.trycash-amount` class (sans-serif, tabular-nums, solid gold) replaces `.trycash-gold` shimmer on all numeric displays
- **Admin fingerprint enrollment** — WebAuthn platform authenticator (Touch ID / Windows Hello / Android fingerprint). Falls back to security question.
- Tested via testing_agent iterations 3-7 → all green (11/11 for live tracking)

## Prioritized Backlog (Next Phases)
### P0 — Next feature work
- AppServices tab implementation (services grid)
- Real Currency Exchange feature (live rates API — e.g., CoinGecko or ExchangeRate)
- Admin Panel dashboard: approve KYC uploads, read support chats, manage users

### P1 — Core financial features
- Custom JWT auth backend (FastAPI + Mongo) with bcrypt password hashing to replace localStorage mocks
- `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Wallet & multi-currency backend
- Real transaction history / transfer endpoint
- Notifications persistence in DB

### P2 — Engagement / Conversion
- 2FA (TOTP / SMS)
- Real KYC verification workflow (admin approve/reject)

## Next Tasks (immediate)
1. Confirm with user which upcoming feature to tackle next (Services, Exchange live rates, Admin panel, or backend switch)
