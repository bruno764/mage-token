// backend/routes/telegram.js
import express from "express";
import { getTelegramData } from "../controllers/telegramController.js";
import sendTelegram from "../api/telegram/send-telegram.js";
import connectTelegram from "../api/telegram/connect-telegram.js";

const router = express.Router();

// Rota para consultar dados do usuário no Firestore
router.get("/telegram/:uid", getTelegramData);

// Enviar mensagem via backend organizado
router.post("/send-telegram", sendTelegram);

// Conectar o Telegram ao perfil do usuário (salva no Firestore)
router.post("/connect-telegram", connectTelegram);

export default router;
