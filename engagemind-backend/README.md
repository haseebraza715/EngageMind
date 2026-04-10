# EngageMind Backend

Node/Express authentication service for thesis requirements.

## Responsibilities
- User registration/login.
- JWT issuance and protected route enforcement.
- Profile retrieval/edit.
- Admin guard examples (`/admin/*`).

## Default Port
- `5003`

## Required Env
- `MONGO_URI`
- `JWT_SECRET`
- `PORT` (optional)

## Run
```bash
cd /Users/x/Downloads/Thesis/EngageMind/engagemind-backend
npm install
npm start
```

## Test
```bash
npm test
```

## Key Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile` (protected)
- `PUT /auth/edit-profile` (protected)
- `GET /admin/protected` (protected)
- `GET /admin/admin-data` (admin role)

## Thesis Alignment Notes
- New registrations are forced to `role: user` to prevent client-side role escalation.
- JWT is the single source of authenticated identity passed to other services.
