import { db } from "../firebase/firebase.js";
import { logger } from "../utils/logger.js";

export const getTelegramStatus = async (uid) => {
  try {
    const ref = db.collection("telegramStatus").doc(uid);
    const doc = await ref.get();
    return doc.exists ? doc.data() : { active: false };
  } catch (err) {
    logger.error("Erro ao buscar status do Telegram:", err);
    throw err;
  }
};
