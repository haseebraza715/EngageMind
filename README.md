# EngageMind

## Overview
EngageMind is a thesis project with four local services:
- `engagemind-frontend` (`:3000`): React UI for auth, chat, upload, and training.
- `engagemind-backend` (`:5003`): JWT auth and user/profile APIs.
- `engagemind-rag` RAG API (`:5001`): grounded chat and conversation persistence.
- `engagemind-rag` fine-tune API (`:5002`): GPT-2 LoRA training orchestration.

## Repository Structure
- [engagemind-frontend](./engagemind-frontend/)
- [engagemind-backend](./engagemind-backend/)
- [engagemind-rag](./engagemind-rag/)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [docs/THESIS_ALIGNMENT_PLAN.md](./docs/THESIS_ALIGNMENT_PLAN.md)
- [docs/DEFENSE_DEMO_CHECKLIST.md](./docs/DEFENSE_DEMO_CHECKLIST.md)

## Prerequisites
- Node.js `18+`
- Python `3.9+`
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`

## Quick Start (Recommended)
```bash
cd /Users/x/Downloads/Thesis/EngageMind
./scripts/run_all.sh
```

Expected local endpoints:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5003`
- RAG API: `http://localhost:5001`
- Fine-tune API: `http://localhost:5002`

Logs are written to `.runtime-logs/`.

## Manual Start
1. Backend
```bash
cd /Users/x/Downloads/Thesis/EngageMind/engagemind-backend
npm install
npm start
```

2. RAG API
```bash
cd /Users/x/Downloads/Thesis/EngageMind/engagemind-rag
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

3. Fine-tune API and Celery worker
```bash
cd /Users/x/Downloads/Thesis/EngageMind/engagemind-rag
source .venv/bin/activate
python fine_tune/fine_tune_app.py
celery -A fine_tune.celery_config.app worker --loglevel=info
```

4. Frontend
```bash
cd /Users/x/Downloads/Thesis/EngageMind/engagemind-frontend
npm install
npm start
```

## Usage Example
1. Create an account or log in.
2. Upload one or more documents.
3. Ask questions in chat and verify grounded responses.
4. Start a fine-tune job and monitor status in the UI.

## Verification
```bash
cd /Users/x/Downloads/Thesis/EngageMind
./scripts/verify_all.sh
```

For RAG/fine-tune specific validation, see [engagemind-rag/README.md](./engagemind-rag/README.md).

## Common Issues
- MongoDB down:
  - Backend OAuth flow may fail with Mongoose connection errors.
  - RAG/Backend health may return `503`.
- Redis down:
  - Fine-tune API can start, but queued training tasks fail.
- Ports already in use:
  - `run_all.sh` skips startup for occupied ports by design.

## Notes
- Keep `.env` values consistent across backend and RAG (`JWT_SECRET`, DB URLs, provider keys).
- Use the architecture docs for deeper service and data-flow details.
