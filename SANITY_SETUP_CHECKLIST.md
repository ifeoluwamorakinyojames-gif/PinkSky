# Sanity Setup Checklist

- [ ] Use the PinkSky Sanity project and `production` dataset
- [ ] Set `VITE_SANITY_PROJECT_ID`
- [ ] Set `VITE_SANITY_DATASET=production`
- [ ] Set server-side `SANITY_STUDIO_PROJECT_ID`
- [ ] Set server-side `SANITY_STUDIO_DATASET=production`
- [ ] Set server-side `SANITY_API_WRITE_TOKEN` with Editor access
- [ ] Never expose the write token with a `VITE_` prefix
- [ ] Add localhost to Sanity CORS for local development
- [ ] Add Cloudflare Pages preview domain to Sanity CORS
- [ ] Add final custom domain to Sanity CORS
- [ ] Confirm services read from Sanity
- [ ] Confirm banner create/edit appears on website
- [ ] Confirm product create/edit appears in Beauty Shop
- [ ] Confirm blog publish appears on Blog
- [ ] Confirm bookings are created in Sanity
- [ ] Confirm Website Settings uses document ID `siteSettings`
