# Red Team Review — Angry Commuter Edition

| Issue | Likelihood | Severity | Fix |
|-------|------------|----------|-----|
| DB API 503 nationwide → no route | High | Critical | BVG-first Berlin; retry; honest ETA copy |
| Wrong stop ID if user skips autocomplete | Medium | Critical | Force pick from list; coordinate fallback |
| "Fastest" = first result only, ignores reliability | High | High | Reliability score + rank alternatives |
| Tight transfer shown as "Zuverlässig" | High | High | Per-transfer risk + "Knapp" warnings |
| No "can I make this train" at station | High | High | Live buffer calc + walking pace |
| Stale departure (user leaves "Now" for hours) | Medium | High | Re-fetch on focus; dep min = now |
| Platform change buried in remarks | Medium | High | Gleis alerts in timeline |
| 170KB+ JS blocks 4G cold start | High | High | Lazy Leaflet chunk; SW precache shell |
| Map renders before layout → grey tiles | Medium | Medium | `invalidateSize` after results; lazy init |
| Empty API → generic error | Medium | Medium | Actionable DE copy + retry |
| No shareable link → can't send to partner | High | Medium | URL state `?from=&to=` |
| No return trip one-tap | High | Medium | Return button swaps + searches |
| Morning: re-type home→work daily | High | Medium | 6–11h banner + one tap |
| Offline: blank app | Medium | Medium | SW + offline recent list |
| Confidence false positive (remarks spam) | Medium | Medium | Human disruption summaries |
| Battery: map always animating | Low | Medium | Destroy polylines; lazy map |
| Mixed EN/DE UI | High | Low | German-first copy pass |
| No observability in prod | High | Medium | Plausible + Sentry env hooks |
| Proxy abuse / cost spike | Low | Medium | Cache TTL; dedup in-flight |
