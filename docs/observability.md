# Observability

## Plausible

```bash
VITE_PLAUSIBLE_DOMAIN=fastroute.app npm run build
```

Events: `route_search`, `perf`.

## Sentry

```bash
VITE_SENTRY_DSN=https://...@sentry.io/... npm run build
```

Optional dependency `@sentry/browser` — errors in routing captured with context.

## Dashboards

Plausible: searches, failure rate (`ok=0`), latency (`ms` prop).  
Sentry: `captureError` on route failures.
