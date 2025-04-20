// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import "./telegrambot.js"; // ← inicia o bot automaticamente

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin Init
const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}
const db = admin.firestore();

// 🔹 Teste de rota
app.get("/", (req, res) => {
  res.send("🔥 Backend Mage Token funcionando!");
});

// 🔹 Exemplo de rota protegida
app.get("/api/user/:uid", async (req, res) => {
  const { uid } = req.params;
  try {
    const userRef = db.collection("users").doc(uid);
    const docSnap = await userRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(docSnap.data());
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// 🔹 Inicia servidor + log
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
