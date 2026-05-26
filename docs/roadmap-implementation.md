# Implementation Timeline & Risks

## Timeline

| Week | Deliverable |
|------|-------------|
| 1 | v1.1 — TS, Vite, home/work, disruptions, CI ✅ |
| 2 | Plausible, Sentry, share URLs |
| 3 | Low-transfer mode, favorites |
| 4–6 | PWA offline shell, accessibility audit |
| 8+ | v2 features (make train, accessibility routing) |

## Risks

| Risk | Mitigation |
|------|------------|
| DB API 503 | BVG-first Berlin; user messaging |
| Proxy abuse | Rate limit (future middleware) |
| HAFAS API change | Abstract `TransitProvider` interface |
| No SLA on free APIs | Status indicator in UI |

## Phase 9 — Monetization

See `product-vision.md` — free core forever.
