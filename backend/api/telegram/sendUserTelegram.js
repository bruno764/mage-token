// backend/api/telegram/sendUserTelegram.js
import express from "express";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import fs from "fs";
import multer from "multer";
import path from "path";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  const { uid, message, type } = req.body;
  const file = req.file;

  try {
    if (!uid || !message || !type) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    const apiId = parseInt(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH;
    const sessionFile = path.resolve("sessions", `${uid}.session`);

    if (!fs.existsSync(sessionFile)) {
      return res.status(401).json({ error: "Usuário não conectado no Telegram." });
    }

    const sessionString = fs.readFileSync(sessionFile, "utf8");
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.connect();

    if (file) {
      const filePath = path.resolve(file.path);
      await client.sendFile("me", {
        file: filePath,
        caption: message,
      });
      fs.unlinkSync(filePath);
    } else {
      await client.sendMessage("me", { message });
    }

    await client.disconnect();

    return res.json({ success: true, status: "Mensagem enviada com sucesso!" });
  } catch (error) {
    console.error("Erro ao enviar:", error);
    return res.status(500).json({ error: "Erro interno ao enviar mensagem." });
  }
});

export default router;
