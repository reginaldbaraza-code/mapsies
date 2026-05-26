# FastRoute

**The fastest Deutschlandticket route — decided in seconds.**

FastRoute is a mobile-first web app for planning public transit in Germany on a [Deutschlandticket](https://www.bahn.de/angebot/regional/dticket). It finds the quickest valid connection (no ICE/IC), surfaces a clear go/no-go decision, and highlights transfers, delays, and platform changes.

## Features

- **Decision-first UI** — primary action, departure urgency, and reliability score on one screen
- **D-Ticket only** — filters out long-distance ICE/IC; uses DB and BVG routing APIs
- **Commute shortcuts** — save Home and Work; morning commute banner
- **Disruptions & transfers** — delay notices, tight-transfer warnings, journey timeline
- **DE / EN** — language switcher on the home screen; preference saved locally
- **Shareable routes** — copy a link with origin, destination, and departure
- **PWA-ready** — installable shell with offline banner

## Quick start

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:8765](http://127.0.0.1:8765).

Use **DE | EN** in the masthead to switch language.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with API proxies (port 8765) |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Serve production build locally |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser smoke tests (Playwright) |
| `npm run check` | TypeScript check only |

## Architecture

```
index.html          # Shell + three screens (home / results / detail)
src/
  app.ts            # App bootstrap, routing, search flow
  i18n/             # German + English strings
  services/         # Places, journeys, commute analysis, storage
  ui/               # Router, decision engine, components
  lib/              # HTTP client, formatting, analytics
api/                # Vercel serverless proxies (DB, Nominatim)
```

Routing goes through `/api/db`, `/api/db-v5`, and `/api/nominatim` so the browser never hits third-party APIs directly (CORS). Berlin trips may also use the BVG endpoint in development.

## Deploy

**Vercel (recommended):** connect the repo, set build to `npm run build`, output `dist/`. See [`docs/deployment.md`](docs/deployment.md).

Optional environment variables:

| Variable | Purpose |
|----------|---------|
| `VITE_PLAUSIBLE_DOMAIN` | Privacy-friendly analytics |
| `VITE_SENTRY_DSN` | Error tracking |

## Documentation

| Doc | Topic |
|-----|--------|
| [`docs/architecture.md`](docs/architecture.md) | System overview |
| [`docs/api.md`](docs/api.md) | Proxies and transit APIs |
| [`docs/deployment.md`](docs/deployment.md) | Vercel and local setup |
| [`docs/testing.md`](docs/testing.md) | Test strategy |
| [`docs/brand.md`](docs/brand.md) | Visual identity (Route Spine) |
| [`docs/product-vision.md`](docs/product-vision.md) | Roadmap and principles |

## License

Private repository. All rights reserved unless otherwise noted.
