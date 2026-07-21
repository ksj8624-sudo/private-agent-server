export const AGENT_TYPE_ALIASES = {
  c: "cursor",
  cx: "codex",
  cl: "claude",
  gm: "gemini",
} as const;

export const AGENT_TASK_TYPES = [
  "feature",
  "review",
  "refactor",
  "bugfix",
] as const;

export const AGENT_WORKSPACES = ["backend", "server", "front"] as const;

export const AGENT_WORKSPACE_ALIASES = {
  b: "backend",
  s: "server",
  f: "front",
} as const;

export const AGENT_TASK_TYPE_ALIASES = {
  rv: "review",
  rf: "refactor",
  ft: "feature",
  bf: "bugfix",
} as const;

export type AgentTypeAlias = keyof typeof AGENT_TYPE_ALIASES;
export type AgentWorkspaceAlias = keyof typeof AGENT_WORKSPACE_ALIASES;

export type AgentType = (typeof AGENT_TYPE_ALIASES)[AgentTypeAlias];

export type AgentWorkspace =
  (typeof AGENT_WORKSPACE_ALIASES)[AgentWorkspaceAlias];

export type AgentTaskTypeAlias = keyof typeof AGENT_TASK_TYPE_ALIASES;

export type AgentTaskType =
  (typeof AGENT_TASK_TYPE_ALIASES)[AgentTaskTypeAlias];

export interface AiDevRequest {
  agentType: AgentType;
  workspace: AgentWorkspace;
  taskType: AgentTaskType;
  task: string;
}
