// backend/routes/telegram.js
import express from "express";
import connectTelegram from "../api/telegram/connectUserTelegram.js";
import sendTelegram from "../api/telegram/sendUserTelegram.js";

const router = express.Router();

router.post("/connect-telegram", connectTelegram);
router.post("/send-telegram", sendTelegram);

export default router;
