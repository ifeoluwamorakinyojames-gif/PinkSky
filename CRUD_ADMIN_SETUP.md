# Pink Sky Custom Admin CRUD

This build adds real forms to the custom Pink Sky admin.

The admin now supports:
- Website Settings
- Services
- Products
- Rollover Banners
- Blog
- Bookings and status workflow
- Locations
- Memberships / Packages / Gift Cards
- Reviews
- Team & Roles
- Secure image upload to Sanity through the backend

Flow:

Custom `/admin` → secure `/api/admin/*` backend → Sanity → public website

The Sanity write token remains server-side only.

For local development:
1. `npm run dev:api`
2. `npm run dev:web`
3. Open `http://localhost:5173/#/admin`

Sanity writes must show `ENABLED` in CMD 1.
