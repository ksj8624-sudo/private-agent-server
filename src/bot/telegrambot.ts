import TelegramBot from "node-telegram-bot-api";

export function createTelegramBot(token: string) {
  return new TelegramBot(token, { polling: true });
}