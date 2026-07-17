import TelegramBot from "node-telegram-bot-api";
import { sendMessage } from "../service/telegramService";

export function registerStatusCommand(bot: TelegramBot) {
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    await sendMessage(
      bot,
      chatId,
      [
        "PrivateAgent Status",
        "",
        "Version: 0.1.0",
        "Environment: Local",
        "Status: Running",
      ].join("\n"),
    );
  });
}
