// backend/api/telegram/connect-telegram.js
import admin from "firebase-admin";

const db = admin.firestore();

const connectTelegram = async (req, res) => {
  try {
    const { uid, telegramToken } = req.body;

    if (!uid || !telegramToken) {
      return res.status(400).json({ error: "UID ou token do Telegram ausente." });
    }

    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      telegramConnected: true,
      telegramToken,
      telegramConnectedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: "Telegram conectado com sucesso." });
  } catch (err) {
    console.error("Erro ao conectar Telegram:", err);
    res.status(500).json({ error: "Erro interno ao conectar Telegram." });
  }
};

export default connectTelegram;
