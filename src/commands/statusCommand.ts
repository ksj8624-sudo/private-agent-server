import TelegramBot from "node-telegram-bot-api";

export function registerStatusCommand(bot: TelegramBot) {
  bot.onText(/\/status/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      [
        "PrivateAgent Status",
        "",
        "Version: 0.1.0",
        "Environment: Local",
        "Status: Running",
      ].join("\n")
    );
  });
}