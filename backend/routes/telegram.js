// backend/routes/telegram.routes.js
import express from "express";
import { db } from "../firebase/firebase.js";

const router = express.Router();

router.post("/update-token", async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ error: "Token ausente." });

  try {
    await db.collection("settings").doc("telegram").set({ token });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao salvar token." });
  }
});

router.get("/get-token", async (req, res) => {
  try {
    const docSnap = await db.collection("settings").doc("telegram").get();
    if (!docSnap.exists) return res.status(404).json({ error: "Token não encontrado" });

    return res.json({ token: docSnap.data().token });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar token." });
  }
});

export default router;
