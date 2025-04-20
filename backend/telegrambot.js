// backend/telegrambot.js
import { Telegraf } from "telegraf";
import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";

const bot = new Telegraf(process.env.BOT_TOKEN);
const db = admin.firestore();

// /start
bot.start(async (ctx) => {
  const uid = ctx.from.id.toString();
  const ref = db.collection("users").doc(uid);

  const doc = await ref.get();
  if (!doc.exists) {
    await ref.set({
      username: ctx.from.username || null,
      telegramId: uid,
      isPremium: false,
      createdAt: new Date().toISOString(),
    });
    await ctx.reply("👋 Welcome! Your account has been created.");
  } else {
    await ctx.reply("👋 You're already registered!");
  }
});

// /status
bot.command("status", async (ctx) => {
  const uid = ctx.from.id.toString();
  const doc = await db.collection("users").doc(uid).get();

  if (doc.exists) {
    const user = doc.data();
    await ctx.reply(`📊 Status:
- Username: @${ctx.from.username || "unknown"}
- Premium: ${user.isPremium ? "✅ Yes" : "❌ No"}
- Since: ${new Date(user.createdAt).toLocaleDateString()}`);
  } else {
    await ctx.reply("❌ You are not registered. Use /start to begin.");
  }
});

// /link
bot.command("link", (ctx) => {
  const refCode = ctx.from.id;
  ctx.reply(`🔗 Your referral link: https://mage-token.vercel.app?ref=${refCode}`);
});

// /help
bot.help((ctx) => {
  ctx.reply(`🤖 Available Commands:
/start - Register or login
/status - View your account status
/link - Get your referral link
/help - Show this menu`);
});

bot.launch();
console.log("🤖 Mage Token Bot is running");
