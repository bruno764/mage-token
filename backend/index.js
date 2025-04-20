import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import telegramRoutes from "./routes/telegram.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/telegram", telegramRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Backend Mage Token rodando na porta ${PORT}`);
});
