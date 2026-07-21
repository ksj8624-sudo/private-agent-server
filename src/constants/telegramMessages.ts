export const COMMON_MESSAGES = {
  PROCESSING: "명령을 처리하고 있어...",
  UNKNOWN_ERROR: "명령 처리 중 오류가 발생했어. 잠시 후 다시 시도해줘.",
} as const;

export const AGENT_MESSAGES = {
  PROCESSING: "Agent 명령을 실행하고 있어...",
  EMPTY_REQUEST: [
    "사용법:",
    "/<agent> <workspace> <type> <task>",
    "",
    "agent: cursor | codex",
    "workspace: backend | server | front",
    "type: feature | review | refactor | bugfix",
  ].join("\n"),
  ERROR: "Agent 명령 처리 중 오류가 발생했어. 잠시 후 다시 시도해줘.",
} as const;

export const ASK_MESSAGES = {
  PROCESSING: "답변을 생성하고 있어...",
  EMPTY_REQUEST: "사용법: /ask 질문 내용",
  ERROR: "질문 처리 중 오류가 발생했어. 잠시 후 다시 시도해줘.",
} as const;

export const PLAN_MESSAGES = {
  PROCESSING: "계획을 생성하고 있어...",
  EMPTY_REQUEST: "사용법: /plan 요청 내용",
  ERROR: "계획 생성 중 오류가 발생했어. 잠시 후 다시 시도해줘.",
} as const;

export const REVIEW_MESSAGES = {
  PROCESSING: "리뷰를 생성하고 있어...",
  EMPTY_REQUEST: "사용법: /review 요청 내용",
  ERROR: "리뷰 생성 중 오류가 발생했어. 잠시 후 다시 시도해줘.",
} as const;
