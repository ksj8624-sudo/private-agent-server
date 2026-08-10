# 🤖 Private Agent Telegram Server

한국어 중심으로 작성하되, 기술명·API명·명령어는 영어 표기를 유지합니다.

---

## Project Overview

`private-agent-server`는 Private Agent 생태계에서 **Telegram Bot 서버** 역할을 담당하는 프로젝트입니다.

- **private-agent-server의 역할**: Telegram 사용자의 명령을 수신하고, 명령을 파싱/검증한 뒤 `private-agent-backend`의 HTTP API를 호출하여 결과를 다시 Telegram으로 전달하는 **중계(Bridge) 서버**입니다. AI 응답 생성, 코드 리뷰, Agent 실행 같은 실제 로직은 이 프로젝트가 아니라 Backend가 담당합니다.
- **Telegram Bot의 역할**: `node-telegram-bot-api`를 이용해 Long Polling 방식으로 메시지를 수신하고, `/ask`, `/plan`, `/review`, Agent 명령 등 사용자 명령을 해석해 알맞은 Backend API로 전달하는 **입력 인터페이스**입니다. 자체적으로 AI 연산이나 상태 저장을 수행하지 않습니다.
- **Backend와의 연동 구조**: `src/service/backendService.ts`가 `BACKEND_API_URL` 환경 변수를 기준으로 `fetch`를 통해 Backend REST API(`/api/ask`, `/api/plan`, `/api/review`, `/dev/agent`)를 호출합니다. 인증 없이 단순 HTTP POST 요청/응답 구조로 동작합니다.
- **Web / Android / iOS 프로젝트와의 관계**: `ai-agent-lab`(Web), `private-agent`(Android), `PrivateAgent`(iOS)는 모두 `private-agent-backend`를 함께 사용하는 **별도의 독립 클라이언트 저장소**입니다. `private-agent-server`는 이들 클라이언트와 직접 통신하거나 코드/리소스를 공유하지 않으며, 오직 Telegram 채널만을 위한 인터페이스입니다.

본 프로젝트는 로컬 Long Polling 방식으로만 동작하며, 별도의 웹 서버나 자체 REST API 엔드포인트는 제공하지 않습니다.

---

## Telegram Bot 역할

`src/bot/telegrambot.ts`에서 `node-telegram-bot-api`로 Bot 인스턴스를 생성하고(`polling: true`), `src/index.ts`가 각 명령 모듈의 `register*Command(bot)` 함수를 호출해 명령 핸들러를 등록합니다.

Bot이 실제로 수행하는 일:

1. Telegram 메시지 수신 (`bot.on("message")`로 모든 메시지를 로그로 기록)
2. `bot.onText(정규식, handler)`로 명령어 패턴 매칭
3. 명령 인자 파싱 및 필수값 검증 (없으면 사용법 안내 메시지 전송)
4. 필요 시 `backendService`를 통해 Backend API 호출
5. 응답(또는 에러 메시지)을 Telegram으로 전송
6. `src/service/telegramService.ts`를 통해 4,000자를 초과하는 메시지를 줄바꿈 기준으로 분할 전송

Bot 자체는 사용자 인증, 세션/상태 저장, DB 접근을 수행하지 않습니다.

---

## Backend와의 연동 구조

`src/service/backendService.ts`는 아래처럼 `BACKEND_API_URL` 환경 변수를 기준으로 Backend를 호출합니다.

