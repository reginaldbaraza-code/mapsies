# Architecture

```text
┌─────────────┐     same-origin      ┌──────────────────┐
│   Browser   │ ──── /api/db/* ────► │ Vercel Function  │──► v6.db.transport.rest
│  (Vite SPA) │ ──── /api/nom/* ───► │  (proxy)         │──► nominatim.openstreetmap.org
│             │ ──── direct ────────► │ v6.bvg (CORS)    │
└─────────────┘                      └──────────────────┘
```

## Modules

| Module | Responsibility |
|--------|----------------|
| `src/main.ts` | Bootstrap |
| `src/app.ts` | UI wiring, form submit |
| `src/state.ts` | Session state |
| `src/config.ts` | Env + API bases |
| `src/lib/http.ts` | fetch, retry, cache |
| `src/lib/stop-ids.ts` | BVG/DB ID rules |
| `src/services/places.ts` | Geocoding + suggestions |
| `src/services/journey.ts` | Route fetch + sort |
| `src/services/disruptions.ts` | Remarks → banner |
| `src/services/storage.ts` | Recent, home, work |
| `src/ui/map.ts` | Leaflet |
| `src/constants/recommendations.ts` | Curated stops |

## Journey fetch order

1. Berlin bbox → BVG → DB v6 → DB v5  
2. Else → DB v6 → DB v5  
3. Client filter: no `nationalExpress` / `national` products

## Caching

- GET locations: 5 min in-memory (per session)
- GET journeys: no cache (time-sensitive)
