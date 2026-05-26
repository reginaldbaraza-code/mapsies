# Stack Recommendation (Phase 4)

## Decision: **Vite + TypeScript + Vanilla DOM** (no React)

### Why not React/Next.js?

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Vanilla + Vite | Smallest bundle, fast, maps easy | Manual DOM | **Chosen** |
| React + Vite | Ecosystem | +40kb+, overkill for one screen | No |
| Next.js | SSR, API routes | Heavier; we already have `/api` | No |
| SvelteKit | Great DX | Rewrite cost | v2 consider |

**Rationale:** Single primary flow (search → result). No complex client routing. Leaflet integrates cleanly. TypeScript gives safety without framework weight.

### Backend

| Layer | Choice |
|-------|--------|
| Production API | **Vercel serverless** `api/db`, `api/db-v5`, `api/nominatim` |
| Dev | **Vite proxy** + `serve.py` fallback |
| Future cache | Vercel Edge Config or Upstash Redis for journey cache |

### Maps

**Keep Leaflet** for v1.1 (free, works). Evaluate **MapLibre** v1.2 for performance at scale.

### State

**Typed module singleton** (`src/state.ts`) — not Redux. ~10 fields.

### Testing

| Tool | Use |
|------|-----|
| **Vitest** | Unit: stop IDs, journey sort, confidence |
| **Playwright** | E2E: Berlin route smoke |
| **TypeScript** | `strict: true` |

### Analytics & monitoring

| Tool | Use |
|------|-----|
| **Plausible** | Privacy-friendly page/events |
| **Sentry** | Errors (DSN via env) |

### Auth

**None for v1.** localStorage. Firebase Firestore optional sync only.

### PWA

`vite-plugin-pwa` in v1.2 — manifest added in v1.1.

### CI/CD

GitHub Actions → `npm run check` → deploy Vercel on `main`.

## Bundle budget

Target: **< 120 KB** gzip JS (excl. Leaflet CDN).
