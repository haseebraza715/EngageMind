# Frontend Architecture

## Purpose
The frontend provides the user-facing thesis flow:
- authentication,
- chat with memory continuity,
- document upload,
- GPT-2 training trigger, status monitoring, and GPT-2 LoRA chat mode.

## Main Structure
- `src/pages/*`: route-level auth/profile screens (login, register, profile, reset flows).
- `src/components/Chat/*`: chat route UI (chat page/container, message view, upload, training panel).
- `src/components/UI/*`: shared reusable interface primitives.
- `src/api/*`: Axios clients for backend auth, RAG API, and fine-tune API.
- `src/services/*`: request orchestration and helper services.
- `src/constants/*`: API URLs, feature constants, and shared settings.
- `src/App.js`: route mapping and protected flow entry.

## Runtime Integration
```mermaid
flowchart LR
  UI["React UI"]
  AUTH["Auth Client (axiosAuth)"]
  CHAT["RAG Client (axiosChat/chatApi)"]
  FT["Fine-tune Client (axiosFineTune/chatApi)"]
  LS["localStorage token"]

  UI --> LS
  UI --> AUTH
  UI --> CHAT
  UI --> FT
  AUTH --> BE["Backend API :5003"]
  CHAT --> RAG["RAG API :5001"]
  FT --> FTA["Fine-tune API :5002"]
```

## Request Flow
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant BE as Backend
  participant R as RAG API
  participant F as Fine-tune API

  U->>FE: Login
  FE->>BE: /auth/login
  BE-->>FE: JWT
  U->>FE: Chat + upload + train
  FE->>R: /api/conversation + /api/upload
  FE->>F: /api/fine-tune + /api/fine-tune/status/:task_id
  FE->>F: /api/fine-tune/model + /api/fine-tune/chat
```

## Design Notes
- JWT token is the single auth source for all API calls.
- UI surfaces controlled errors to avoid demo-breaking crashes.
- `axiosChat` and `axiosFineTune` enforce token presence and redirect to login on `401`.
