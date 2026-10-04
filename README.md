# Pink Sky Beauty & Wellness — Master Project

This is the single master project for Pink Sky Beauty & Wellness.

It contains:
- React/Vite public website
- Custom branded Pink Sky staff admin at `/#/admin`
- Local development backend
- Cloudflare Pages Functions production backend
- Sanity Content Lake integration
- Sanity schemas and Studio configuration
- Cloudflare D1 staff-auth database migration
- Booking API
- Secure image uploads to Sanity
- SEO/public files and Pink Sky media assets

## Protected owner logins

The protected owner emails are:
- `ifeoluwamorakinyojames@gmail.com`
- `pinkskyccnt@gmail.com`

Passwords are NOT included in the repository. Configure them in `.env` locally and as Cloudflare secrets before production deployment.

## Final architecture

### Public website
React + Vite.

### Website content and customer data
Sanity stores:
- Website Settings
- Services
- Products
- Rollover Banners
- Blog Articles
- Bookings
- Locations
- Memberships
- Packages
- Gift Cards
- Reviews
- Images

### Pink Sky custom admin
The custom staff dashboard manages all of the above through secure `/api/admin/*` endpoints. Staff never receive or see the Sanity write token.

### Staff authentication
Local development stores staff users/sessions in `.local-data`.

Cloudflare production stores staff users/sessions in **Cloudflare D1**. This is intentional: passwords and authentication sessions should not be stored in the public Sanity CMS dataset.

## Admin sections

Every normal admin section has a proper editable form:
- Website Settings
- Services
- Products
- Rollover Banners
- Blog
- Bookings
- Locations
- Memberships, Packages & Gift Cards
- Reviews
- Team & Roles

### Services
Controls name, slug, tagline, descriptions, price text, duration, service items, main image, gallery, display order and published status.

### Products
Controls name, brand, slug, category, prices, stock, SKU, GTIN/barcode, size, variants, descriptions, benefits, ingredients/specifications, how-to-use, up to 8 images, SEO fields, featured status, published status and order.

### Rollover Banners
Controls title, image, alt text, link, order, active status, start time and end time. Recommended image size: 1920 × 700.

### Blog
Controls title, slug, search intent, summary, article body, featured image, SEO title, meta description, publication time and published status.

### Bookings
Customer-submitted details remain read-only. Staff can update status and internal notes:
`Requested → Contacted → Confirmed → Completed / Cancelled`.

### Locations
Controls branch name, slug, address, note, phone, opening hours, image, order and active status.

### Memberships / Packages / Gift Cards
Controls title, type, description, price text, image, order and published status.

### Reviews
Controls genuine customer name, review, rating, source, display order and published status.

### Website Settings
Controls business name, tagline, phone numbers, WhatsApp, public email, social links, logo, SEO title and meta description.

### Team & Roles
Owner-only section. Owners can add staff and assign:
- Owner
- Manager
- Editor
- Viewer

The two protected owner emails cannot be demoted, suspended or deleted through normal admin controls.

## Local development

1. Copy `.env.example` to `.env`.
2. Fill in the Sanity project details, write token, protected owner passwords and session secret.
3. Install dependencies once:

```bash
npm install
```

4. Start the secure local API:

```bash
npm run dev:api
```

5. Start the website in another terminal:

```bash
npm run dev:web
```

6. Open:

```text
http://localhost:5173/#/admin
```

If Vite selects another port such as 5174, use that port.

## Environment variables

See `.env.example`.

Never commit `.env` and never put `SANITY_API_WRITE_TOKEN` in a `VITE_*` variable.

## Sanity

Sanity Studio is included for developer/owner maintenance, but normal Pink Sky staff do not need to use Sanity Studio. They use the branded Pink Sky admin.

Run Studio locally with:

```bash
npm run studio
```

## Cloudflare

The project is prepared for Cloudflare Pages + Pages Functions + D1.

Read:

`CLOUDFLARE_DEPLOY.md`

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

## Important production rule

The public website reads public content from Sanity. All writes go through the secure backend. Staff passwords/sessions are stored in Cloudflare D1, not Sanity.

## Final checks before domain launch

- Add final Cloudflare Pages/custom domain to Sanity CORS.
- Configure Cloudflare build variables and secrets.
- Create/bind the D1 database and apply `migrations/0001_admin.sql`.
- Confirm both protected owner accounts can log in.
- Test create/edit/delete in each admin content section.
- Test a public booking and booking status change.
- Test banner create → website refresh.
- Test product create → Beauty Shop.
- Test service edit → Services page.
- Test Website Settings → phone/WhatsApp/meta update.
- Update sitemap/canonical domain when the final domain is chosen.
