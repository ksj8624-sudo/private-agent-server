import TelegramBot from "node-telegram-bot-api";
import { sendMessage } from "../service/telegramService";

export function registerStartCommand(bot: TelegramBot) {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await sendMessage(bot, chatId, "PrivateAgent started.");
  });
}
