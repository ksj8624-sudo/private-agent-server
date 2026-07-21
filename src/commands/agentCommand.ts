import TelegramBot from "node-telegram-bot-api";
import { requestAgent } from "../service/backendService";
import { sendMessage } from "../service/telegramService";
import { AGENT_MESSAGES } from "../constants/telegramMessages";
import {
  AGENT_TYPE_ALIASES,
  AGENT_TASK_TYPE_ALIASES,
  AGENT_WORKSPACE_ALIASES,
  AgentTaskTypeAlias,
  AgentWorkspaceAlias,
  type AiDevRequest,
  type AgentTypeAlias,
} from "./vo/aiDevRequest";

function isAgentType(value: string): value is AgentTypeAlias {
  return value in AGENT_TYPE_ALIASES;
}

function isAgentTaskType(value: string): value is AgentTaskTypeAlias {
  return value in AGENT_TASK_TYPE_ALIASES;
}

function isAgentWorkspace(value: string): value is AgentWorkspaceAlias {
  return value in AGENT_WORKSPACE_ALIASES;
}

export function registerAgentCommand(bot: TelegramBot) {
  bot.onText(/^\/(c(?:x)?)(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const agentTypeAlias = match?.[1]?.trim();
    const input = match?.[2]?.trim();

    if (!agentTypeAlias || !input) {
      await sendMessage(bot, chatId, AGENT_MESSAGES.EMPTY_REQUEST);
      return;
    }

    const [workspaceAlias, taskTypeAlias, ...taskParts] = input.split(/\s+/);
    const task = taskParts.join(" ").trim();

    if (
      !isAgentType(agentTypeAlias) ||
      !isAgentWorkspace(workspaceAlias) ||
      !isAgentTaskType(taskTypeAlias) ||
      !task
    ) {
      await sendMessage(bot, chatId, AGENT_MESSAGES.EMPTY_REQUEST);
      return;
    }

    const request: AiDevRequest = {
      agentType: AGENT_TYPE_ALIASES[agentTypeAlias as AgentTypeAlias],
      workspace: AGENT_WORKSPACE_ALIASES[workspaceAlias as AgentWorkspaceAlias],
      taskType: AGENT_TASK_TYPE_ALIASES[taskTypeAlias as AgentTaskTypeAlias],
      task,
    };

    try {
      await sendMessage(bot, chatId, AGENT_MESSAGES.PROCESSING);

      const answer = await requestAgent(request);

      await sendMessage(bot, chatId, answer);
    } catch (error) {
      console.error("[agentCommand] Command failed:", error);

      await sendMessage(bot, chatId, AGENT_MESSAGES.ERROR);
    }
  });
}
