export const CURSOR_TYPES = [
  "feature",
  "review",
  "refactor",
  "bugfix",
] as const;

export const CURSOR_WORKSPACES = ["backend", "server", "front"] as const;

export const CURSOR_WORKSPACE_ALIASES = {
  b: "backend",
  s: "server",
  f: "front",
} as const;

export const CURSOR_TYPE_ALIASES = {
  rv: "review",
  rf: "refactor",
  ft: "feature",
  bf: "bugfix",
} as const;

export type CursorWorkspaceAlias = keyof typeof CURSOR_WORKSPACE_ALIASES;

export type CursorWorkspace =
  (typeof CURSOR_WORKSPACE_ALIASES)[CursorWorkspaceAlias];

export type CursorTypeAlias = keyof typeof CURSOR_TYPE_ALIASES;

export type CursorType = (typeof CURSOR_TYPE_ALIASES)[CursorTypeAlias];

export interface AiDevRequest {
  workspace: CursorWorkspace;
  type: CursorType;
  task: string;
}
