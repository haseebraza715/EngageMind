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
./scripts/run_all.sh
```

Expected local endpoints:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5003`
- RAG API: `http://localhost:5001`
- Fine-tune API: `http://localhost:5002`

Logs are written to `.runtime-logs/`.

## Regenerate Thesis Diagrams
Mermaid sources are versioned under `docs/diagrams-src/`.

To render updated diagrams and sync thesis figures:
```bash
./scripts/export_thesis_diagrams.sh
```

This refreshes:
- `docs/diagrams-export/engagemind_architecture.(png|svg)`
- `docs/diagrams-export/diagram.(png|svg)`
- `../ELTE_FI_Thesis_Template/engagemind_architecture.png`
- `../ELTE_FI_Thesis_Template/diagram.png`

## Refresh Chapter 2 Screenshots
To regenerate thesis user-flow screenshots from the running frontend/backend/rag stack:
```bash
npx -y playwright@1.53.0 install chromium  # first run only
./scripts/capture_phase3_screenshots.sh
```

The capture flow automatically uploads a seeded `.txt` source document before chat examples,
so `chat_Example1.png`, `chat_Example2.png`, and `chat_Example3.png` show grounded, higher-quality answers.

This refreshes:
- `../ELTE_FI_Thesis_Template/landing_page.png`
- `../ELTE_FI_Thesis_Template/register.png`
- `../ELTE_FI_Thesis_Template/login_main.png`
- `../ELTE_FI_Thesis_Template/chat_interface.png`
- `../ELTE_FI_Thesis_Template/chat_Example1.png`
- `../ELTE_FI_Thesis_Template/chat_Example2.png`
- `../ELTE_FI_Thesis_Template/chat_Example3.png`

## Manual Start
1. Backend
```bash
cd engagemind-backend
npm install
npm start
```

2. RAG API
```bash
cd engagemind-rag
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

3. Fine-tune API and Celery worker
```bash
cd engagemind-rag
source .venv/bin/activate
python fine_tune/fine_tune_app.py
celery -A fine_tune.celery_config.app worker --pool=solo --concurrency=1 --loglevel=info
```

4. Frontend
```bash
cd engagemind-frontend
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
- Keep `.env` values consistent across backend and RAG.
- Must-match values: `JWT_SECRET` and Mongo connection/database targets (`MONGO_URI` vs `MONGO_URL`).
- For provider consistency in RAG, set `CHAT_PROVIDER` and corresponding provider keys in `engagemind-rag/.env`.
- Use the architecture docs for deeper service and data-flow details.
