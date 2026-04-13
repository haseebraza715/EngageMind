# EngageMind RAG and Fine-Tune Services

## Overview
This directory provides two thesis-critical Flask services:
- **RAG API** (`main.py`, default `:5001`)
- **Fine-tune API** (`fine_tune/fine_tune_app.py`, default `:5002`)

Together they deliver document-grounded chat, per-user memory persistence, and adaptive GPT-2 training with live status tracking.

## Responsibilities
### RAG API
- Conversation CRUD per authenticated user.
- Message handling with retrieval-augmented context.
- Document ingestion/upload pipeline.

### Fine-tune API
- Build user training corpus from uploaded documents.
- Queue GPT-2 LoRA training task.
- Return deterministic status semantics for frontend polling.

## Required Environment
- `MONGO_URL` (required for persistence)
- `JWT_SECRET` (required for auth verification)
- `MISTRAL_API_KEY` (required for configured inference path)
- `CELERY_REDIS_URL` (default `redis://localhost:6379/0`)
- `FINE_TUNE_DEBUG` (optional; default `false`)

## Setup and Run
```bash
cd /Users/x/Downloads/Thesis/EngageMind/engagemind-rag
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start services:
```bash
python main.py
python fine_tune/fine_tune_app.py
celery -A fine_tune.celery_config.app worker --loglevel=info
```

## API Contract (Key Endpoints)
### RAG
- `GET /api/health`
- `POST /api/upload`
- `POST /api/conversation`
- `GET /api/conversations`
- `GET /api/conversation/<conversation_id>`
- `POST /api/conversation/<conversation_id>/message`
- `DELETE /api/conversation/<conversation_id>`

### Fine-Tune
- `POST /api/fine-tune`
- `GET /api/fine-tune/status/<task_id>`

Status values:
- `PENDING`
- `PROGRESS`
- `SUCCESS`
- `FAILURE`

## Thesis Alignment Notes
- Conversation/message timestamps are normalized for consistent memory ordering.
- Fine-tune corpus is built from actual uploaded content (not static placeholders).
- Failures return readable JSON error states for defense-safe behavior.

## Verification
```bash
source .venv/bin/activate
python test_apis.py
python test_phase1_simple.py
python test_security_fixes.py
python verify_phase3.py
python verify_phase4.py
python test_fine_tune_contract.py
python test_thesis_hard_regression.py
```

## Troubleshooting
- RAG health `503`: MongoDB unavailable.
- Fine-tune start/status errors: check Redis and Celery worker.
- Auth failures (`401`): verify token issuer and shared `JWT_SECRET`.

## References
- Local architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Root runbook: [README.md](../README.md)
- System design: [ARCHITECTURE.md](../ARCHITECTURE.md)
- Defense checklist: [docs/DEFENSE_DEMO_CHECKLIST.md](../docs/DEFENSE_DEMO_CHECKLIST.md)
