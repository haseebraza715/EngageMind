# EngageMind RAG + Fine-Tune Services

This directory contains two Flask services used in the thesis demo:
- RAG API (`main.py`, default `:5001`)
- Fine-tune API (`fine_tune/fine_tune_app.py`, default `:5002`)

## RAG API Responsibilities
- Per-user conversation CRUD.
- Message processing with document-aware retrieval.
- Document upload and FAISS index updates.

### Key RAG Endpoints
- `POST /api/upload`
- `POST /api/conversation`
- `GET /api/conversations`
- `GET /api/conversation/<conversation_id>`
- `POST /api/conversation/<conversation_id>/message`
- `DELETE /api/conversation/<conversation_id>`

## Fine-Tune API Responsibilities
- Start GPT-2 LoRA fine-tuning from user-uploaded corpus.
- Provide deterministic status polling contract.

### Key Fine-Tune Endpoints
- `POST /api/fine-tune`
- `GET /api/fine-tune/status/<task_id>`

### Status Semantics
- `PENDING`: task queued.
- `PROGRESS`: task running.
- `SUCCESS`: finished with artifact metadata.
- `FAILURE`: failed with readable error message.

## Required Env
- `MONGO_URL`
- `JWT_SECRET`
- `MISTRAL_API_KEY`
- `CELERY_REDIS_URL` (optional)

## Run
```bash
cd /Users/x/Downloads/Thesis/EngageMind/engagemind-rag
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
python fine_tune/fine_tune_app.py
celery -A fine_tune.celery_config.app worker --loglevel=info
```

## Tests
```bash
cd /Users/x/Downloads/Thesis/EngageMind/engagemind-rag
source .venv/bin/activate
python test_apis.py
python test_phase1_simple.py
python test_security_fixes.py
python verify_phase3.py
python verify_phase4.py
python test_fine_tune_contract.py
```

## Thesis Alignment Notes
- Conversation `updated_at` and message timestamps are normalized to epoch seconds for consistent memory ordering.
- Fine-tune corpus extraction reads actual uploaded document content (text/pdf/docx parsing path).