```ts
const BACKEND_API_URL = process.env.BACKEND_API_URL;

const response = await fetch(`${BACKEND_API_URL}${path}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
```

| 호출 함수             | Backend Endpoint   | Request Body             |
| --------------------- | ------------------ | ------------------------ |
| `askBackend`          | `POST /api/ask`    | `{ question: string }`   |
| `generatePlanBackend` | `POST /api/plan`   | `{ topic: string }`      |
| `reviewBackend`       | `POST /api/review` | `{ reviewCode: string }` |
| `requestAgent`        | `POST /dev/agent`  | `AiDevRequest` 객체      |

응답은 `{ answer: string }` 형태를 기대하며, `answer` 필드가 없으면 예외를 던집니다. `response.ok`가 아니면 상태 코드와 응답 본문을 포함한 예외를 발생시킵니다.

### 역할 분리

- `private-agent-server` (본 프로젝트): Telegram 입력 수신, 명령 유효성 검사, Backend 호출, 결과를 Telegram 메시지로 전송
- `private-agent-backend`: OpenAI 호출, 계획/리뷰 생성, GitHub 연동, Cursor/Codex/Claude CLI Agent 실행, 실행 이력 저장

즉 `private-agent-server`는 Telegram UI 레이어이고, 실제 작업 수행은 전적으로 `private-agent-backend`가 담당합니다.

---

## Command 구조

각 명령은 `src/commands/*.ts` 파일 단위로 분리되어 있으며, 공통적으로 `register*Command(bot: TelegramBot)` 함수를 export 합니다. `src/index.ts`에서 이 함수들을 순서대로 호출해 Bot에 등록합니다.

명령은 두 가지 유형으로 나뉩니다.

- **정적 응답 명령**: `/start`, `/help`, `/ping`, `/status` — Backend 호출 없이 고정 문자열을 바로 응답
- **Backend 위임 명령**: `/ask`, `/plan`, `/review`, Agent 명령(`/cu`, `/cx`, `/cl`) — 인자를 검증한 뒤 `backendService`를 통해 Backend를 호출하고 결과를 응답

Backend 위임 명령의 공통 처리 흐름:

```text
bot.onText(정규식) 매칭
  -> 인자 파싱 및 trim
  -> 필수값 검증 (없으면 EMPTY_REQUEST 메시지 후 종료)
  -> PROCESSING 메시지 전송
  -> backendService.* 호출 (try/catch)
  -> 성공 시 응답 전송 / 실패 시 ERROR 메시지 전송
```

사용자 안내 문구는 `src/constants/telegramMessages.ts`에 명령별 `*_MESSAGES` 객체로 정의되어 있습니다.

### Agent 명령 구조

Agent 명령(`/cu`, `/cx`, `/cl`)은 `src/commands/agentCommand.ts`에서 하나의 정규식으로 함께 등록되며, `src/commands/vo/aiDevRequest.ts`에 정의된 alias 테이블로 입력값을 변환합니다.

```text
/<agent> <workspace> <type> <task>
```

| Alias 종류 | 코드 | 값         |
| ---------- | ---- | ---------- |
| Agent Type | `cu` | `cursor`   |
| Agent Type | `cx` | `codex`    |
| Agent Type | `cl` | `claude`   |
| Agent Type | `gm` | `gemini`   |
| Workspace  | `b`  | `backend`  |
| Workspace  | `s`  | `server`   |
| Workspace  | `f`  | `front`    |
| Task Type  | `ft` | `feature`  |
| Task Type  | `rv` | `review`   |
| Task Type  | `rf` | `refactor` |
| Task Type  | `bf` | `bugfix`   |

---

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript (`ts-node`로 직접 실행, 별도 빌드 스크립트 없음)
- **Telegram 연동**: `node-telegram-bot-api` (Long Polling)
- **HTTP 통신**: 표준 `fetch` (Backend API 호출)
- **환경 변수 관리**: `dotenv`
- **AI SDK**: `openai` 패키지가 의존성에 포함되어 있으나(`src/service/openAiService.ts`) 처리는 private-agent-backend 에서 담당
- **기타 코드 자산**: `src/lambda/telegram/index.mjs` — 최초 AWS Lambda 기반 서버리스 배포용으로 작성된 독립 실행 스크립트(JS/ESM)입니다. `src/index.ts` Long Polling 앱과는 별개이며 현재 앱 실행 경로에 포함되지 않습니다.

---

## Project Structure

```text
private-agent-server/
├── .env
├── package.json
├── tsconfig.json
├── architecture.md
└── src/
    ├── index.ts                    # 진입점, Bot 생성 및 명령 등록
    ├── dev-log.md                  # 최초 AWS Lambda 기반 구현의 개발 로그(참고용)
    ├── plan.md                     # 생태계 차원의 아이디어 메모(참고용)
    ├── bot/
    │   └── telegrambot.ts          # TelegramBot 인스턴스 생성 (polling: true)
    ├── commands/
    │   ├── agentCommand.ts         # /cu, /cx, /cl Agent 명령
    │   ├── askCommand.ts           # /ask
    │   ├── helpCommand.ts          # /help
    │   ├── pingCommand.ts          # /ping
    │   ├── planCommand.ts          # /plan
    │   ├── reviewCommand.ts        # /review
    │   ├── startCommand.ts         # /start
    │   ├── statusCommand.ts        # /status
    │   └── vo/
    │       └── aiDevRequest.ts     # Agent 요청 타입 및 alias 매핑
    ├── constants/
    │   └── telegramMessages.ts     # 명령별 안내/에러 메시지 템플릿
    ├── service/
    │   ├── backendService.ts       # Backend API 호출 (fetch)
    │   ├── openAiService.ts        # OpenAI 직접 호출 (현재 미사용)
    │   └── telegramService.ts      # 메시지 전송 및 4,000자 분할 처리
    └── lambda/
        └── telegram/
            ├── index.mjs           # 최초 AWS Lambda 핸들러 (독립 실행 경로)
            └── .env.example
```

---

## API / Command Overview

### Telegram Command

| Command                         | 구현 여부 | 처리 파일                       | 동작                                                                                                                |
| ------------------------------- | --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/start`                        | 구현됨    | `src/commands/startCommand.ts`  | "PrivateAgent started." 응답                                                                                        |
| `/help`                         | 구현됨    | `src/commands/helpCommand.ts`   | 사용 가능한 명령 안내 (`/start`, `/help`, `/ping`, `/status`, `/ask`만 안내, `/plan`·`/review`·Agent 명령은 미포함) |
| `/ping`                         | 구현됨    | `src/commands/pingCommand.ts`   | "pong" 응답                                                                                                         |
| `/status`                       | 구현됨    | `src/commands/statusCommand.ts` | 고정 상태 문자열 응답                                                                                               |
| `/ask <질문>`                   | 구현됨    | `src/commands/askCommand.ts`    | `POST /api/ask`로 전달 후 응답 반환                                                                                 |
| `/plan <주제>`                  | 구현됨    | `src/commands/planCommand.ts`   | `POST /api/plan`으로 전달 후 응답 반환                                                                              |
| `/review <코드>`                | 구현됨    | `src/commands/reviewCommand.ts` | `POST /api/review`로 전달 후 응답 반환                                                                              |
| `/cx <workspace> <type> <task>` | 구현됨    | `src/commands/agentCommand.ts`  | `POST /dev/agent`로 전달 (agentType: `codex`)                                                                       |
| `/cl <workspace> <type> <task>` | 구현됨    | `src/commands/agentCommand.ts`  | `POST /dev/agent`로 전달 (agentType: `claude`)                                                                      |
| `/cu <workspace> <type> <task>` | 구현됨    | `src/commands/agentCommand.ts`  | `POST /dev/agent`로 전달 (agentType: `cursor`)                                                                      |

### Backend API 호출

| 호출 위치             | Endpoint      | Method | Timeout(설정값)             |
| --------------------- | ------------- | ------ | --------------------------- |
| `askBackend`          | `/api/ask`    | POST   | 30s (실제로 강제되지 않음)  |
| `generatePlanBackend` | `/api/plan`   | POST   | 30s (실제로 강제되지 않음)  |
| `reviewBackend`       | `/api/review` | POST   | 30s (실제로 강제되지 않음)  |
| `requestAgent`        | `/dev/agent`  | POST   | 5min (실제로 강제되지 않음) |

---

## Getting Started

### 설치

```bash
npm install
```

### 환경 변수

`.env` 파일에 아래 값을 설정합니다. 실제 값은 저장소에 포함되어 있지 않으며, 각자 환경에 맞게 채워야 합니다.

| 변수명               | 필수 여부                                        | 사용 위치                       | 설명                                   |
| -------------------- | ------------------------------------------------ | ------------------------------- | -------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | 필수                                             | `src/index.ts`                  | Telegram Bot 토큰                      |
| `BACKEND_API_URL`    | 필수                                             | `src/service/backendService.ts` | `private-agent-backend` Base URL       |
| `OPENAI_API_KEY`     | 향후 OpenAI 직접 호출 기능 확장을 위한 환경 변수 | `src/service/openAiService.ts`  | Telegram 명령 흐름에서는 호출되지 않음 |

### 실행

```bash
npm run dev
```

`package.json`에 정의된 스크립트는 `dev`가 유일하며(`ts-node src/index.ts`), 별도의 `build`/`start` 프로덕션 스크립트는 정의되어 있지 않습니다. 실행 시 Bot은 Long Polling 모드로 동작합니다.

---

## Current Implementation

### Implemented

- Telegram Bot 시작 및 Long Polling 메시지 수신
- `/start`, `/help`, `/ping`, `/status` 정적 명령 처리
- `/ask`, `/plan`, `/review` → Backend API 호출 및 응답 전달
- `/cx`, `/cl` Agent 명령 → `POST /dev/agent` 호출 및 응답 전달
- 명령 인자 누락 시 사용법 안내 메시지 응답
- Backend 호출 실패/HTTP 에러 시 에러 메시지 응답 (`try/catch`)
- 4,000자 초과 메시지의 줄바꿈 기준 분할 전송

---

## Roadmap

아래는 현재 코드에 구현되어 있지 않으며, 코드에서 확인되는 문제를 기준으로 정리한 이 프로젝트의 개선 예정 사항입니다. Dashboard, 인증, GitHub Release Note 같은 생태계 전체 차원의 기능은 이 프로젝트의 범위가 아니라 `private-agent-backend`/`ai-agent-lab` 등 다른 저장소의 몫이므로 제외했습니다.

- `gemini` Agent Type을 위한 Telegram 명령 등록
- Backend 호출 타임아웃/요청 중단 로직 정상화
- 미사용 OpenAI Service 정리 또는 Backend 역할에 맞게 제거
- `/help` 명령 안내 내용을 실제 등록된 전체 명령과 동기화
- 프로덕션 빌드/실행 스크립트 및 테스트 코드 추가
- `src/lambda/telegram/index.mjs` Legacy Lambda implementation

---

## Related Projects

- **private-agent-backend** — 실제 AI 처리, GitHub 연동, Agent 실행을 담당하는 Backend API 서버
- **ai-agent-lab** — React + TypeScript 기반 Web Client
- **private-agent** — Kotlin 기반 Android Client
- **PrivateAgent** — SwiftUI 기반 iOS Client

`private-agent-server`는 위 흐름에서 Telegram 채널만을 위한 입력·출력 레이어이며, Web/Android/iOS 클라이언트는 동일한 Backend를 각자 독립적으로 호출하는 별도 프로젝트입니다.

## Architecture

```text
Telegram User
     │
     ▼
private-agent-server
     │
     ▼
private-agent-backend
     │
     ├── OpenAI
     ├── GitHub
     └── AI Agent
```
