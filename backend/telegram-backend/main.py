# main.py

import os
import json
import shutil
import base64
from uuid import uuid4
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from fastapi.responses import JSONResponse
from apscheduler.triggers.cron import CronTrigger
from fastapi import Body


from telethon.sync import TelegramClient
from telethon.errors.rpcerrorlist import FloodWaitError
from telethon.tl.functions.contacts import GetContactsRequest
from telethon.tl.types import User, Chat, Channel
from telethon.tl.functions.contacts import ImportContactsRequest
from telethon.tl.types import InputPhoneContact
import traceback


from supabase import create_client
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth

from dotenv import load_dotenv
from fastapi import Query, Request, Depends

# ─── CARREGA VARIÁVEIS DE AMBIENTE ────────────────────────────────────────────
load_dotenv()

# ─── INICIALIZAÇÃO DO FIREBASE (path ou JSON na ENV) ──────────────────────────
raw_cred = os.getenv("FIREBASE_CRED")
if not raw_cred:
    raise RuntimeError("A variável de ambiente FIREBASE_CRED não está definida.")

try:
    cred_dict = json.loads(raw_cred)
    cred = credentials.Certificate(cred_dict)
except json.JSONDecodeError:
    cred = credentials.Certificate(raw_cred)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
firestore_db = firestore.client()

def restore_session_if_needed(phone: str):
    session_file = f"{SESSION_DIR}/{phone}.session"
    if not os.path.exists(session_file):
        doc = firestore_db.collection("telegram_sessions").document(phone).get()
        if doc.exists:
            data = doc.to_dict()
            with open(session_file, "wb") as f:
                f.write(base64.b64decode(data["session_data"]))

# ─── CONFIGURAÇÃO DO TELEGRAM ─────────────────────────────────────────────────
API_ID      = int(os.getenv("API_ID"))
API_HASH    = os.getenv("API_HASH")
SESSION_DIR = "sessions"
os.makedirs(SESSION_DIR, exist_ok=True)

# ─── ARMAZENAMENTO TEMPORÁRIO ─────────────────────────────────────────────────
TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# ─── CONFIGURAÇÃO DO SUPABASE ─────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET       = os.getenv("SUPABASE_BUCKET")
supabase     = create_client(SUPABASE_URL, SUPABASE_KEY)

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

# ✅ FORA DA CLASSE:
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente")
    token = auth_header.split("Bearer ")[1]
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

def check_phone_permission(phone: str, current_uid: str):
    doc = firestore_db.collection("phone_ownership").document(phone).get()
    if doc.exists:
        owner_uid = doc.to_dict().get("uid")
        if owner_uid != current_uid:
            raise HTTPException(status_code=403, detail="Você não tem permissão para usar esse número.")


# ─── FUNÇÃO AUXILIAR DE BROADCAST  ─────────────────────────────────────────────
async def perform_broadcast(
    phone: str,
    message: str,
    recipients: str,
    file_key: str = None,
    job_id: str = None
):
    restore_session_if_needed(phone)

    local_file = None
    if file_key:
        data = supabase.storage.from_(BUCKET).download(file_key)
        local_file = os.path.join(TEMP_DIR, os.path.basename(file_key))
        with open(local_file, "wb") as f:
            f.write(data)

    client = TelegramClient(f"{SESSION_DIR}/{phone}", API_ID, API_HASH)
    await client.connect()

    for r in [r.strip() for r in recipients.split(",") if r]:
        try:
            # 🟢 Grupos/canais: começam com "-" e são IDs inteiros
            if r.lstrip("-").isdigit():
                entity = await client.get_input_entity(int(r))

            # 🔵 Telefones (com ou sem +)
            elif r.replace("+", "").isdigit():
                formatted = r if r.startswith("+") else f"+{r}"
                contact = InputPhoneContact(
                    client_id=0,
                    phone=formatted,
                    first_name=" ",  # espaço em branco evita sobrescrever nome
                    last_name=""
                )
                await client(ImportContactsRequest([contact]))
                entity = await client.get_input_entity(formatted)

            # 🟣 Username direto (@exemplo)
            else:
                entity = await client.get_input_entity(r)

            # Envio da mensagem ou arquivo
            if local_file:
                await client.send_file(entity, local_file, caption=message)
            else:
                await client.send_message(entity, message)

        except Exception as err:
            print(f"❌ Erro ao enviar para {r}: {err}")
            if job_id:
                firestore_db.collection("scheduled_broadcasts").document(job_id).update({
                    f"errors.{r}": str(err)
                })

    await client.disconnect()

    if job_id:
        firestore_db.collection("scheduled_broadcasts").document(job_id).update({
            "status": "sent",
            "sent_at": datetime.utcnow()
        })

    if local_file and os.path.exists(local_file):
        os.remove(local_file)
        
