import dotenv from "dotenv";

dotenv.config();

import { createTelegramBot } from "./bot/telegrambot";
import { registerAskCommand } from "./commands/askCommand";
import { registerHelpCommand } from "./commands/helpCommand";
import { registerPingCommand } from "./commands/pingCommand";
import { registerStartCommand } from "./commands/startCommand";
import { registerStatusCommand } from "./commands/statusCommand";
import { registerPlanCommand } from "./commands/planCommand";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is missing");
}
console.log(process.env.BACKEND_API_URL);
const bot = createTelegramBot(token);

bot.on("message", (msg) => {
  console.log("[message]", {
    chatId: msg.chat.id,
    userId: msg.from?.id,
    firstName: msg.from?.first_name,
    lastName: msg.from?.last_name,
    text: msg.text,
  });
});

registerStartCommand(bot);
registerHelpCommand(bot);
registerPingCommand(bot);
registerStatusCommand(bot);
registerAskCommand(bot);
registerPlanCommand(bot);

console.log("PrivateAgent is running...");
