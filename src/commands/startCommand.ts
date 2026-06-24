import TelegramBot from "node-telegram-bot-api";

export function registerStartCommand(bot: TelegramBot) {
  bot.onText(/\/start/, async (msg) => {
    await bot.sendMessage(msg.chat.id, "PrivateAgent started.");
  });
}