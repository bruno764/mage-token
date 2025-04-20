// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import multer from "multer";
import { Telegraf } from "telegraf";
import fs from "fs";
import path from "path";
import telegramRoutes from "./routes/telegram.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Inicializa Firebase
const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(credentials) });
}
const db = admin.firestore();

// Inicializa bot global
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.launch();
console.log("🤖 Bot do Telegram iniciado com sucesso!");

// Teste
app.get("/", (_, res) => {
  res.send("🔥 Backend Mage Token funcionando!");
});

// Rota de envio rápido via bot direto
app.post("/api/send-telegram-direct", upload.single("file"), async (req, res) => {
  const { message, userId } = req.body;
  const file = req.file;

  try {
    if (!userId) return res.status(400).json({ error: "User ID ausente" });

    if (file) {
      const filePath = path.resolve(file.path);
      await bot.telegram.sendDocument(userId, { source: fs.createReadStream(filePath) }, { caption: message });
      fs.unlinkSync(filePath);
    } else {
      await bot.telegram.sendMessage(userId, message);
    }

    res.json({ success: true, status: "Enviado com sucesso" });
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    res.status(500).json({ error: "Falha ao enviar mensagem" });
  }
});

// Usa rotas do Telegram
app.use("/api", telegramRoutes);

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
