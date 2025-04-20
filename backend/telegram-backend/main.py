from fastapi import FastAPI
from pydantic import BaseModel
from telethon.sync import TelegramClient
import os
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

API_ID = int(os.getenv("API_ID"))
API_HASH = os.getenv("API_HASH")

print("API_ID:", API_ID)
print("API_HASH:", API_HASH)

# FastAPI app
app = FastAPI()

# Diretório das sessões
SESSION_DIR = "sessions"

# Modelos para entrada
class PhoneNumber(BaseModel):
    phone: str

class VerifyCode(BaseModel):
    phone: str
    code: str

class SendMessage(BaseModel):
    phone: str         # telefone do usuário remetente
    recipient: str     # @username ou número de telefone do destinatário
    message: str       # texto da mensagem

@app.get("/")
def root():
    return {"status": "Servidor Python com Telethon funcionando ✅"}

@app.post("/start-login")
async def start_login(data: PhoneNumber):
    try:
        client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
        await client.connect()
        await client.send_code_request(data.phone)
        await client.disconnect()
        return {"status": "Código enviado com sucesso"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/verify-code")
async def verify_code(data: VerifyCode):
    try:
        client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
        await client.connect()
        await client.sign_in(phone=data.phone, code=data.code)
        await client.disconnect()
        return {"status": "Login concluído e sessão salva com sucesso ✅"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/send")
async def send_message(data: SendMessage):
    try:
        client = TelegramClient(f"{SESSION_DIR}/{data.phone}", API_ID, API_HASH)
        await client.connect()
        await client.send_message(data.recipient, data.message)
        await client.disconnect()
        return {"status": f"Mensagem enviada para {data.recipient} ✅"}
    except Exception as e:
        return {"error": str(e)}
