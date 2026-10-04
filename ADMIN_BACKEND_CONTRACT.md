# Pink Sky Admin Backend Contract

Custom admin route: `/#/admin`

## Authentication
- `GET /api/admin/session`
- `POST /api/admin/login`
- `POST /api/admin/logout`

## Team & Roles (owner only)
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

## Content resources
For `services`, `products`, `banners`, `articles`, `bookings`, `locations`, `programs`, `reviews`, `settings`:
- `GET /api/admin/<resource>`
- `POST /api/admin/<resource>`
- `PUT /api/admin/<resource>/:id`
- `DELETE /api/admin/<resource>/:id`

`settings` is a singleton stored in Sanity as document ID `siteSettings`.

## Images
- `POST /api/admin/uploads`

Images are uploaded to Sanity from the backend; the write token is never exposed to the browser.

## Public bookings
- `POST /api/bookings`

## Roles
- Owner: full access + Team & Roles
- Manager: content write access
- Editor: content write access
- Viewer: read-only

Protected owner emails:
- `ifeoluwamorakinyojames@gmail.com`
- `pinkskyccnt@gmail.com`
