# Pink Sky Project Structure

- `src/` — React/Vite public website and custom admin UI
- `src/admin/` — browser-side secure admin API client
- `src/sanity/` — public Sanity read clients and queries
- `server/local-admin-api.mjs` — local development admin/booking backend
- `functions/api/[[path]].ts` — Cloudflare Pages Functions production backend
- `migrations/0001_admin.sql` — Cloudflare D1 staff auth/session tables
- `schemaTypes/` — Sanity schemas
- `scripts/` — Sanity seed helpers
- `public/` — website assets, SEO files, Cloudflare redirects/headers
- `.env.example` — environment variable template (no secrets)
- `CLOUDFLARE_DEPLOY.md` — deployment instructions
- `FINAL_READINESS_CHECKLIST.md` — final launch checklist
