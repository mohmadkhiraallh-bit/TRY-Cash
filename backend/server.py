"""
TRY Cash backend — FastAPI + MongoDB + JWT (bcrypt).
Single-file monolith: auth, users, wallets, exchange, verification, notifications, admin.
"""
from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import secrets
import string
import logging
import uvicorn
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

import bcrypt
import jwt as pyjwt
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, status
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# ═══════════════════════════════════════════════════════════════
# Config & DB
# ═══════════════════════════════════════════════════════════════
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"].lower()
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
ADMIN_SECURITY_ANSWER = os.environ["ADMIN_SECURITY_ANSWER"]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ═══════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_token(email: str, is_admin: bool = False) -> str:
    payload = {
        "sub": email,
        "isAdmin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def decode_token(token: str) -> dict:
    return pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])

def gen_address() -> str:
    chars = string.ascii_uppercase + string.digits
    left = "".join(secrets.choice(chars) for _ in range(6))
    right = "".join(secrets.choice(chars) for _ in range(6))
    return f"TC{left}-{right}"

def now_ms() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)

def sanitize(user: dict) -> dict:
    """Strip sensitive fields, convert ObjectId → str."""
    if not user:
        return user
    user = dict(user)
    user.pop("_id", None)
    user.pop("password_hash", None)
    return user

# ═══════════════════════════════════════════════════════════════
# Auth dependency
# ═══════════════════════════════════════════════════════════════
async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = decode_token(token)
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"email": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("banned"):
        raise HTTPException(status_code=403, detail=user.get("ban_reason") or "Account banned")
    return sanitize(user)

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if not user.get("isAdmin"):
        raise HTTPException(status_code=403, detail="Admin only")
    return user

# ═══════════════════════════════════════════════════════════════
# FastAPI app
# ═══════════════════════════════════════════════════════════════
app = FastAPI(title="TRY Cash API")
api = APIRouter(prefix="/api")

# ─── Pydantic models ────────────────────────────────────────────
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    firstName: str
    fatherName: Optional[str] = ""
    surname: Optional[str] = ""
    motherName: Optional[str] = ""
    motherSurname: Optional[str] = ""
    nationalId: Optional[str] = ""
    phone: Optional[str] = ""
    phoneCountry: Optional[str] = ""
    dob: Optional[str] = ""
    country: Optional[str] = ""
    region: Optional[str] = ""
    marital: Optional[str] = ""
    health: Optional[str] = ""
    profession: Optional[str] = ""
    companyName: Optional[str] = ""
    annualIncome: Optional[float] = 0
    gFirstName: Optional[str] = ""
    gFatherName: Optional[str] = ""
    gSurname: Optional[str] = ""
    gMotherName: Optional[str] = ""
    gMotherSurname: Optional[str] = ""
    gPhone: Optional[str] = ""
    gCountry: Optional[str] = ""
    relation: Optional[str] = ""
    idFrontPhoto: Optional[str] = None
    selfiePhoto: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class AdminAnswerIn(BaseModel):
    email: EmailStr
    answer: str

class FpEnrollIn(BaseModel):
    credentialId: str

class UpdateWalletIn(BaseModel):
    currency: str
    amount: float

class BanIn(BaseModel):
    reason: str

class RejectIn(BaseModel):
    reason: str

class GuardianPhotoIn(BaseModel):
    guardianIdPhoto: str

class SendIn(BaseModel):
    toAddress: str
    amount: float
    currency: str
    notes: Optional[str] = None

class ExchangeIn(BaseModel):
    fromCurrency: str
    toCurrency: str
    fromAmount: float

class RatesUpdateIn(BaseModel):
    currency: str  # USD or TRY
    side: str      # sell or buy
    value: float

class PersonalInfoIn(BaseModel):
    firstName: Optional[str] = None
    fatherName: Optional[str] = None
    surname: Optional[str] = None
    motherName: Optional[str] = None
    motherSurname: Optional[str] = None
    nationalId: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None

