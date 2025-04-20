// backend/api/telegram/send-telegram.js
import admin from "firebase-admin";
import { Telegraf } from "telegraf";
import fs from "fs";
import path from "path";

const db = admin.firestore();

const sendTelegram = async (req, res) => {
  const { uid, message, type } = req.body;
  const file = req.file;

  try {
    if (!uid || !message || !type) {
      return res.status(400).json({ error: "Dados incompletos." });
    }

    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data();

    if (!userData?.telegramToken) {
      return res.status(403).json({ error: "Usuário não conectou o Telegram." });
    }

    const userBot = new Telegraf(userData.telegramToken);

    if (file) {
      const filePath = path.resolve(file.path);
      await userBot.telegram.sendDocument(userData.telegramId, { source: fs.createReadStream(filePath) }, { caption: message });
      fs.unlinkSync(filePath); // Remove após envio
    } else {
      await userBot.telegram.sendMessage(userData.telegramId, message);
    }

    res.json({ success: true, status: "Mensagem enviada" });
  } catch (err) {
    console.error("Erro ao enviar:", err);
    res.status(500).json({ error: "Erro ao enviar mensagem pelo Telegram." });
  }
};

export default sendTelegram;
