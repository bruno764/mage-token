// backend/controllers/telegramController.js
import { getTelegramStatus } from "../services/telegramService.js";

export const statusHandler = async (req, res) => {
  const { uid } = req.params;
  try {
    const status = await getTelegramStatus(uid);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Erro ao obter status do Telegram" });
  }
};
