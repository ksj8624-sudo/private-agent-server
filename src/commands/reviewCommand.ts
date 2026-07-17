import TelegramBot from "node-telegram-bot-api";
import { reviewBackend } from "../service/backendService";
import { sendMessage } from "../service/telegramService";
import { REVIEW_MESSAGES } from "../constants/telegramMessages";

export function registerReviewCommand(bot: TelegramBot) {
  bot.onText(/\/review(?:\s+(.+))?/, async (msg, match) => {
    const reviewCode = match?.[1]?.trim();
    const chatId = msg.chat.id;

    if (!reviewCode) {
      await sendMessage(bot, chatId, REVIEW_MESSAGES.EMPTY_REQUEST);
      return;
    }

    try {
      await sendMessage(
        bot,
        chatId,
        `${REVIEW_MESSAGES.PROCESSING}: ${reviewCode}`,
      );
      const answer = await reviewBackend(reviewCode);

      await sendMessage(bot, chatId, answer);
    } catch (error) {
      console.error("[reviewCommand] Command failed:", error);

      await sendMessage(bot, chatId, REVIEW_MESSAGES.ERROR);
    }
  });
}
