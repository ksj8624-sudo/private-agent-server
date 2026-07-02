import TelegramBot from "node-telegram-bot-api";
import { generatePlanBackend } from "../service/backendService";

export function registerPlanCommand(bot: TelegramBot) {
  bot.onText(/\/plan (.+)/, async (msg, match) => {
    const topic = match?.[1]?.trim();

    console.log("[PLAN]", topic);
    if (!topic) {
      await bot.sendMessage(
        msg.chat.id,
        "계획을 입력해줘.\n예: /plan 오늘 할 일",
      );
      return;
    }

    try {
      await bot.sendMessage(msg.chat.id, `계획을 등록했어: ${topic}`);
      const answer = await generatePlanBackend(topic);

      await bot.sendMessage(msg.chat.id, answer);
    } catch (error) {
      console.error("[planCommand] Error:", error);

      await bot.sendMessage(
        msg.chat.id,
        "계획 등록 중 오류가 발생했어. 잠시 후 다시 시도해줘.",
      );
    }
  });
}
