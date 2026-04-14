# EngageMind Architecture

## System Summary
EngageMind is a multi-service local system with clear ownership boundaries:
- Frontend renders auth, chat, upload, and training status.
- Backend handles authentication and user account data.
- RAG API handles retrieval, grounded answer generation, and conversation persistence.
- Fine-tune API manages GPT-2 LoRA task submission and status polling.

## Runtime Topology
```mermaid
flowchart LR
  FE["Frontend :3000"]
  BE["Backend API :5003"]
  RAG["RAG API :5001"]
  FT["Fine-tune API :5002"]
  MDB[("MongoDB :27017")]
  REDIS[("Redis :6379")]
  CELERY["Celery Worker"]

  FE --> BE
  FE --> RAG
  FE --> FT
  BE --> MDB
  RAG --> MDB
  FT --> MDB
  FT --> REDIS
  REDIS --> CELERY
  CELERY --> MDB
```

## Core Request Flows
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant BE as Backend
  participant R as RAG API
  participant F as Fine-tune API
  participant C as Celery Worker

  U->>FE: Login with Google or credentials
  FE->>BE: /auth/*
  BE-->>FE: JWT

  U->>FE: Ask question / upload documents
  FE->>R: /api/upload and /api/conversation/*
  R-->>FE: Grounded answer + citations

  U->>FE: Start training
  FE->>F: POST /api/fine-tune
  F->>C: enqueue training task
  FE->>F: GET /api/fine-tune/status/:task_id
  F-->>FE: PENDING / PROGRESS / SUCCESS / FAILURE
```

## Prompt and Quality Layer (RAG)
- Prompt stack includes answer generation, rewrite, relevance/hallucination grading, and no-doc handling.
- Quality checks are enabled by default to reduce bad responses.
- Responses that fail quality criteria are tracked through structured logs for triage.

## Failure Domains
- MongoDB unavailable:
  - Backend auth/user lookup can fail.
  - RAG/fine-tune persistence is unavailable.
- Redis/Celery unavailable:
  - Fine-tune jobs cannot execute.
- Model provider issues (quota/rate limits/network):
  - RAG may return fallback errors.
  - Retry/fallback behavior should be monitored in logs.

## Operational Notes
- `scripts/run_all.sh` starts all services and reports dependency readiness.
- `.runtime-logs/` contains service logs (`backend.log`, `rag.log`, `fine-tune.log`, `celery.log`).
- Keep provider and auth configuration aligned across services.
