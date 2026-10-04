# Pink Sky — Cloudflare Pages Deployment

This project is prepared for Cloudflare Pages on the free tier.

## What goes where

- Public website: Cloudflare Pages
- Secure API routes: Cloudflare Pages Functions (`functions/api/[[path]].ts`)
- Staff users + sessions: Cloudflare D1 (`DB` binding)
- Website content, bookings and images: Sanity
- Source code: GitHub

## 1. Create a free Cloudflare D1 database

Create a D1 database named `pinksky-admin` in Cloudflare.

Apply `migrations/0001_admin.sql` in the Cloudflare D1 console (or with Wrangler).

Bind the database to the Pages project with binding name:

`DB`

## 2. Cloudflare Pages build settings

Framework preset: Vite

Build command:

`npm run build`

Build output directory:

`dist`

## 3. Build-time variables

Set these in Cloudflare Pages → Settings → Environment variables:

- `VITE_SANITY_PROJECT_ID` = your Sanity project ID
- `VITE_SANITY_DATASET` = `production`

## 4. Server-side secrets / runtime variables

Set these for Pages Functions. Never expose them with `VITE_` prefixes:

- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET=production`
- `SANITY_API_WRITE_TOKEN`
- `PINKSKY_OWNER_EMAILS=ifeoluwamorakinyojames@gmail.com,pinkskyccnt@gmail.com`
- `PINKSKY_OWNER_NAME_1=Ifeoluwa Morakinyo James`
- `PINKSKY_OWNER_NAME_2=Pink Sky Owner`
- `PINKSKY_OWNER_PASSWORD_1=<strong password>`
- `PINKSKY_OWNER_PASSWORD_2=<strong password>`
- `PINKSKY_SESSION_SECRET=<long random secret>`

The two protected owner accounts are created automatically on first login if the passwords are configured.

## 5. Sanity CORS

In Sanity Manage → API → CORS origins, add:

- your Cloudflare Pages preview URL
- your final custom domain

Do not expose the write token to the browser.

## 6. Admin URL

After deployment:

`https://YOUR-DOMAIN/#/admin`

The custom Pink Sky admin continues to work on the same domain and communicates with `/api/admin/*` securely.

## 7. Important storage rule

Website content is stored in Sanity:
- Services
- Products
- Rollover banners
- Blog
- Bookings
- Locations
- Memberships / Packages / Gift Cards
- Reviews
- Website Settings

Staff passwords and sessions are intentionally NOT stored in Sanity. They are stored in Cloudflare D1 because authentication data should not live in the public CMS dataset.
