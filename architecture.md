# Private Agent Platform Architecture

---

# 1. Project Overview

## 목표

Private Agent는 개인 개발 생산성을 향상시키기 위한 AI 기반 개발 플랫폼이다.

단순한 Telegram Bot이 아니라 GitHub, OpenAI, Backend, Frontend를 하나의 플랫폼으로 통합하여 개발자의 업무를 자동화하는 것이 목표이다.

최종적으로 다음과 같은 기능을 제공한다.

- AI 질문 응답
- 코드 리뷰
- GitHub PR 자동 리뷰
- Release Note 생성
- Commit Message 추천
- Dashboard 관리
- 프로젝트 관리
- AI Agent 자동화

---

# 2. Architecture

```
                     Private Agent Platform

                 ┌──────────────────────────────┐
                 │        React Dashboard       │
                 └──────────────┬───────────────┘
                                │
                           HTTPS / JWT
                                │
                                ▼
                   Backend API Server (Express)
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
     PostgreSQL            OpenAI API            GitHub API

                                ▲
                                │
                         AWS Lambda Agent
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
      Telegram Webhook                    GitHub Webhook
```

---

# 3. Project Structure

```
private-agent-platform

├── frontend
│
├── backend
│
├── agent
│
└── docs
```

---

# 4. Component Responsibilities

## Frontend

사용자 화면 제공

주요 기능

- Login
- Dashboard
- Project Management
- Review History
- Agent Settings
- GitHub Status

---

## Backend

서비스 운영 담당

주요 기능

- Login
- JWT
- Refresh Token
- User API
- Project API
- Review History
- Dashboard API

---

## Agent

이벤트 처리 담당

주요 기능

- Telegram Bot
- GitHub Webhook
- OpenAI 호출
- PR Review
- Notification

---

# 5. AWS Architecture

현재 구조

```
Telegram

↓

API Gateway

↓

Lambda

↓

OpenAI
```

GitHub

↓

Webhook

↓

API Gateway

↓

Lambda

↓

Telegram

현재는 Lambda를 중심으로 Agent 기능을 운영한다.

---

# 6. Event Flow

## Telegram

```
User

↓

Telegram

↓

Webhook

↓

API Gateway

↓

Lambda

↓

OpenAI

↓

Telegram API

↓

User
```

---

## GitHub

```
GitHub PR

↓

Webhook

↓

API Gateway

↓

Lambda

↓

GitHub Compare API

↓

OpenAI Review

↓

Telegram
```

---

# 7. Backend Flow

```
React

↓

Backend

↓

JWT

↓

Database
```

Backend는 서비스 로직을 담당한다.

---

# 8. Agent Flow

Agent는 Event Driven 구조를 사용한다.

현재 이벤트

- Telegram Message
- GitHub Pull Request

향후 이벤트

- Scheduler
- Deploy
- Slack
- Discord

---

# 9. Current Features

Telegram

- /start
- /help
- /ping
- /status
- /ask
- /plan
- /review

GitHub

- Branch Diff Review
- PR Notification
- PR Auto Review

OpenAI

- Question Answer
- Plan Generation
- Code Review

AWS

- Lambda
- API Gateway
- CloudWatch

---

# 10. Future Features

GitHub

- Changed File Summary
- Commit Message Recommendation
- Release Note Generation
- PR Score
- PR Summary
- Review History

Backend

- Login
- JWT
- Refresh Token
- Database
- Project API
- User API

Frontend

- Dashboard
- Project Management
- Agent Settings
- Review History
- Statistics

---

# 11. Deployment Strategy

현재

```
Telegram

↓

Lambda
```

↓

Agent 운영

다음 단계

```
React

↓

Backend

↓

AWS
```

↓

서비스 운영

향후

```
Lambda

+

Backend

+

Frontend
```

통합 플랫폼 구축

---

# 12. Design Principles

Private Agent는 다음 원칙을 따른다.

1. 기능보다 구조를 우선한다.

2. Event Driven Architecture를 사용한다.

3. Serverless와 Backend를 적절히 분리한다.

4. Agent는 이벤트 처리에 집중한다.

5. Backend는 서비스 로직을 담당한다.

6. Frontend는 사용자 경험을 담당한다.

7. 모든 기능은 확장 가능하도록 설계한다.

---

# 13. Long-Term Vision

Private Agent는 단순한 Telegram Bot이 아니다.

최종 목표는

- AI 개발 비서
- 프로젝트 관리 플랫폼
- 자동 코드 리뷰 시스템
- Release 자동화
- 개발 Dashboard

를 하나의 플랫폼으로 제공하는 것이다.

Lambda는 Agent 역할을 수행하고,

Backend는 서비스 역할을 수행하며,

Frontend는 사용자가 모든 기능을 쉽게 사용할 수 있도록 제공한다.

이를 통해 하나의 통합 개발 플랫폼을 구축하는 것을 최종 목표로 한다.
