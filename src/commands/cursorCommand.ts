import TelegramBot from "node-telegram-bot-api";
import { requestCursor } from "../service/backendService";
import { sendMessage } from "../service/telegramService";
import { CURSOR_MESSAGES } from "../constants/telegramMessages";
import {
  CURSOR_TYPE_ALIASES,
  CURSOR_WORKSPACE_ALIASES,
  CURSOR_TYPES,
  CURSOR_WORKSPACES,
  CursorTypeAlias,
  CursorWorkspaceAlias,
  type AiDevRequest,
  type CursorType,
  type CursorWorkspace,
} from "./vo/aiDevRequest";

function isCursorType(value: string): value is CursorTypeAlias {
  return value in CURSOR_TYPE_ALIASES;
}

function isCursorWorkspace(value: string): value is CursorWorkspaceAlias {
  return value in CURSOR_WORKSPACE_ALIASES;
}

export function registerCursorCommand(bot: TelegramBot) {
  bot.onText(/\/c(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const command = match?.[1]?.trim();

    if (!command) {
      await sendMessage(bot, chatId, CURSOR_MESSAGES.EMPTY_REQUEST);
      return;
    }

    const [workspaceAlias, typeAlias, ...taskParts] = command.split(/\s+/);
    const task = taskParts.join(" ").trim();

    if (
      !isCursorWorkspace(workspaceAlias) ||
      !isCursorType(typeAlias) ||
      !task
    ) {
      await sendMessage(bot, chatId, CURSOR_MESSAGES.EMPTY_REQUEST);
      return;
    }

    const workspace =
      CURSOR_WORKSPACE_ALIASES[workspaceAlias as CursorWorkspaceAlias];
    const type = CURSOR_TYPE_ALIASES[typeAlias as CursorTypeAlias];

    const request: AiDevRequest = {
      workspace,
      type,
      task,
    };

    try {
      await sendMessage(bot, chatId, CURSOR_MESSAGES.PROCESSING);

      const answer = await requestCursor(request);

      await sendMessage(bot, chatId, answer);
    } catch (error) {
      console.error("[cursorCommand] Command failed:", error);

      await sendMessage(bot, chatId, CURSOR_MESSAGES.ERROR);
    }
  });
}
