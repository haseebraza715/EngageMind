# EngageMind Frontend

React client for thesis-critical flows:
- authentication-aware navigation,
- per-user chat workflow,
- document upload,
- GPT-2 fine-tuning trigger and status polling.

## Runs On
- Default URL: `http://localhost:3000`

## API Dependencies
- Auth API: `REACT_APP_AUTH_API_URL` (default `http://localhost:5003`)
- RAG API: `REACT_APP_RAG_API_URL` (default `http://localhost:5001`)
- Fine-tune API: `REACT_APP_FINE_TUNE_API_URL` (default `http://localhost:5002`)

## Commands
```bash
cd /Users/x/Downloads/Thesis/EngageMind/engagemind-frontend
npm install
npm start
npm run test:custom
npm run test:ci
npm run build
```

## Thesis-Relevant UI Flow
1. User logs in (JWT stored in `localStorage` under `token`).
2. User opens chat and accesses persisted per-user conversations.
3. User uploads documents through `/api/upload`.
4. User starts GPT-2 fine-tuning from sidebar panel.
5. UI polls `/api/fine-tune/status/:task_id` until terminal state.

## Notes
- Authorization headers are derived from the JWT token only (no hardcoded bearer token path).
- `/settings` dead route was removed from navbar actions to keep demo routing coherent.
