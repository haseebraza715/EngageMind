# EngageMind Architecture

## System Summary
EngageMind is split into three main components:
- **Frontend** (`engagemind-frontend`): user interface, auth flow, chat, upload, training status.
- **Backend** (`engagemind-backend`): authentication, user profile, role-protected routes.
- **RAG/Fine-tune** (`engagemind-rag`): document ingestion/retrieval, conversation persistence, GPT-2 fine-tune orchestration.

## Service Diagram
```mermaid
flowchart LR
  FE["Frontend (:3000)"]
  BE["Backend API (:5003)"]
  RAG["RAG API (:5001)"]
  FT["Fine-tune API (:5002)"]
  MDB[("MongoDB")]
  REDIS[("Redis/Celery")]

  FE --> BE
  FE --> RAG
  FE --> FT
  BE --> MDB
  RAG --> MDB
  FT --> MDB
  FT --> REDIS
```

## Request Flow
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant BE as Backend
  participant R as RAG API
  participant F as Fine-tune API

  U->>FE: Login/Register
  FE->>BE: /auth/* (JWT issuance/validation)
  U->>FE: Chat + Upload
  FE->>R: /api/conversation, /api/upload
  R-->>FE: Grounded responses + persisted history
  U->>FE: Start training
  FE->>F: /api/fine-tune
  FE->>F: /api/fine-tune/status/:task_id (polling)
  F-->>FE: PENDING/PROGRESS/SUCCESS/FAILURE
```

## Data Ownership
- Backend owns user/account records.
- RAG owns conversation and uploaded document retrieval data.
- Fine-tune service uses user documents/corpus and writes training artifacts/metadata.