# ═══════════════════════════════════════════════════════════════
# STARTUP: seed admin + indexes + default rates
# ═══════════════════════════════════════════════════════════════
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("address", unique=True, sparse=True)
    await db.transactions.create_index([("email", 1), ("ts", -1)])
    await db.exchange_log.create_index([("ts", -1)])
    await db.notifications.create_index([("email", 1), ("ts", -1)])

    # Seed admin
    admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not admin:
        await db.users.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "isAdmin": True,
            "isVerified": True,
            "firstName": "TRY Cash",
            "surname": "Support",
            "fullName": "TRY Cash Support",
            "address": gen_address(),
            "wallets": {"SYP": 0, "USD": 0, "TRY": 0},
            "requiresFingerprint": True,
            "adminSecurityAnswer": ADMIN_SECURITY_ANSWER,
            "webauthnCredentialId": None,
            "createdAt": now_ms(),
        })
    else:
        # keep password in sync with .env
        if not verify_password(ADMIN_PASSWORD, admin["password_hash"]):
            await db.users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
            )

    # Seed rates
    if not await db.rates.find_one({"key": "rates"}):
        await db.rates.insert_one({
            "key": "rates",
            "USD": {"sell": 13000, "buy": 13500},
            "TRY": {"sell": 300, "buy": 320},
        })


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ═══════════════════════════════════════════════════════════════
# ROUTES: Auth
# ═══════════════════════════════════════════════════════════════
@api.post("/auth/register")
async def register(body: RegisterIn):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="email_taken")

    full = " ".join([x for x in [body.firstName, body.fatherName, body.surname] if x])
    doc = body.model_dump()
    doc.pop("password", None)
    doc.update({
        "email": email,
        "password_hash": hash_password(body.password),
        "fullName": full,
        "isAdmin": False,
        "isVerified": False,
        "banned": False,
        "verificationPending": True,
        "idFrontUploaded": bool(body.idFrontPhoto),
        "selfieUploaded": bool(body.selfiePhoto),
        "guardianIdUploaded": False,
        "guardianVerified": False,
        "address": gen_address(),
        "wallets": {"SYP": 0, "USD": 0, "TRY": 0},
        "createdAt": now_ms(),
    })
    await db.users.insert_one(doc)
    user = await db.users.find_one({"email": email})
    token = create_token(email, is_admin=False)
    return {"ok": True, "token": token, "user": sanitize(user)}


@api.post("/auth/login")
async def login(body: LoginIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="invalid_credentials")
    if user.get("banned"):
        raise HTTPException(status_code=403, detail={"code": "banned", "reason": user.get("ban_reason") or ""})
    if user.get("isAdmin") and user.get("requiresFingerprint"):
        return {"ok": False, "needsFingerprint": True, "email": email}
    token = create_token(email, is_admin=bool(user.get("isAdmin")))
    return {"ok": True, "token": token, "user": sanitize(user)}


@api.post("/auth/admin-verify-answer")
async def admin_verify_answer(body: AdminAnswerIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("isAdmin"):
        raise HTTPException(status_code=404, detail="not_found")
    if body.answer.strip() != user.get("adminSecurityAnswer", ""):
        raise HTTPException(status_code=401, detail="wrong_answer")
    token = create_token(email, is_admin=True)
    return {"ok": True, "token": token, "user": sanitize(user)}


@api.post("/auth/admin-fp/enroll")
async def admin_fp_enroll(body: FpEnrollIn, admin=Depends(require_admin)):
    await db.users.update_one({"email": admin["email"]}, {"$set": {"webauthnCredentialId": body.credentialId}})
    return {"ok": True}


@api.post("/auth/admin-fp/delete")
async def admin_fp_delete(admin=Depends(require_admin)):
    await db.users.update_one({"email": admin["email"]}, {"$set": {"webauthnCredentialId": None}})
    return {"ok": True}


@api.get("/auth/admin-fp/get")
async def admin_fp_get(admin=Depends(require_admin)):
    user = await db.users.find_one({"email": admin["email"]})
    return {"credentialId": user.get("webauthnCredentialId")}


@api.post("/auth/admin-fp/verify")
async def admin_fp_verify(body: dict):
    """After WebAuthn assertion succeeds on the client, client posts the admin email; we mint a token."""
    email = (body.get("email") or "").lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("isAdmin"):
        raise HTTPException(status_code=404, detail="not_found")
    if not user.get("webauthnCredentialId"):
        raise HTTPException(status_code=400, detail="not_enrolled")
    token = create_token(email, is_admin=True)
    return {"ok": True, "token": token, "user": sanitize(user)}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"user": user}


# ═══════════════════════════════════════════════════════════════
# ROUTES: Users (public lookup + self update + KYC upload)
# ═══════════════════════════════════════════════════════════════
@api.get("/users/by-address/{address}")
async def user_by_address(address: str):
    user = await db.users.find_one({"address": address}, {"email": 1, "fullName": 1, "firstName": 1, "address": 1, "isVerified": 1})
    if not user:
        raise HTTPException(status_code=404, detail="not_found")
    user.pop("_id", None)
    return {"user": user}


