# Backend Setup

## Local development

The local secure API is `server/local-admin-api.mjs`.

It provides:
- Staff login/session
- Team & Roles
- Secure Sanity CRUD
- Secure Sanity image upload
- Public booking creation

Start it with:

`npm run dev:api`

Local staff/session data is stored in `.local-data/` and is ignored by Git.

## Cloudflare production

The production backend is `functions/api/[[path]].ts`.

It uses:
- Cloudflare Pages Functions for `/api/*`
- Cloudflare D1 for staff users and sessions
- Sanity for website content, images and bookings

See `CLOUDFLARE_DEPLOY.md`.
