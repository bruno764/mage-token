// backend/api/telegram.js
import express from "express";
import { statusHandler } from "../controllers/telegramController.js";

const router = express.Router();

router.get("/status/:uid", statusHandler);

export default router;
