from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telethon.sync import TelegramClient
from telethon.tl.functions.contacts import GetContactsRequest
import os
import shutil
from dotenv import load_dotenv

load_dotenv()

API_ID = int(os.getenv("API_ID"))
API_HASH = os.getenv("API_HASH")

app = FastAPI()

# 🔐 Libera acesso do frontend (Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mage-token.vercel.app"],  # Domínio Vercel liberado
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_DIR = "sessions"
TEMP_DIR = "temp"
os.makedirs(SESSION_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

class PhoneNumber(BaseModel):
    phone: str

class VerifyCode(BaseModel):
    phone: str
    code: str

@app.get("/")
def root():
    return {"status": "Servidor ativo com Telethon ✅"}

@app.post("/start-login")
async def start_login(data: PhoneNumber):
    try:
        print(f"📲 Enviando código para: {data.phone}")
        client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
        await client.connect()
        await client.send_code_request(data.phone)
        await client.disconnect()
        print("✅ Código enviado.")
        return {"status": "Código enviado com sucesso"}
    except Exception as e:
        print(f"❌ Erro ao enviar código: {str(e)}")
        return {"error": str(e)}

@app.post("/verify-code")
async def verify_code(data: VerifyCode):
    try:
        print(f"🔐 Verificando código para {data.phone}")
        client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
        await client.connect()
        await client.sign_in(phone=data.phone, code=data.code)
        await client.disconnect()
        print("✅ Sessão salva com sucesso.")
        return {"status": "Login concluído e sessão salva com sucesso ✅"}
    except Exception as e:
        print(f"❌ Erro ao verificar código: {str(e)}")
        return {"error": str(e)}

@app.post("/check-session")
async def check_session(data: PhoneNumber):
    try:
        print(f"🔍 Checando sessão de {data.phone}")
        client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
        await client.connect()
        authorized = await client.is_user_authorized()
        await client.disconnect()
        return {"authorized": authorized}
    except Exception as e:
        print(f"❌ Erro ao checar sessão: {str(e)}")
        return {"error": str(e)}

@app.post("/list-contacts")
async def list_contacts(data: PhoneNumber):
    try:
        print(f"📇 Buscando contatos de {data.phone}")
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
            for user in result.users
        ]
        await client.disconnect()
        return {"contacts": contacts}
    except Exception as e:
        print(f"❌ Erro ao listar contatos: {str(e)}")
        return {"error": str(e)}

@app.post("/send")
async def send_message(
    phone: str = Form(...),
    recipient: str = Form(...),
    message: str = Form(...),
    file: UploadFile = File(None)
):
    try:
        client = TelegramClient(f"{SESSION_DIR}/{phone}", API_ID, API_HASH)
        await client.connect()

        if file:
            file_path = f"{TEMP_DIR}/{file.filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            await client.send_file(recipient, file_path, caption=message)
            os.remove(file_path)
        else:
            await client.send_message(recipient, message)

        await client.disconnect()
        return {"status": f"Mensagem enviada para {recipient} ✅"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/send-broadcast")
async def send_broadcast(
    phone: str = Form(...),
    message: str = Form(...),
    recipients: str = Form(...),
    file: UploadFile = File(None)
):
    try:
        print(f"📢 Enviando broadcast para múltiplos contatos")
        client = TelegramClient(f"{SESSION_DIR}/{phone}", API_ID, API_HASH)
        await client.connect()

        recipients_list = [r.strip() for r in recipients.split(",")]
        file_path = None

        if file:
            file_path = f"{TEMP_DIR}/{file.filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

        for recipient in recipients_list:
            try:
                if file_path:
                    await client.send_file(recipient, file_path, caption=message)
                else:
                    await client.send_message(recipient, message)
                print(f"✅ Mensagem enviada para {recipient}")
            except Exception as err:
                print(f"❌ Erro para {recipient}: {err}")

        if file_path:
            os.remove(file_path)

        await client.disconnect()
        return {"status": f"Broadcast enviado para {len(recipients_list)} contatos ✅"}
    except Exception as e:
        return {"error": str(e)}
