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

```text
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
```
