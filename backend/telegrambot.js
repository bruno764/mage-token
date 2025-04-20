// backend/telegrambot.js
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(`👋 Olá ${ctx.from.first_name || "usuário"}! Bem-vindo ao bot do Mage Token.`);
});

bot.command("ping", (ctx) => {
  ctx.reply("🏓 Pong! Bot ativo.");
});

bot.on("text", (ctx) => {
  ctx.reply("🧙‍♂️ Use /start para começar ou /ping para testar.");
});

export const startTelegramBot = () => {
  try {
    bot.launch();
    console.log("🤖 Bot do Telegram iniciado com sucesso!");
  } catch (err) {
    console.error("Erro ao iniciar o bot do Telegram:", err);
  }
};

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
