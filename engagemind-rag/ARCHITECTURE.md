# RAG and Fine-Tune Architecture

## Purpose
This component delivers:
- document-grounded chat (RAG),
- per-user conversation persistence,
- GPT-2 adaptive fine-tuning with status tracking.

## Service Split
- **RAG API** (`main.py`, port `5001`)
  - conversation routes,
  - upload/ingestion,
  - retrieval workflow.
- **Fine-tune API** (`fine_tune/fine_tune_app.py`, port `5002`)
  - corpus extraction from uploaded docs,
  - Celery task start,
  - deterministic status endpoint.

## System Diagram
```mermaid
flowchart LR
  FE["Frontend"]
  RAG["RAG API :5001"]
  FT["Fine-tune API :5002"]
  H["Route Handlers + Workflows"]
  ING["Ingestion + Retrieval"]
  DB["MongoDB"]
  Q["Redis/Celery Queue"]
  W["Celery Worker"]
  M["Model Artifacts"]

  FE --> RAG
  FE --> FT
  RAG --> H
  H --> ING
  H --> DB
  FT --> DB
  FT --> Q
  Q --> W
  W --> M
```

## Fine-Tune Flow
```mermaid
sequenceDiagram
  participant FE as Frontend
  participant FT as Fine-tune API
  participant DB as MongoDB
  participant Q as Celery/Redis
  participant W as Worker

  FE->>FT: POST /api/fine-tune
  FT->>DB: read user uploaded corpus
  FT->>Q: enqueue training task
  FE->>FT: GET /api/fine-tune/status/:task_id
  Q->>W: run GPT-2 LoRA training
  W-->>FT: task state/result
  FT-->>FE: PENDING/PROGRESS/SUCCESS/FAILURE
```

## Design Notes
- Status semantics are normalized for predictable frontend polling.
- Conversation/message timestamps are normalized for stable ordering.
- If dependencies are down (Mongo/Redis), APIs return controlled JSON errors.
