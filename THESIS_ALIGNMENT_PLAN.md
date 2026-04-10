# EngageMind Thesis Alignment Plan (Strict Scope)

## Summary
- Goal: make the existing system fully defensible against the stated thesis requirements without adding non-thesis features.
- Strategy: fix only requirement-critical gaps, stabilize cross-service integration, validate end-to-end flows, and produce defense-ready documentation.
- Scope policy: strict thesis alignment only (no extra features, no redesign tracks).

## Locked Interfaces / Contracts
- Backend auth API remains under `/auth/*` and `/admin/*`.
- RAG chat/document APIs remain under:
  - `/api/conversations`
  - `/api/conversation`
  - `/api/conversation/:id/message`
  - `/api/upload`
  - `/api/ask`
- Fine-tune APIs remain under:
  - `/api/fine-tune`
  - `/api/fine-tune/status/:task_id`
- JWT-based identity is the only supported cross-service auth mechanism.

## In Scope (Non-Negotiable)
- Authenticated interaction.
- Per-user conversation memory retention.
- Adaptive GPT-2 training path (start + status monitoring).
- Real-time training status feedback.
- Frontend ↔ backend ↔ RAG/fine-tune integration stability.
- Requirement-traceable documentation and reproducible runbook.

## Out of Scope (Explicitly Frozen)
- Visual redesign or major UX overhaul.
- New admin capabilities beyond thesis requirements.
- New model families or alternative training tracks.
- Non-thesis showcase features.

## Phase Execution Plan

### Phase 1 — Scope Lock + Baseline Reproducibility
- Establish baseline run/test matrix.
- Record known failures and blockers by thesis impact.
- Exit criteria: reproducible checklist with pass/fail evidence.

### Phase 2 — Requirement-Critical Backend/RAG Corrections
- Fix auth/env consistency blockers.
- Remove endpoint-level security/contract inconsistencies.
- Correct per-user conversation consistency issues.
- Exit criteria: auth and protected route flow stable; per-user conversation CRUD + message flow stable.

### Phase 3 — Adaptive GPT-2 Training Path
- Repair current GPT-2 fine-tune runtime blockers.
- Normalize training status semantics to: `PENDING`, `PROGRESS`, `SUCCESS`, `FAILURE`.
- Ensure user-uploaded corpus is actually consumed.
- Exit criteria: authenticated user can start training and poll status without crashes.

### Phase 4 — Frontend Integration for Thesis Journey
- Unify token handling.
- Integrate minimal training trigger + live status polling.
- Remove dead/broken routes that harm demo credibility.
- Exit criteria: coherent flow: register/login → chat memory → upload → fine-tune start → status tracking.

### Phase 5 — Stability and Failure Handling
- Validate missing docs, invalid token, service outage, and invalid payload behavior.
- Add only minimal defensive handling needed for no-crash behavior.
- Exit criteria: controlled failures with understandable responses.

### Phase 6 — Requirement-Driven Testing
- Add and run tests for thesis-critical flows.
- Cover fine-tune start/status and no-corpus precondition.
- Exit criteria: critical workflow checks pass; residual risks documented.

### Phase 7 — Defense Documentation
- Provide thesis-specific architecture and runbook docs.
- Add requirement traceability and limitations sections.
- Exit criteria: reviewer can reproduce and evaluate requirements from docs.

### Phase 8 — Commit Strategy and Final Packaging
- Keep commits requirement-scoped and meaningful.
- Final gate: runbook + verification flow works without hidden manual workaround.
- Exit criteria: repository is clear, stable, and defense-ready.

## Acceptance Scenarios
- Auth success path: register, login, token persistence, profile fetch/edit, protected route access.
- Auth failure path: missing/invalid/expired token handling in frontend + backend.
- Memory retention: create conversation, exchange messages, reload, verify persistence per user.
- RAG ingestion/retrieval: upload supported docs, ask grounded queries, persist conversation updates.
- No-document behavior: controlled guidance response.
- Adaptive training: start fine-tuning with valid corpus, poll deterministic status, verify completion metadata.
- Adaptive training failure: empty/invalid corpus fails gracefully.
- Cross-service outage handling: readable, non-crashing failure behavior.

## Defaults and Assumptions
- GPT-2 adaptive training must be demonstrable in the app flow.
- Existing service ports remain default unless conflict requires documented override.
- MongoDB and Redis are required runtime prerequisites for full thesis demo.
- No non-thesis feature expansion is allowed.
