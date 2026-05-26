# FastRoute — Deploy to Vercel

## Why Vercel?

The DB routing API blocks direct browser requests (CORS). FastRoute uses **Vercel serverless functions** in `/api` as a same-origin proxy — this is the production fix for "Failed to fetch".

## Deploy from GitHub

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
3. **Framework Preset:** Other (static site).
4. **Root Directory:** `.` (repo root).
5. **Build Command:** leave empty.
6. **Output Directory:** `.` (or leave default — Vercel serves `index.html` at root).
7. Click **Deploy**.

Vercel auto-detects `/api/*.js` as serverless functions. No `npm install` required.

## Environment variables (optional)

| Variable | Purpose |
|----------|---------|
| Firebase config in `src/app.js` | Recent searches sync to Firestore |
| Replace `YOUR_API_KEY` etc. | Only if you use Firebase |

No env vars are required for routing — the API proxy works out of the box.

## Local development

**Do not use** `python3 -m http.server` — `/api` routes will 404 and you'll see "Failed to fetch".

```bash
# Option A — matches Vercel (proxy + static)
python3 serve.py
# Open http://127.0.0.1:8765

# Option B — Vercel CLI (closest to production)
npm i -g vercel
vercel dev
```

## Project structure

```
index.html          # App shell
src/app.js          # Logic
src/styles.css      # Styles
api/db/[...path].js # Proxy → v6.db.transport.rest
api/db-v5/[...path].js
api/nominatim/[...path].js
vercel.json         # Headers & rewrites
serve.py            # Local dev proxy
```

## Firebase Hosting (alternative)

If you prefer Firebase instead of Vercel, you must add **Cloud Functions** to proxy `/api/db` — static Hosting alone cannot fix CORS. Vercel is the simpler path for this repo.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Failed to fetch | Use `serve.py` locally or deploy to Vercel |
| 503 / routing busy | DB API overloaded — retry in 30–60s |
| No route found | Use station names (e.g. `München Hbf`), pick autocomplete |
| Berlin works, other cities don't | DB national API down — wait and retry |

## Custom domain

Vercel → Project → Settings → Domains → add your domain.
