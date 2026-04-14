# RAG and Fine-Tune Architecture

## Purpose
This module implements:
- retrieval-augmented generation (RAG) chat,
- per-user conversation persistence,
- GPT-2 LoRA fine-tuning with async status updates.

## Service Layout
- RAG API (`main.py`, port `5001`)
  - upload and retrieval workflows,
  - conversation/message handlers,
  - prompt and quality evaluation pipeline.
- Fine-tune API (`fine_tune/fine_tune_app.py`, port `5002`)
  - corpus build,
  - training task queueing,
  - status/result serialization.

## Component Diagram
```mermaid
flowchart LR
  FE["Frontend"]
  RAG["RAG API :5001"]
  FT["Fine-tune API :5002"]
  WF["LangGraph Workflow"]
  RET["Retriever + Vector Search"]
  EV["Evaluator (rewrite/relevance/hallucination)"]
  NODOC["No-doc Handler"]
  DB[("MongoDB")]
  REDIS[("Redis")]
  CELERY["Celery Worker"]
  ART["Model Artifacts"]

  FE --> RAG
  RAG --> WF
  WF --> RET
  WF --> EV
  WF --> NODOC
  RET --> DB
  RAG --> DB

  FE --> FT
  FT --> DB
  FT --> REDIS
  REDIS --> CELERY
  CELERY --> ART
  CELERY --> DB
```

## RAG Message Flow
```mermaid
sequenceDiagram
  participant FE as Frontend
  participant R as RAG API
  participant W as LangGraph Workflow
  participant D as Retriever/Docs
  participant E as Evaluator

  FE->>R: POST /api/conversation/:id/message
  R->>W: Execute graph
  W->>D: Retrieve relevant chunks
  W->>E: Grade relevance and hallucination
  alt Docs available and quality pass
    W-->>R: Grounded answer + citations
  else No docs or quality fail
    W-->>R: Safe fallback / no-doc answer
  end
  R-->>FE: JSON { answer }
```

## Fine-Tune Flow
```mermaid
sequenceDiagram
  participant FE as Frontend
  participant FT as Fine-tune API
  participant DB as MongoDB
  participant Q as Redis/Celery
  participant CW as Celery Worker

  FE->>FT: POST /api/fine-tune
  FT->>DB: Build user corpus
  FT->>Q: Enqueue training task
  FE->>FT: GET /api/fine-tune/status/:task_id
  Q->>CW: Execute GPT-2 LoRA training
  CW-->>FT: Task state + result metadata
  FT-->>FE: PENDING/PROGRESS/SUCCESS/FAILURE
```

## Reliability Notes
- Quality checks default to enabled (`SKIP_QUALITY_CHECKS=false`).
- Bad responses are captured with structured metadata for triage.
- ObjectId values are normalized to JSON-safe strings in fine-tune status/result paths.
- Mongo or Redis outages surface as controlled API errors, not silent failures.
- For local macOS stability, run the Celery worker with `--pool=solo --concurrency=1`.
- If training appears stuck, verify Redis reachability and check `celery.log` for task state transitions.
- If auth-related errors appear across services, verify matching `JWT_SECRET` values between backend and RAG env files.
- RAG conversation/upload and fine-tune endpoints are authentication-protected; missing/invalid tokens should fail fast.
- If a user has no uploaded documents, the no-doc handler returns guided responses instead of ungrounded claims.