# 🔁 Agendamentos recorrentes
try:
    recurring_jobs = firestore_db.collection("recurring_broadcasts").where("active", "==", True).stream()
    for doc in recurring_jobs:
        rec = doc.to_dict()
        job_id = f"recurring-{doc.id}"
        scheduler.add_job(
            perform_broadcast,
            trigger=CronTrigger.from_crontab(rec["cron"]),
            args=[
                rec["phone"],
                rec["message"],
                rec["recipients"],
                rec.get("file_key"),
                None  # job_id=None pois é recorrente
            ],
            id=job_id,
            replace_existing=True
        )
    print("✅ Recorrentes carregados")
except Exception as e:
    print(f"⚠️ Erro ao carregar recorrentes: {e}")



# ─── LIFESPAN PARA REAGENDAR JOBS PENDENTES ──────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    now = datetime.utcnow()
    try:
        docs = (
    firestore_db.collection("scheduled_broadcasts")
    .where(filter=firestore.FieldFilter("status", "==", "pending"))
    .where(filter=firestore.FieldFilter("send_at", ">", now))
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
        print("✅ Agendamentos carregados no startup")
    except Exception as e:
        print(f"⚠️ Não foi possível carregar agendamentos: {e}")
    yield
    # shutdown: se precisar de algo extra, coloque aqui

# ─── FASTAPI & CORS ──────────────────────────────────────────────────────────
origins = [
    "https://mage-token.vercel.app",
    "https://mage-token-production.up.railway.app",
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
async def start_login(data: PhoneNumber, request: Request):
    uid = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split("Bearer ")[1]
            decoded = firebase_auth.verify_id_token(token)
            uid = decoded["uid"]
        except:
            pass

    # Bloqueia se o número estiver vinculado a outro UID
    doc = firestore_db.collection("phone_ownership").document(data.phone).get()
    if doc.exists and uid and doc.to_dict().get("uid") != uid:
        raise HTTPException(status_code=403, detail="Este número está vinculado a outra conta.")

    restore_session_if_needed(data.phone)
    client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
    await client.connect()
    try:
        result = await client.send_code_request(data.phone)
    except FloodWaitError as e:
        await client.disconnect()
        raise HTTPException(
            status_code=429,
            detail=f"Aguarde {e.seconds} segundos antes de tentar novamente."
        )
    await client.disconnect()
    return {
        "status": "Código enviado com sucesso",
        "phone_code_hash": result.phone_code_hash
    }


@app.post("/verify-code")
async def verify_code(data: dict):
    phone = data.get("phone")
    code = data.get("code")
    phone_code_hash = data.get("phone_code_hash")
    uid = data.get("uid")

    if not uid:
        raise HTTPException(status_code=400, detail="UID do usuário não informado.")

    # 🚫 Verifica se o número já está vinculado a outro UID
    owner_doc = firestore_db.collection("phone_ownership").document(phone).get()
    if owner_doc.exists:
        if owner_doc.to_dict().get("uid") != uid:
            raise HTTPException(status_code=403, detail="Este número está vinculado a outra conta.")

    restore_session_if_needed(phone)
    session_path = f"{SESSION_DIR}/{phone}"
    client = TelegramClient(session_path, API_ID, API_HASH)
    await client.connect()

    await client.sign_in(
        phone=phone,
        code=code,
        phone_code_hash=phone_code_hash
    )

    # 🔐 Salva sessão no Firestore
    with open(session_path + ".session", "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")
        firestore_db.collection("telegram_sessions").document(phone).set({
            "session_data": encoded,
            "updated_at": datetime.utcnow()
        })

    # 📌 Salva o vínculo do número com o UID
    firestore_db.collection("phone_ownership").document(phone).set({
        "uid": uid,
        "linked_at": datetime.utcnow()
    })

    await client.disconnect()
    return {"status": "Login concluído e sessão salva com sucesso ✅"}



@app.post("/check-session")
async def check_session(data: PhoneNumber, request: Request):
    uid = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split("Bearer ")[1]
            decoded = firebase_auth.verify_id_token(token)
            uid = decoded["uid"]
        except:
            pass

    doc = firestore_db.collection("phone_ownership").document(data.phone).get()
    if doc.exists and uid and doc.to_dict().get("uid") != uid:
        raise HTTPException(status_code=403, detail="Este número está vinculado a outra conta.")

    restore_session_if_needed(data.phone)
    client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
    await client.connect()
    authorized = await client.is_user_authorized()
    await client.disconnect()
    return {"authorized": authorized}


@app.post("/unlink-phone")
async def unlink_phone(data: dict, current_uid: str = Depends(get_current_user)):
    phone = data.get("phone")

    doc = firestore_db.collection("phone_ownership").document(phone).get()
    if doc.exists and doc.to_dict().get("uid") == current_uid:
        # 🔒 Remove vínculo no Firestore
        firestore_db.collection("phone_ownership").document(phone).delete()

        # 🔥 Remove sessão local (arquivo .session e .session-journal)
        session_path = f"{SESSION_DIR}/{phone}.session"
        if os.path.exists(session_path):
            os.remove(session_path)
        if os.path.exists(session_path + "-journal"):
            os.remove(session_path + "-journal")

        return {"status": "Número desvinculado"}
    else:
        raise HTTPException(status_code=403, detail="Você não tem permissão para desvincular esse número.")


@app.post("/list-contacts")
async def list_contacts(data: PhoneNumber, current_uid: str = Depends(get_current_user)):
    check_phone_permission(data.phone, current_uid)

    restore_session_if_needed(data.phone)
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
async def list_dialogs(data: PhoneNumber, current_uid: str = Depends(get_current_user)):
    check_phone_permission(data.phone, current_uid)

    restore_session_if_needed(data.phone)
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
    file: UploadFile = File(None),
    current_uid: str = Depends(get_current_user)  # 🔐 adiciona proteção
):
    check_phone_permission(phone, current_uid)  # 🔒 só UID dono pode usar

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
    file: UploadFile = File(None),
    current_uid: str = Depends(get_current_user)
):
    check_phone_permission(phone, current_uid)

    if send_at <= datetime.now(timezone.utc):
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

