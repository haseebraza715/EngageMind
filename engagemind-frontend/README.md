# EngageMind Frontend

## Overview
React client for thesis-critical user flows:
- authenticated access,
- per-user chat and memory continuity,
- document upload for RAG,
- GPT-2 fine-tune start, model availability checks, and GPT-2 LoRA chat mode.

Default URL: `http://localhost:3000`

## Responsibilities
- Manage auth token lifecycle in UI (`localStorage` token).
- Call backend auth APIs (`/auth/*`).
- Call RAG APIs for conversations/upload.
- Call fine-tune APIs for training start/status, adapter availability, and GPT-2 LoRA chat.
- Present controlled success/error states for demo stability.

## Required Environment
- `REACT_APP_AUTH_API_URL` (default `http://localhost:5003`)
- `REACT_APP_RAG_API_URL` (default `http://localhost:5001`)
- `REACT_APP_FINE_TUNE_API_URL` (default `http://localhost:5002`)

## Setup and Run
```bash
# from repository root
cd engagemind-frontend
npm install
npm start
```

Or start all services from root:
```bash
# from EngageMind repository root
./scripts/run_all.sh
```

## Thesis Demo Flow
1. Register and complete the verification token flow, or log in.
2. Open chat and create/send messages.
3. Refresh and verify conversation memory persists.
4. Upload a readable document (`.txt`, `.md`, `.pdf`, or `.docx`, max 10 MB).
5. Trigger GPT-2 LoRA fine-tuning from sidebar.
6. Observe status updates (`PENDING` -> `PROGRESS` -> terminal state).
7. Switch to `GPT-2 LoRA` mode and send a message using the trained adapter.

The sidebar reports fine-tune task progress and completion. Chat defaults to RAG for grounded answers, but users can switch to `GPT-2 LoRA` mode once an adapter is available.

## Verification
```bash
npm run test:custom
npm run test:ci
npm run build
```

## Troubleshooting
- `401 Unauthorized`: user token missing/expired; log in again.
- Upload/training errors: verify backend, RAG, and fine-tune services are reachable.
- If APIs are down, UI shows controlled errors instead of crashing.

## References
- Local architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Root runbook: [README.md](../README.md)
- System design: [ARCHITECTURE.md](../ARCHITECTURE.md)
- Defense script: [../scripts/run_all.sh](../scripts/run_all.sh)
