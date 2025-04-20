import { getTelegramStatus } from "../services/telegramService.js";

export const getTelegramData = async (req, res) => {
  const { uid } = req.params;

  if (!uid) return res.status(400).json({ error: "UID é obrigatório" });

  try {
    const status = await getTelegramStatus(uid);
    res.json({ ok: true, status });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erro interno" });
  }
};
