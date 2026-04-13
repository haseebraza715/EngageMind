# EngageMind

## Overview
EngageMind is a thesis project that delivers:
- authenticated user interaction,
- per-user memory retention,
- document-grounded chat via RAG,
- GPT-2 adaptive training with live status monitoring.

## Repository Structure
- [engagemind-frontend](./engagemind-frontend/): React client app.
- [engagemind-backend](./engagemind-backend/): auth/profile API.
- [engagemind-rag](./engagemind-rag/): RAG API + fine-tune service.
- [docs/THESIS_ALIGNMENT_PLAN.md](./docs/THESIS_ALIGNMENT_PLAN.md): execution plan.
- [docs/DEFENSE_DEMO_CHECKLIST.md](./docs/DEFENSE_DEMO_CHECKLIST.md): demo checklist.
- [ARCHITECTURE.md](./ARCHITECTURE.md): system architecture.

## Setup
### Prerequisites
- Node.js (18+)
- Python (3.9+)
- MongoDB (`localhost:27017`)
- Redis (`localhost:6379`)

### Start Everything (Recommended)
```bash
./scripts/run_all.sh
```

### Manual Start
1. Backend
```bash
cd ./engagemind-backend && npm install && npm start
```
2. RAG API
```bash
cd ./engagemind-rag
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py
```
3. Fine-tune API + worker
```bash
cd ./engagemind-rag && source .venv/bin/activate
python fine_tune/fine_tune_app.py
celery -A fine_tune.celery_config.app worker --loglevel=info
```
4. Frontend
```bash
cd ./engagemind-frontend && npm install && npm start
```

## Usage
1. Register or log in.
2. Open chat and create/send messages.
3. Upload documents for RAG grounding.
4. Start GPT-2 fine-tuning and monitor status in the UI.

## Verification
```bash
./scripts/verify_all.sh
```

## Notes
- If MongoDB is unavailable, APIs return controlled `503`/unhealthy responses.
- If Redis is unavailable, fine-tune API starts but training task execution will fail until Redis is up.
