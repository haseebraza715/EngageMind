# EngageMind RAG and Fine-Tune Services

## Overview
This module contains two Flask services used by the main app:
- RAG API (`main.py`, default `:5001`)
- Fine-tune API (`fine_tune/fine_tune_app.py`, default `:5002`)

Together they provide document-grounded chat, conversation persistence, and GPT-2 LoRA fine-tuning.

## Responsibilities
### RAG API
- Conversation CRUD per authenticated user.
- Message handling with retrieval-augmented context.
- Document ingestion/upload pipeline.
- Prompt quality gating and bad-response triage logging.

### Fine-Tune API
- Build user corpus from uploaded documents.
- Queue GPT-2 LoRA training task.
- Return deterministic status payloads for frontend polling.

## Required Environment
### Core
- `MONGO_URL` (required, for example `mongodb://localhost:27017/engagemindbackend`)
- `JWT_SECRET` (required)
- `MISTRAL_API_KEY` (required for embeddings/retrieval)
- `CELERY_REDIS_URL` (default `redis://localhost:6379/0`)
- `FINE_TUNE_DEBUG` (optional, default `false`)
- `SKIP_QUALITY_CHECKS` (optional, default `false`)
- `CHAT_TEMPERATURE` (optional, default `0.1`)

### Chat Provider Selection
- `CHAT_PROVIDER=mistral` (default) or `CHAT_PROVIDER=openrouter`

If `CHAT_PROVIDER=mistral`:
- `MISTRAL_CHAT_MODEL` (default `mistral-small`)
- `MISTRAL_TITLE_MODEL` (defaults to chat model)

If `CHAT_PROVIDER=openrouter`:
- `OPENROUTER_API_KEY` (required)
- `OPENROUTER_BASE_URL` (default `https://openrouter.ai/api/v1`)
- `OPENROUTER_CHAT_MODEL` (default `qwen/qwen3-next-80b-a3b-instruct:free`)
- `OPENROUTER_TITLE_MODEL` (defaults to chat model)
- `OPENROUTER_HTTP_REFERER` or `OPENROUTER_SITE_URL` (optional)
- `OPENROUTER_APP_NAME` or `OPENROUTER_SITE_NAME` (optional)

## Setup
```bash
# from EngageMind repository root
cd engagemind-rag
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Or start all services from the repository root:
```bash
./scripts/run_all.sh
```

## Run
Start RAG API:
```bash
# in engagemind-rag/
python main.py
```

Start fine-tune API:
```bash
# in engagemind-rag/
python fine_tune/fine_tune_app.py
```

Start worker:
```bash
# in engagemind-rag/
celery -A fine_tune.celery_config.app worker --pool=solo --concurrency=1 --loglevel=info
```

## API Endpoints
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

## Prompt Benchmark (Fixed 20 Queries)
Run benchmark with identical data/tokens for baseline and candidate:
```bash
source .venv/bin/activate
python test/run_prompt_benchmark.py run --label baseline --token <WITH_DOCS_JWT> --no-doc-token <NO_DOCS_JWT>
python test/run_prompt_benchmark.py run --label candidate --token <WITH_DOCS_JWT> --no-doc-token <NO_DOCS_JWT>
python test/run_prompt_benchmark.py compare --baseline test/benchmark_results/<baseline_file>.json --candidate test/benchmark_results/<candidate_file>.json
```

Benchmark case files:
- `test/prompt_benchmark_20.json`
- `test/prompt_benchmark_20_set2.json`

## Troubleshooting
- `Invalid or expired token` on RAG/fine-tune endpoints:
  - Ensure frontend token is valid and `JWT_SECRET` values match between backend and RAG `.env` files.
- Fine-tune `ObjectId is not JSON serializable`:
  - Fixed in current codepath by serializing ObjectIds before Celery/API response payloads.
  - If seen again, check worker/service mismatch or stale process.
- RAG `503` on health:
  - MongoDB unavailable.
- Fine-tune stuck or failing:
  - Verify Redis and Celery worker are running.
- OpenRouter errors:
  - Verify API key, model id, and `CHAT_PROVIDER=openrouter`.

## References
- Local component architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- System architecture: [../ARCHITECTURE.md](../ARCHITECTURE.md)
- Root runbook: [../README.md](../README.md)
