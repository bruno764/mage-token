# main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telethon.sync import TelegramClient
from telethon.tl.functions.contacts import GetContactsRequest
from telethon.tl.types import User, Chat, Channel
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from supabase import create_client
from uuid import uuid4
import os
import shutil
from dotenv import load_dotenv

load_dotenv()

API_ID        = int(os.getenv("API_ID"))
API_HASH      = os.getenv("API_HASH")
SUPABASE_URL  = os.getenv("SUPABASE_URL")   # ex: https://xyzcompany.supabase.co
SUPABASE_KEY  = os.getenv("SUPABASE_KEY")   # your anon/public or service_role key
BUCKET        = os.getenv("SUPABASE_BUCKET")  # nome do bucket (ex: "broadcast-files")

# inicializa Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

# 🔐 CORS para frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mage-token-production.up.railway.app",
        "https://mage-token.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# scheduler
scheduler = AsyncIOScheduler()
scheduler.start()

SESSION_DIR = "sessions"
TEMP_DIR    = "temp"
os.makedirs(SESSION_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

class PhoneNumber(BaseModel):
    phone: str

class VerifyCode(BaseModel):
    phone: str
    code: str
    phone_code_hash: str

class ScheduleBroadcast(BaseModel):
    phone: str
    message: str
    recipients: str
    send_at: datetime

@app.get("/")
def root():
    return {"status": "Servidor ativo com Telethon ✅"}

@app.post("/start-login")
async def start_login(data: PhoneNumber):
    try:
        client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
        await client.connect()
        result = await client.send_code_request(data.phone)
        await client.disconnect()
        return {
            "status": "Código enviado com sucesso",
            "phone_code_hash": result.phone_code_hash
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/verify-code")
async def verify_code(data: VerifyCode):
    try:
        client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
        await client.connect()
        await client.sign_in(
            phone=data.phone,
            code=data.code,
            phone_code_hash=data.phone_code_hash
        )
        await client.disconnect()
        return {"status": "Login concluído e sessão salva com sucesso ✅"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/check-session")
async def check_session(data: PhoneNumber):
    try:
        client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
        await client.connect()
        authorized = await client.is_user_authorized()
        await client.disconnect()
        return {"authorized": authorized}
    except Exception as e:
        return {"error": str(e)}

@app.post("/list-contacts")
async def list_contacts(data: PhoneNumber):
    try:
        client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
        await client.connect()
        result = await client(GetContactsRequest(hash=0))
        contacts = [
            {
                "id": user.id,
                "username": user.username,
                "phone": user.phone,
                "first_name": user.first_name,
                "last_name": user.last_name
            }
            for user in result.users if isinstance(user, User)
        ]
        await client.disconnect()
        return {"contacts": contacts}
    except Exception as e:
        return {"error": str(e)}

@app.post("/list-dialogs")
async def list_dialogs(data: PhoneNumber):
    try:
        client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
        await client.connect()
        dialogs = await client.get_dialogs()
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
        await client.disconnect()
        return {"dialogs": resultado}
    except Exception as e:
        return {"error": str(e)}

# helper para broadcast imediato ou agendado
async def perform_broadcast(
    phone: str,
    message: str,
    recipients: str,
    file_key: str = None
):
    local_file = None
    if file_key:
        # baixa arquivo do Supabase Storage para temp
        data = supabase.storage.from_(BUCKET).download(file_key)
        local_file = os.path.join(TEMP_DIR, os.path.basename(file_key))
        with open(local_file, "wb") as f:
            f.write(data)

    client = TelegramClient(f"{SESSION_DIR}/{phone}", API_ID, API_HASH)
    await client.connect()
    recs = [r.strip() for r in recipients.split(",")]
    for r in recs:
        try:
            try:
                target = int(r)
            except ValueError:
                target = r
            entity = await client.get_entity(target)
            if local_file:
                await client.send_file(entity, local_file, caption=message)
            else:
                await client.send_message(entity, message)
        except Exception as err:
            print(f"❌ Erro ao enviar para {r}: {err}")
    await client.disconnect()

    if local_file and os.path.exists(local_file):
        os.remove(local_file)

@app.post("/send")
async def send_message(
    phone: str = Form(...),
    recipient: str = Form(...),
    message: str = Form(...),
    file: UploadFile = File(None)
):
    file_key = None
    if file:
        data = await file.read()
        file_key = f"immediate/{uuid4().hex}_{file.filename}"
        supabase.storage.from_(BUCKET).upload(file_key, data)

    # para envio único, treatamos 'recipient' como lista de um
    await perform_broadcast(phone, message, recipient, file_key)
    return {"status": f"Mensagem enviada para {recipient} ✅"}

@app.post("/send-broadcast")
async def send_broadcast(
    phone: str = Form(...),
    message: str = Form(...),
    recipients: str = Form(...),
    file: UploadFile = File(None)
):
    file_key = None
    if file:
        data = await file.read()
        file_key = f"immediate/{uuid4().hex}_{file.filename}"
        supabase.storage.from_(BUCKET).upload(file_key, data)

    await perform_broadcast(phone, message, recipients, file_key)
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
        data = await file.read()
        file_key = f"scheduled/{uuid4().hex}_{file.filename}"
        supabase.storage.from_(BUCKET).upload(file_key, data)

    trigger = DateTrigger(run_date=send_at)
    job_id = f"broadcast_{phone}_{send_at.isoformat()}"
    scheduler.add_job(
        perform_broadcast,
        trigger=trigger,
        args=[phone, message, recipients, file_key],
        id=job_id,
        replace_existing=True
    )

    return {
        "status":  "Broadcast agendado",
        "job_id":  job_id,
        "send_at": send_at.isoformat(),
        "file_key": file_key
    }