@api.patch("/users/me")
async def update_me(body: PersonalInfoIn, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        if any(k in updates for k in ("firstName", "fatherName", "surname")):
            full_user = await db.users.find_one({"email": user["email"]})
            merged = {**full_user, **updates}
            updates["fullName"] = " ".join([x for x in [merged.get("firstName", ""), merged.get("fatherName", ""), merged.get("surname", "")] if x])
        await db.users.update_one({"email": user["email"]}, {"$set": updates})
    fresh = await db.users.find_one({"email": user["email"]})
    return {"user": sanitize(fresh)}


@api.post("/users/me/verify-id")
async def upload_id_photos(body: dict, user=Depends(get_current_user)):
    """Uploads idFrontPhoto + selfiePhoto (base64 dataURLs)."""
    id_photo = body.get("idFrontPhoto")
    selfie = body.get("selfiePhoto")
    if not id_photo or not selfie:
        raise HTTPException(status_code=400, detail="photos_required")
    await db.users.update_one({"email": user["email"]}, {"$set": {
        "idFrontPhoto": id_photo, "selfiePhoto": selfie,
        "idFrontUploaded": True, "selfieUploaded": True,
        "verificationPending": True, "verificationRejectedReason": None,
    }})
    return {"ok": True}


@api.post("/users/me/verify-guardian")
async def upload_guardian_photo(body: GuardianPhotoIn, user=Depends(get_current_user)):
    await db.users.update_one({"email": user["email"]}, {"$set": {
        "guardianIdPhoto": body.guardianIdPhoto,
        "guardianIdUploaded": True,
        "guardianRejectedReason": None,
    }})
    return {"ok": True}


# ═══════════════════════════════════════════════════════════════
# ROUTES: Admin — users list + actions
# ═══════════════════════════════════════════════════════════════
@api.get("/admin/users")
async def list_users(admin=Depends(require_admin)):
    cursor = db.users.find({"isAdmin": {"$ne": True}}).sort("createdAt", -1)
    users = []
    async for u in cursor:
        users.append(sanitize(u))
    return {"users": users}


@api.put("/admin/users/{email}/wallet")
async def admin_set_user_wallet(email: str, body: UpdateWalletIn, admin=Depends(require_admin)):
    email = email.lower()
    u = await db.users.find_one({"email": email})
    if not u:
        raise HTTPException(status_code=404, detail="not_found")
    wallets = u.get("wallets") or {"SYP": 0, "USD": 0, "TRY": 0}
    wallets[body.currency] = float(body.amount)
    await db.users.update_one({"email": email}, {"$set": {"wallets": wallets}})
    return {"ok": True, "wallets": wallets}


@api.post("/admin/users/{email}/ban")
async def admin_ban_user(email: str, body: BanIn, admin=Depends(require_admin)):
    email = email.lower()
    await db.users.update_one({"email": email}, {"$set": {"banned": True, "ban_reason": body.reason, "banned_at": now_ms()}})
    return {"ok": True}


@api.post("/admin/users/{email}/unban")
async def admin_unban_user(email: str, admin=Depends(require_admin)):
    email = email.lower()
    await db.users.update_one({"email": email}, {"$set": {"banned": False, "ban_reason": ""}})
    return {"ok": True}


@api.post("/admin/verify/id/{email}/approve")
async def admin_verify_id_approve(email: str, admin=Depends(require_admin)):
    email = email.lower()
    await db.users.update_one({"email": email}, {"$set": {
        "isVerified": True, "verificationPending": False, "verificationRejectedReason": None,
    }})
    await db.notifications.insert_one({"email": email, "ts": now_ms(), "type": "verify_approved", "read": False})
    return {"ok": True}


@api.post("/admin/verify/id/{email}/reject")
async def admin_verify_id_reject(email: str, body: RejectIn, admin=Depends(require_admin)):
    email = email.lower()
    await db.users.update_one({"email": email}, {"$set": {
        "verificationPending": False, "idFrontUploaded": False, "selfieUploaded": False,
        "verificationRejectedReason": body.reason,
        "idFrontPhoto": None, "selfiePhoto": None,
    }})
    await db.notifications.insert_one({"email": email, "ts": now_ms(), "type": "verify_rejected", "reason": body.reason, "read": False})
    return {"ok": True}


@api.post("/admin/verify/guardian/{email}/approve")
async def admin_verify_g_approve(email: str, admin=Depends(require_admin)):
    email = email.lower()
    await db.users.update_one({"email": email}, {"$set": {"guardianVerified": True, "guardianRejectedReason": None}})
    await db.notifications.insert_one({"email": email, "ts": now_ms(), "type": "guardian_approved", "read": False})
    return {"ok": True}


@api.post("/admin/verify/guardian/{email}/reject")
async def admin_verify_g_reject(email: str, body: RejectIn, admin=Depends(require_admin)):
    email = email.lower()
    await db.users.update_one({"email": email}, {"$set": {
        "guardianIdUploaded": False, "guardianRejectedReason": body.reason,
        "guardianIdPhoto": None,
    }})
    await db.notifications.insert_one({"email": email, "ts": now_ms(), "type": "guardian_rejected", "reason": body.reason, "read": False})
    return {"ok": True}


@api.get("/admin/exchange-log")
async def get_exchange_log(admin=Depends(require_admin)):
    cursor = db.exchange_log.find().sort("ts", -1).limit(500)
    log = []
    async for e in cursor:
        e.pop("_id", None); log.append(e)
    return {"log": log}


class ResetIn(BaseModel):
    confirm: str

@api.post("/admin/reset")
async def admin_reset(body: ResetIn, admin=Depends(require_admin)):
    """DANGER — wipe ALL non-admin data. Admin himself + rates remain."""
    if body.confirm != "RESET-TRYCASH":
        raise HTTPException(status_code=400, detail="wrong_confirmation")
    await db.users.delete_many({"isAdmin": {"$ne": True}})
    await db.transactions.delete_many({})
    await db.exchange_log.delete_many({})
    await db.notifications.delete_many({})
    await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"wallets": {"SYP": 0, "USD": 0, "TRY": 0}, "webauthnCredentialId": None}})
    return {"ok": True}


