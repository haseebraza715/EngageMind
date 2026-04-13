# EngageMind Defense Demo Checklist

## Prerequisites
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379`
- Valid API keys in `engagemind-rag/.env` (for configured inference provider)

## Start
```bash
cd /Users/x/Downloads/Thesis/EngageMind
./scripts/run_all.sh
```

## Demo Flow (Thesis Requirements)
1. Register and log in from frontend.
2. Create a conversation and send 2-3 messages.
3. Refresh and confirm messages/history persist (memory retention).
4. Upload a document and ask a question grounded in that document (RAG path).
5. Start GPT-2 training from sidebar and show status updates (`PENDING` -> `PROGRESS` -> `SUCCESS`/`FAILURE`).
6. Show backend/RAG error handling by briefly stopping a dependency and observing controlled messages (no crash).

## Quick Health Checks
- Backend: `http://localhost:5003/`
- RAG health: `http://localhost:5001/api/health`
- Fine-tune auth check: `POST http://localhost:5002/api/fine-tune` without token returns `401`

## Verification Command
```bash
./scripts/verify_all.sh
```

## Expected Outcome
- Core thesis flows work end-to-end.
- Failures are controlled and understandable.
- System is reproducible with documented startup and validation steps.
