# Backend Architecture

## Purpose
The backend provides authentication and user management for the thesis app.

## Main Structure
- `server.js`: app bootstrap, middleware, route mounting.
- `routes/authRoutes.js`: register/login/profile/edit/reset flows.
- `routes/adminRoutes.js`: protected/admin sample routes.
- `middleware/authMiddleware.js`: JWT verification.
- `middleware/roleMiddleware.js`: role-based authorization.
- `models/userModel.js`: user schema and persistence model.
- `config/db.js`: MongoDB connection setup.
- `config/passport.js`: Google OAuth strategy wiring.

## Request Pipeline
```mermaid
flowchart LR
  C["Client"] --> S["Express Server"]
  S --> APUB["Auth Routes (public)\n/register /login /forgot /reset"]
  S --> APRO["Auth Routes (protected)\n/profile /edit-profile"]
  S --> AD["Admin Routes"]
  APRO --> M["authMiddleware (JWT)"]
  AD --> M
  AD --> RM["roleMiddleware (admin)"]
  APUB --> U["User Model (Mongoose)"]
  APRO --> U
  AD --> U
  U --> DB["MongoDB"]
```

## Auth Contract
```mermaid
sequenceDiagram
  participant C as Client
  participant B as Backend
  participant DB as MongoDB

  C->>B: POST /auth/login
  B->>DB: find user + verify password
  B-->>C: JWT (userId, username, role)
  C->>B: GET /auth/profile (Bearer JWT)
  B-->>C: user profile JSON
```

## Design Notes
- New accounts are always stored with `role: user`.
- On DB outage, backend returns controlled errors instead of hanging requests.
- Server startup waits for Mongo readiness before listening on `:5003`.