# ═══════════════════════════════════════════════════════════════
# ROUTES: Rates + admin wallet + exchange + send + tx
# ═══════════════════════════════════════════════════════════════
@api.get("/rates")
async def get_rates():
    doc = await db.rates.find_one({"key": "rates"})
    return {"USD": doc.get("USD"), "TRY": doc.get("TRY")}


@api.put("/admin/rates")
async def admin_update_rate(body: RatesUpdateIn, admin=Depends(require_admin)):
    if body.currency not in ("USD", "TRY") or body.side not in ("sell", "buy"):
        raise HTTPException(status_code=400, detail="invalid")
    await db.rates.update_one({"key": "rates"}, {"$set": {f"{body.currency}.{body.side}": float(body.value)}})
    doc = await db.rates.find_one({"key": "rates"})
    return {"USD": doc.get("USD"), "TRY": doc.get("TRY")}


@api.put("/admin/wallet")
async def admin_set_own_wallet(body: UpdateWalletIn, admin=Depends(require_admin)):
    if body.currency not in ("SYP", "USD", "TRY"):
        raise HTTPException(status_code=400, detail="invalid_currency")
    u = await db.users.find_one({"email": admin["email"]})
    wallets = u.get("wallets") or {"SYP": 0, "USD": 0, "TRY": 0}
    wallets[body.currency] = float(body.amount)
    await db.users.update_one({"email": admin["email"]}, {"$set": {"wallets": wallets}})
    return {"ok": True, "wallets": wallets}


@api.post("/tx/send")
async def send_money(body: SendIn, user=Depends(get_current_user)):
    if body.currency not in ("SYP", "USD", "TRY"):
        raise HTTPException(status_code=400, detail="invalid_currency")
    amt = float(body.amount)
    if amt <= 0:
        raise HTTPException(status_code=400, detail="invalid_amount")

    sender = await db.users.find_one({"email": user["email"]})
    if not sender or (sender.get("wallets", {}).get(body.currency, 0) < amt):
        raise HTTPException(status_code=400, detail="insufficient_balance")

    receiver = await db.users.find_one({"address": body.toAddress})
    if not receiver:
        raise HTTPException(status_code=404, detail="recipient_not_found")
    if receiver["email"] == sender["email"]:
        raise HTTPException(status_code=400, detail="cannot_send_to_self")

    await db.users.update_one({"email": sender["email"]}, {"$inc": {f"wallets.{body.currency}": -amt}})
    await db.users.update_one({"email": receiver["email"]}, {"$inc": {f"wallets.{body.currency}": amt}})

    ts = now_ms()
    await db.transactions.insert_one({
        "email": sender["email"], "type": "send",
        "to": receiver["address"], "toName": receiver.get("fullName") or receiver.get("firstName"),
        "amount": amt, "currency": body.currency, "notes": body.notes, "ts": ts,
    })
    await db.transactions.insert_one({
        "email": receiver["email"], "type": "received",
        "fromName": sender.get("fullName") or sender.get("firstName"),
        "amount": amt, "currency": body.currency, "notes": body.notes, "ts": ts,
    })
    await db.notifications.insert_one({
        "email": receiver["email"], "type": "received", "ts": ts,
        "amount": amt, "currency": body.currency,
        "fromName": sender.get("fullName") or sender.get("firstName"),
        "read": False,
    })

    fresh = await db.users.find_one({"email": sender["email"]})
    return {"ok": True, "user": sanitize(fresh)}


