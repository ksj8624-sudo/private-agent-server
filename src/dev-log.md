# Private Agent Server - Development Log

## 프로젝트 목적

Telegram을 인터페이스로 사용하는 개인 AI Agent 서버를 만든다.

주요 목표:

- Telegram 명령어로 AI 질문, 계획 생성, 코드 리뷰 수행
- AWS Lambda + API Gateway 기반 서버리스 운영
- OpenAI Responses API 연동
- 향후 GitHub 브랜치/PR diff 리뷰 및 자동 알림 확장
- 비용을 낮게 유지하면서 개인 개발 생산성 도구로 사용

---

## 기술 구성

- Runtime: Node.js ESM (`.mjs`)
- Hosting: AWS Lambda
- API Endpoint: AWS API Gateway HTTP API
- Bot: Telegram Bot API
- AI: OpenAI Responses API
- Source Control: GitHub

---

## 현재 폴더 구조

````text
private-agent-server/
├── src/
│   ├── bot/
│   ├── commands/
│   ├── service/
│   ├── lambda/
│   │   └── telegram/
│   │       ├── index.mjs
│   │       └── .env.example
│   └── .gitignore
├── .gitignore
└── dev-log.md

Phase 1 — 프로젝트 구조
완료
private-agent-server GitHub 저장소 구성
Telegram Bot 기본 프로젝트 구조 생성
.env 및 API 키 Git 제외 설정
.env.example 추가
Lambda 배포용 코드 경로 분리

Phase 2 — Telegram 기본 명령어
완료
Telegram Bot 연결
webhook 기반 메시지 수신
기본 명령어 구현
/start
/help
/ping

Phase 3 — AWS 서버리스 연결
완료
AWS Lambda 생성
API Gateway HTTP API 연결
Telegram webhook → API Gateway → Lambda 호출 확인
CloudWatch Logs 확인
Lambda 환경변수 설정
TELEGRAM_BOT_TOKEN
OPENAI_API_KEY
이슈 및 해결
Lambda 기본 Timeout이 3초여서 OpenAI 요청 중 종료됨
Lambda Timeout을 30초로 변경
Lambda Memory는 512MB 사용 중
Telegram webhook 재시도 요청이 누적되어 메시지가 반복 수신됨
API Gateway 트리거를 일시 제거하고 pending 요청을 정리한 뒤 재연결

Phase 4 — OpenAI /ask 연동
완료
OpenAI Responses API 연결
/ask <질문> 명령어 구현
Telegram으로 OpenAI 답변 전송
구현 메모
모델: gpt-5-mini
OpenAI 요청 timeout: 20초
max_output_tokens: 1000
Lambda timeout: 30초
Lambda memory: 512MB
이슈 및 해결
OpenAI 응답에서 output[0]이 reasoning 항목으로 반환될 수 있음
실제 텍스트는 output 배열의 message content에 존재
flatMap() + find(type === "output_text") 방식으로 파싱 보완

Phase 5 — Local Agent 명령어
완료 명령어
/start
/help
/ping
/status
/ask <질문>
/plan <주제>
/review <코드 또는 텍스트>
기능
/status
Agent 연결 상태 안내
Telegram / Lambda / OpenAI 상태 표시
/plan <주제>
주제 기준 실행 가능한 개발 계획 3단계 생성
/review <코드 또는 텍스트>
Telegram에 붙여넣은 코드 또는 텍스트를 OpenAI로 리뷰
문제점, 개선점, 다음 액션을 짧게 정리
리팩터링
askAndReply(chatId, prompt) 공통 함수 추가
/ask, /plan, /review의 OpenAI 호출 및 Telegram 응답 로직 공통화
CloudWatch 로그 축소

유지 로그:

Command:
OpenAI status:
Telegram status:

제거한 로그:

전체 event body
환경변수 존재 여부
OpenAI 전체 response body
Telegram 전체 response body
현재 운영 설정
Lambda Memory: 512MB
Lambda Timeout: 30 seconds
OpenAI Abort Timeout: 20 seconds
OpenAI Model: gpt-5-mini
OpenAI max_output_tokens: 1000

---

# Phase 6 - GitHub Integration (Completed)

## 목표

GitHub와 Private Agent를 연동하여 Pull Request 이벤트를 자동으로 감지하고,
OpenAI를 이용한 코드 리뷰를 Telegram으로 전달하는 기능 구현.

---

## 완료 기능

### GitHub Branch Diff Review

Telegram에서 브랜치를 직접 리뷰 가능

```text
/review feature/login main
````

동작 순서

```text
Telegram
    ↓
Lambda
    ↓
GitHub Compare API
    ↓
Branch Diff 조회
    ↓
OpenAI Code Review
    ↓
Telegram 응답
```

---

### GitHub Webhook

API Gateway Route 추가

```text
POST /github-webhook
```

GitHub Repository

```
Settings
    ↓
Webhooks
```

등록 완료

Webhook Event

```text
Pull requests
```

처리 이벤트

```text
opened
synchronize
```

---

### PR Notification

PR 생성 시

```text
GitHub
    ↓
Webhook
    ↓
Lambda
    ↓
Telegram
```

예시

```text
🔔 GitHub PR 감지

action : opened

repo

PR 번호

브랜치

URL
```

PR 업데이트(push)

```text
action : synchronize
```

자동 감지 완료

---

### PR Auto Review

Webhook에서

```
base branch
head branch
```

자동 추출

GitHub Compare API 호출

```text
compare/base...head
```

Diff 생성

↓

OpenAI Review

↓

Telegram 자동 전송

리뷰 형식

```text
Critical

Warning

Suggestion
```

---

## AWS 구성

```text
GitHub

↓

Webhook

↓

API Gateway

↓

AWS Lambda

↓

GitHub API

↓

OpenAI API

↓

Telegram
```

---

## Lambda 환경변수

```text
OPENAI_API_KEY

TELEGRAM_BOT_TOKEN

TELEGRAM_CHAT_ID

GITHUB_TOKEN

GITHUB_OWNER

GITHUB_REPO

GITHUB_WEBHOOK_SECRET
```

---

## 구현 완료 명령어

```text
/start

/help

/ping

/status

/ask

/plan

/review
```

---

## 현재 Agent 기능

- Telegram Bot
- OpenAI 질문
- 개발 계획 생성
- 코드 리뷰
- GitHub Branch Diff 리뷰
- GitHub PR 감지
- GitHub PR 자동 코드 리뷰
- AWS Lambda Serverless 운영

---

## 다음 Phase

### Phase 7

Backend API Server 구축

예정 기능

- Express API
- JWT Login
- Refresh Token
- Health Check
- AWS 배포
- Dashboard 연동
