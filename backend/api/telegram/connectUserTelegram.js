// backend/api/telegram/connectUserTelegram.js
import express from "express";
import { StringSession } from "telegram/sessions";
import { TelegramClient } from "telegram";
import input from "input";
import fs from "fs";
import path from "path";

const router = express.Router();

router.post("/", async (req, res) => {
  const { uid, phone } = req.body;
  if (!uid || !phone) {
    return res.status(400).json({ error: "UID e telefone são obrigatórios." });
  }

  try {
    const apiId = parseInt(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH;
    const sessionPath = path.resolve("sessions", `${uid}.session`);

    const stringSession = new StringSession(""); // vazio para nova sessão
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.start({
      phoneNumber: async () => phone,
      password: async () => await input.text("Password?"),
      phoneCode: async () => await input.text("Código que recebeu no Telegram?"),
      onError: (err) => console.error(err),
    });

    const savedSession = client.session.save();
    fs.writeFileSync(sessionPath, savedSession);

    await client.disconnect();

    return res.json({ success: true, message: "Conectado com sucesso!" });
  } catch (error) {
    console.error("Erro na conexão do Telegram:", error);
    return res.status(500).json({ error: "Erro ao conectar no Telegram." });
  }
});

export default router;
