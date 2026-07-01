import TelegramBot from "node-telegram-bot-api";
import { askBackend } from "../service/backendService";

export function registerAskCommand(bot: TelegramBot) {
  bot.onText(/\/ask (.+)/, async (msg, match) => {
    const question = match?.[1]?.trim();

    if (!question) {
      await bot.sendMessage(
        msg.chat.id,
        "질문을 입력해줘.\n예: /ask React Router란?",
      );
      return;
    }

    try {
      await bot.sendMessage(msg.chat.id, "답변을 생성 중이야...");

      const answer = await askBackend(question);

      await bot.sendMessage(msg.chat.id, answer);
    } catch (error) {
      console.error("[askCommand] Backend request failed:", error);

      await bot.sendMessage(
        msg.chat.id,
        "답변 생성 중 오류가 발생했어. 잠시 후 다시 시도해줘.",
      );
    }
  });
}
