import TelegramBot from "node-telegram-bot-api";
import { askBackend } from "../service/backendService";
import { sendMessage } from "../service/telegramService";
import { ASK_MESSAGES } from "../constants/telegramMessages";

export function registerAskCommand(bot: TelegramBot) {
  bot.onText(/\/ask(?:\s+(.+))?/, async (msg, match) => {
    const question = match?.[1]?.trim();
    const chatId = msg.chat.id;
    if (!question) {
      await sendMessage(bot, chatId, ASK_MESSAGES.EMPTY_REQUEST);

      return;
    }

    try {
      await sendMessage(bot, chatId, ASK_MESSAGES.PROCESSING);

      const answer = await askBackend(question);

      await sendMessage(bot, chatId, answer);
    } catch (error) {
      console.error("[askCommand] Command failed:", error);

      await sendMessage(bot, chatId, ASK_MESSAGES.ERROR);
    }
  });
}
