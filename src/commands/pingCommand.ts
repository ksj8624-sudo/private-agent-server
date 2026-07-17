import TelegramBot from "node-telegram-bot-api";
import { sendMessage } from "../service/telegramService";

export function registerPingCommand(bot: TelegramBot) {
  bot.onText(/\/ping/, async (msg) => {
    const chatId = msg.chat.id;
    await sendMessage(bot, chatId, "pong");
  });
}
