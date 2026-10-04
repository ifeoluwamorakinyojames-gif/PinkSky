# Keep Your Existing Login / Local Setup

If you already have a working Pink Sky folder on your laptop, do NOT delete its private files before using this master build.

This ZIP intentionally does not contain secrets.

Keep these from your current working project:
- `.env` — Sanity token, owner passwords and session secret
- `.local-data/` — local staff users/sessions, if present
- `node_modules/` — optional; keeping it avoids another `npm install`

Safest method:
1. Back up your current folder.
2. Extract this master ZIP over the current `PinkSky_Full_Project` folder and allow code files to overwrite.
3. Because this ZIP does not contain `.env`, `.local-data` or `node_modules`, your existing private/runtime files can remain in place.
4. Run `CHECK_PROJECT.cmd`.
5. Run `START_PINKSKY_LOCAL.cmd`.

Protected owner emails remain:
- ifeoluwamorakinyojames@gmail.com
- pinkskyccnt@gmail.com
