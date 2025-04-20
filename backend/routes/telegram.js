import express from "express";
import { getTelegramData } from "../controllers/telegramController.js";

const router = express.Router();

router.get("/:uid", getTelegramData);

export default router;
