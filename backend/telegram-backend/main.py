# main.py

import os
import shutil
from uuid import uuid4
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger

from telethon.sync import TelegramClient
from telethon.tl.functions.contacts import GetContactsRequest
from telethon.tl.types import User, Chat, Channel

from supabase import create_client
import firebase_admin
from firebase_admin import credentials, firestore

from dotenv import load_dotenv

# ─── CARREGA VARIÁVEIS DE AMBIENTE ────────────────────────────────────────────
load_dotenv()

# ─── INICIALIZAÇÃO DO FIREBASE ────────────────────────────────────────────────
cred = credentials.Certificate(os.getenv("FIREBASE_CRED"))
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
firestore_db = firestore.client()

# ─── CONFIGURAÇÃO DO TELEGRAM ─────────────────────────────────────────────────
API_ID      = int(os.getenv("API_ID"))
API_HASH    = os.getenv("API_HASH")
SESSION_DIR = "sessions"
os.makedirs(SESSION_DIR, exist_ok=True)

# ─── ARMAZENAMENTO TEMPORÁRIO ─────────────────────────────────────────────────
TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# ─── CONFIGURAÇÃO DO SUPABASE ─────────────────────────────────────────────────
SUPABASE_URL   = os.getenv("SUPABASE_URL")
SUPABASE_KEY   = os.getenv("SUPABASE_KEY")
BUCKET         = os.getenv("SUPABASE_BUCKET")
supabase       = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── AGENDADOR ───────────────────────────────────────────────────────────────
scheduler = AsyncIOScheduler()
scheduler.start()

# ─── MODELOS DE DADOS ─────────────────────────────────────────────────────────
class PhoneNumber(BaseModel):
    phone: str

class VerifyCode(BaseModel):
    phone: str
    code: str
    phone_code_hash: str

# ─── FUNÇÃO AUXILIAR DE BROADCAST ─────────────────────────────────────────────
async def perform_broadcast(
    phone: str,
    message: str,
    recipients: str,
    file_key: str = None,
    job_id: str = None
):
    local_file = None
    if file_key:
        data = supabase.storage.from_(BUCKET).download(file_key)
        local_file = os.path.join(TEMP_DIR, os.path.basename(file_key))
        with open(local_file, "wb") as f:
            f.write(data)

    client = TelegramClient(f"{SESSION_DIR}/{phone}", API_ID, API_HASH)
    await client.connect()

    for r in [r.strip() for r in recipients.split(",")]:
        try:
            target = int(r) if r.lstrip("-").isdigit() else r
            entity = await client.get_entity(target)
            if local_file:
                await client.send_file(entity, local_file, caption=message)
            else:
                await client.send_message(entity, message)
        except Exception as err:
            print(f"❌ Erro ao enviar para {r}: {err}")

    await client.disconnect()

    if job_id:
        firestore_db.collection("scheduled_broadcasts") \
            .document(job_id) \
            .update({
                "status": "sent",
                "sent_at": datetime.utcnow()
            })

    if local_file and os.path.exists(local_file):
        os.remove(local_file)

# ─── LIFESPAN PARA REAGENDAR JOBS PENDENTES ──────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    now = datetime.utcnow()
    docs = (
        firestore_db.collection("scheduled_broadcasts")
        .where("status", "==", "pending")
        .where("send_at", ">", now)
        .stream()
    )
    for doc in docs:
        rec = doc.to_dict()
        job_id = doc.id
        trigger = DateTrigger(run_date=rec["send_at"])
        scheduler.add_job(
            perform_broadcast,
            trigger=trigger,
            args=[
                rec["phone"],
                rec["message"],
                rec["recipients"],
                rec.get("file_key"),
                job_id
            ],
            id=job_id,
            replace_existing=True
        )
    yield
    # aqui poderia vir código de shutdown, se necessário

# ─── FASTAPI & CORS ──────────────────────────────────────────────────────────
# defina aqui as origens que seu front usa:
origins = [
    "https://mage-token.vercel.app",
    "http://localhost:3000",
]

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── ENDPOINTS ────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "Servidor ativo com Telethon ✅"}

@app.post("/start-login")
async def start_login(data: PhoneNumber):
    client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
    await client.connect()
    result = await client.send_code_request(data.phone)
    await client.disconnect()
    return {
        "status": "Código enviado com sucesso",
        "phone_code_hash": result.phone_code_hash
    }

@app.post("/verify-code")
async def verify_code(data: VerifyCode):
    client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
    await client.connect()
    await client.sign_in(
        phone=data.phone,
        code=data.code,
        phone_code_hash=data.phone_code_hash
    )
    await client.disconnect()
    return {"status": "Login concluído e sessão salva com sucesso ✅"}

@app.post("/check-session")
async def check_session(data: PhoneNumber):
    client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
    await client.connect()
    authorized = await client.is_user_authorized()
    await client.disconnect()
    return {"authorized": authorized}

@app.post("/list-contacts")
async def list_contacts(data: PhoneNumber):
    client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
    await client.connect()
    result = await client(GetContactsRequest(hash=0))
    await client.disconnect()
    return {"contacts": [
        {
            "id": user.id,
            "username": user.username,
            "phone": user.phone,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
        for user in result.users if isinstance(user, User)
    ]}

@app.post("/list-dialogs")
async def list_dialogs(data: PhoneNumber):
    client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
    await client.connect()
    dialogs = await client.get_dialogs()
    await client.disconnect()
    resultado = []
    for dlg in dialogs:
        ent = dlg.entity
        if isinstance(ent, (Chat, Channel)):
            if getattr(ent, "broadcast", False):
                tipo = "channel"
            elif getattr(ent, "megagroup", False):
                tipo = "supergroup"
            else:
                tipo = "group"
            resultado.append({
                "chat": {
                    "id": ent.id,
                    "title": getattr(ent, "title", None),
                    "type": tipo
                }
            })
    return {"dialogs": resultado}

@app.post("/send-broadcast")
async def send_broadcast(
    phone: str = Form(...),
    message: str = Form(...),
    recipients: str = Form(...),
    file: UploadFile = File(None)
):
    file_key = None
    if file:
        raw = await file.read()
        file_key = f"immediate/{uuid4().hex}_{file.filename}"
        supabase.storage.from_(BUCKET).upload(file_key, raw)

    await perform_broadcast(phone, message, recipients, file_key, job_id=None)
    return {"status": f"Broadcast enviado para {recipients} ✅"}

@app.post("/schedule-broadcast")
async def schedule_broadcast(
    phone: str = Form(...),
    message: str = Form(...),
    recipients: str = Form(...),
    send_at: datetime = Form(...),
    file: UploadFile = File(None)
):
    if send_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="send_at deve ser no futuro")

    file_key = None
    if file:
        raw = await file.read()
        file_key = f"scheduled/{uuid4().hex}_{file.filename}"
        supabase.storage.from_(BUCKET).upload(file_key, raw)

    job_id = uuid4().hex
    firestore_db.collection("scheduled_broadcasts").document(job_id).set({
        "phone":      phone,
        "message":    message,
        "recipients": recipients,
        "file_key":   file_key,
        "send_at":    send_at,
        "status":     "pending",
        "created_at": datetime.utcnow()
    })

    trigger = DateTrigger(run_date=send_at)
    scheduler.add_job(
        perform_broadcast,
        trigger=trigger,
        args=[phone, message, recipients, file_key, job_id],
        id=job_id,
        replace_existing=True
    )

    return {
        "status":   "Broadcast agendado",
        "job_id":   job_id,
        "send_at":  send_at.isoformat(),
        "file_key": file_key
    }
