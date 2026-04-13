# EngageMind Backend

## Overview
Node.js/Express authentication and user service for thesis requirements.

Default URL: `http://localhost:5003`

## Responsibilities
- Register/login with JWT issuance.
- Protected profile read/update.
- Role-gated admin examples.
- Consistent auth error responses.
- Controlled DB-unavailable behavior (`503`) for stability.

## Required Environment
- `MONGO_URI` (default fallback: `mongodb://localhost:27017/engagemindbackend`)
- `JWT_SECRET` (required)
- `SESSION_SECRET` (optional; falls back to `JWT_SECRET`)
- `PORT` (optional; default `5003`)

## Setup and Run
```bash
cd /Users/x/Downloads/Thesis/EngageMind/engagemind-backend
npm install
npm start
```

## API Contract (Key Endpoints)
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile` (Bearer token)
- `PUT /auth/edit-profile` (Bearer token)
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /admin/protected` (Bearer token)
- `GET /admin/admin-data` (admin role)

## Thesis Alignment Notes
- Registration role is server-forced to `user` (no client role escalation).
- JWT payload is the identity contract used by frontend and downstream services.
- On MongoDB outage, routes fail fast with clear responses instead of hanging.

## Verification
```bash
npm test
```

## Troubleshooting
- `503 Database unavailable`: start MongoDB and retry.
- `500 JWT configuration missing`: set `JWT_SECRET` in backend `.env`.
- OAuth issues: verify Google credentials/callback URL if OAuth demo is needed.

## References
- Local architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Root runbook: [README.md](../README.md)
- System design: [ARCHITECTURE.md](../ARCHITECTURE.md)
