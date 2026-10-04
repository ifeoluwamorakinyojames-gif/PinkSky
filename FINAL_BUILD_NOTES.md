# Pink Sky Final Consolidated Build

This package consolidates the latest project version available in this chat.

Included:
- Main public website
- Custom Pink Sky admin
- Local admin backend
- Sanity read/write integration
- Protected owner login flow
- Product CRUD form
- Service CRUD form
- Banner CRUD form
- Secure image upload through backend to Sanity
- Banner frontend mapping that accepts `src` or `imageUrl`
- TypeScript Vite env declaration

Local run:
1. Copy `.env.example` to `.env` if `.env` is not already present.
2. Add your existing project values/secrets to `.env`.
3. Run `npm install` only if `node_modules` is not already present on the machine.
4. Run backend: `npm run dev:api`
5. Run frontend: `npm run dev:web`

Important:
- Do not commit `.env` or Sanity write tokens.
- This ZIP does not contain your private `.env` or runtime Sanity data.
- Sanity content remains in your Sanity project, not inside the ZIP.
