import { broadcastMessage } from "../services/telegramService.js";

export const sendBroadcast = async (req, res) => {
  const { message, chatIds } = req.body;

  if (!message || !Array.isArray(chatIds)) {
    return res.status(400).json({ error: "Mensagem e lista de chatIds são obrigatórios." });
  }

  try {
    const result = await broadcastMessage(message, chatIds);
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("Erro ao enviar broadcast:", error);
    res.status(500).json({ error: "Erro interno ao enviar mensagens." });
  }
};
