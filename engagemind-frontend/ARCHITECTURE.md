# Frontend Architecture

## Purpose
The frontend provides the user-facing thesis flow:
- authentication,
- chat with memory continuity,
- document upload,
- GPT-2 training trigger and status monitoring.

## Main Structure
- `src/pages/*`: route-level screens (login, register, chat, profile).
- `src/components/Chat/*`: chat container, message view, upload, training panel.
- `src/api/*`: Axios clients for backend auth, RAG API, and fine-tune API.
- `App.js`: route mapping and protected flow entry.

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
```

## Design Notes
- JWT token is the single auth source for all API calls.
- UI surfaces controlled errors to avoid demo-breaking crashes.
