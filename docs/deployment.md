# Deployment

## Vercel (recommended)

1. Connect GitHub repo
2. Framework: **Other**
3. Build: `npm run build`
4. Output: `dist`
5. Deploy

`vercel.json` configures API routes + security headers.

## Local

```bash
npm install
npm run dev      # http://127.0.0.1:8765 — Vite proxy
# or
python3 serve.py # legacy proxy (no build)
```

## Environment (optional)

| Variable | Purpose |
|----------|---------|
| `VITE_PLAUSIBLE_DOMAIN` | Analytics |
| `VITE_SENTRY_DSN` | Error tracking |

## Rollback

Vercel → Deployments → Promote previous.
