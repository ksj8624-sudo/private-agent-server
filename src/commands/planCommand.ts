import TelegramBot from "node-telegram-bot-api";
import { generatePlanBackend } from "../service/backendService";
import { sendMessage } from "../service/telegramService";
import { PLAN_MESSAGES } from "../constants/telegramMessages";

export function registerPlanCommand(bot: TelegramBot) {
  bot.onText(/\/plan(?:\s+(.+))?/, async (msg, match) => {
    const topic = match?.[1]?.trim();
    const chatId = msg.chat.id;

    console.log("[PLAN]", topic);
    if (!topic) {
      await sendMessage(bot, chatId, PLAN_MESSAGES.EMPTY_REQUEST);
      return;
    }

    try {
      await sendMessage(bot, chatId, `${PLAN_MESSAGES.PROCESSING}: ${topic}`);
      const answer = await generatePlanBackend(topic);

      await sendMessage(bot, chatId, answer);
    } catch (error) {
      console.error("[planCommand] Command failed:", error);

      await sendMessage(bot, chatId, PLAN_MESSAGES.ERROR);
    }
  });
}
