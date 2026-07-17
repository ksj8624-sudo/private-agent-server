import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_MESSAGE_LIMIT = 4000;

const splitMessage = (text: string): string[] => {
  const messages: string[] = [];
  let remaining = text;

  while (remaining.length > TELEGRAM_MESSAGE_LIMIT) {
    let splitIndex = remaining.lastIndexOf("\n", TELEGRAM_MESSAGE_LIMIT);

    if (splitIndex <= 0) {
      splitIndex = TELEGRAM_MESSAGE_LIMIT;
    }

    messages.push(remaining.slice(0, splitIndex));
    remaining = remaining.slice(splitIndex).trimStart();
  }

  if (remaining.length > 0) {
    messages.push(remaining);
  }

  return messages;
};

export const sendMessage = async (
  bot: TelegramBot,
  chatId: number,
  text: string,
): Promise<void> => {
  const messages = splitMessage(text);

  for (const message of messages) {
    await bot.sendMessage(chatId, message);
  }
};
