# FastRoute — Product Vision & Roadmap

## Vision

**The fastest way to know you can get there on your Deutschlandticket — without ICE surprises.**

Trustworthy, mobile-first, works on bad U-Bahn tunnels Wi‑Fi.

## Principles

1. **D-Ticket only** — never show ICE/IC; filter in API + client.
2. **Fastest = minimum arrival time** for chosen departure.
3. **Clarity under stress** — big times, disruption banner, one primary action.
4. **No bloat** — commuters don't need social features.
5. **Privacy-first** — localStorage default; cloud opt-in.

## Personas

| Persona | Need |
|---------|------|
| Berlin commuter | Home ↔ work, delays, S/U-Bahn |
| Weekend traveler | City Hbf ↔ City Hbf nationwide |
| Tourist with D-Ticket | Suggestions, simple DE/EN |

## Roadmap

### Now (v1.1) — shipped in this pass

- TypeScript + Vite modular architecture
- API client: retry, cache, typed errors
- Home / Work shortcuts
- Disruption banner + route confidence
- PWA manifest (installable shell)
- CI: typecheck + E2E smoke
- Design system tokens

### Next (v1.2) — 2–3 weeks

- MapLibre GL (optional vector tiles)
- Low-transfer mode (`transfers=0` preference)
- Favorite stations
- Share URL with encoded trip
- Plausible analytics
- Sentry errors

### v2 — 1–2 months

- "Can I make this connection?" (countdown to departure)
- Walking speed toggle
- Elevator / step-free (HAFAS accessibility param)
- Night mode (filter products)
- Optional Firebase sync

### v3 — future

- Push (Web Push + cron disruptions)
- AI plain-language disruption summary (LLM on `remarks`)
- Premium: unlimited favorites, widgets

## Monetization (ethical)

| Model | Notes |
|-------|-------|
| **Free core** | Unlimited D-Ticket routing — never paywall |
| **Supporter** | €3/mo — custom themes, export calendar |
| **Donations** | Buy Me a Coffee / GitHub Sponsors |
| **B2B API** | White-label for housing/employers — not consumer |

No ads on map. No dark patterns.

## Success metrics

- Time to first route < 8s (p95)
- Route success rate > 92%
- D7 retention (localStorage cohort) > 25%
- Error rate < 3% of searches