@app.post("/schedule-recurring")
async def schedule_recurring(
    phone: str = Form(...),
    message: str = Form(...),
    recipients: str = Form(...),
    cron: str = Form(...),  # exemplo: "0 7 * * *"
    file: UploadFile = File(None),
    current_uid: str = Depends(get_current_user)
):
    check_phone_permission(phone, current_uid)

    file_key = None
    if file:
        raw = await file.read()
        file_key = f"recurring/{uuid4().hex}_{file.filename}"
        supabase.storage.from_(BUCKET).upload(file_key, raw)

    job_id = uuid4().hex
    firestore_db.collection("recurring_broadcasts").document(job_id).set({
        "uid":        current_uid,
        "phone":      phone,
        "message":    message,
        "recipients": recipients,
        "cron":       cron,
        "file_key":   file_key,
        "active":     True,
        "created_at": datetime.utcnow()
    })

    scheduler.add_job(
        perform_broadcast,
        trigger=CronTrigger.from_crontab(cron),
        args=[phone, message, recipients, file_key, job_id],
        id=job_id,
        replace_existing=True
    )

    return {
        "status": "Agendamento recorrente criado",
        "cron": cron,
        "job_id": job_id
    }

@app.get("/broadcast-history")
async def broadcast_history(phone: str, limit: int = Query(default=100, lte=100), current_uid: str = Depends(get_current_user)):
    check_phone_permission(phone, current_uid)

    try:
        docs_ref = (
            firestore_db.collection("scheduled_broadcasts")
            .where("phone", "==", phone)
            .limit(limit)
        )

        all_docs = docs_ref.stream()
        valid_docs = []

        for doc in all_docs:
            data = doc.to_dict()
            send_at = data.get("send_at")
            if isinstance(send_at, datetime) or hasattr(send_at, "timestamp"):
                valid_docs.append((send_at, data))

        valid_docs.sort(key=lambda x: x[0], reverse=True)

        return {"items": [data for _, data in valid_docs]}

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Erro ao buscar histórico: {str(e)}"},
        )


