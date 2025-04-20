import axios from "axios";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export const broadcastMessage = async (message, chatIds) => {
  const results = [];

  for (const chatId of chatIds) {
    try {
      const res = await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      });
      results.push({ chatId, status: "enviado", message_id: res.data.result.message_id });
    } catch (error) {
      results.push({ chatId, status: "falhou", error: error.response?.data || error.message });
    }
  }

  return results;
};
