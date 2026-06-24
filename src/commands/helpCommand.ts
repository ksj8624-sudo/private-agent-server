import TelegramBot from "node-telegram-bot-api";

export function registerHelpCommand(bot: TelegramBot) {
  bot.onText(/\/help/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      [
        "PrivateAgent Commands",
        "",
        "/start - 봇 시작",
        "/help - 명령어 확인",
        "/ping - 연결 확인",
        "/status - 상태 확인",
        "/ask [질문] - AI 질문",
      ].join("\n")
    );
  });
}