@api.post("/exchange")
async def do_exchange(body: ExchangeIn, user=Depends(get_current_user)):
    f, to = body.fromCurrency, body.toCurrency
    if f == to or "SYP" not in (f, to):
        raise HTTPException(status_code=400, detail="invalid_route")
    if f not in ("SYP", "USD", "TRY") or to not in ("SYP", "USD", "TRY"):
        raise HTTPException(status_code=400, detail="invalid_currency")

    amt = float(body.fromAmount)
    if amt <= 0:
        raise HTTPException(status_code=400, detail="invalid_amount")

    rates_doc = await db.rates.find_one({"key": "rates"})
    if f != "SYP" and to == "SYP":
        rate = rates_doc[f]["sell"]
        to_amount = amt * rate
    else:  # SYP → foreign
        rate = rates_doc[to]["buy"]
        to_amount = amt / rate

    u = await db.users.find_one({"email": user["email"]})
    if u.get("wallets", {}).get(f, 0) < amt:
        raise HTTPException(status_code=400, detail="insufficient_balance")

    is_admin_acting = u["email"] == ADMIN_EMAIL
    admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not is_admin_acting and admin.get("wallets", {}).get(to, 0) < to_amount:
        raise HTTPException(status_code=400, detail="insufficient_liquidity")

    await db.users.update_one({"email": u["email"]}, {"$inc": {f"wallets.{f}": -amt, f"wallets.{to}": to_amount}})
    if not is_admin_acting:
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$inc": {f"wallets.{f}": amt, f"wallets.{to}": -to_amount}})

    ts = now_ms()
    await db.transactions.insert_one({
        "email": u["email"], "type": "exchange",
        "paid": amt, "paidCurrency": f,
        "received": to_amount, "receivedCurrency": to,
        "ts": ts,
    })
    if not is_admin_acting:
        await db.transactions.insert_one({
            "email": ADMIN_EMAIL, "type": "exchange",
            "paid": to_amount, "paidCurrency": to,
            "received": amt, "receivedCurrency": f,
            "userName": u.get("fullName") or u.get("firstName"),
            "userEmail": u["email"], "ts": ts,
        })
    await db.exchange_log.insert_one({
        "ts": ts, "userEmail": u["email"],
        "userName": u.get("fullName") or u.get("firstName"),
        "paid": amt, "paidCurrency": f,
        "received": to_amount, "receivedCurrency": to,
    })

    fresh = await db.users.find_one({"email": u["email"]})
    return {"ok": True, "user": sanitize(fresh), "received": to_amount}


@api.get("/tx/me")
async def get_my_tx(user=Depends(get_current_user)):
    cursor = db.transactions.find({"email": user["email"]}).sort("ts", -1).limit(200)
    out = []
    async for t in cursor:
        t.pop("_id", None); out.append(t)
    return {"transactions": out}


# ═══════════════════════════════════════════════════════════════
# ROUTES: Notifications
# ═══════════════════════════════════════════════════════════════
@api.get("/notifications/me")
async def get_notifications(user=Depends(get_current_user)):
    cursor = db.notifications.find({"email": user["email"]}).sort("ts", -1).limit(50)
    out = []
    async for n in cursor:
        n["id"] = str(n["_id"]); n.pop("_id", None); out.append(n)
    return {"notifications": out}


@api.post("/notifications/read-all")
async def mark_notifications_read(user=Depends(get_current_user)):
    await db.notifications.update_many({"email": user["email"], "read": False}, {"$set": {"read": True}})
    return {"ok": True}


# ═══════════════════════════════════════════════════════════════
# Mount router + CORS & Execution
# ═══════════════════════════════════════════════════════════════
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("trycash")


@api.get("/")
async def root():
    return {"ok": True, "service": "TRY Cash API"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port)
