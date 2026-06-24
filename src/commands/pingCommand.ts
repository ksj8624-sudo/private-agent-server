import TelegramBot from "node-telegram-bot-api";

export function registerPingCommand(bot: TelegramBot) {
  bot.onText(/\/ping/, async (msg) => {
    await bot.sendMessage(msg.chat.id, "pong");
  });
}