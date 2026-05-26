# FastRoute — Production Audit (Phase 1)

**Scope:** Deutschlandticket-valid fastest routing · Germany-wide · Vercel deploy  
**Date:** 2026-05-26 · **Roles:** PM, PO, Eng, UX, QA, DevOps, Security, A11y

## Executive summary

The app solves a real problem with a lean stack, but it is **prototype-grade**: monolithic JS, no tests, no observability, fragile API coupling, and UX gaps under stress. Highest risks are **API reliability**, **stop-ID mismatches** (partially fixed), and **no automated quality gates**.

---

## Priority-ranked findings

| P | Area | Severity | Problem | Why it matters | Fix | Impact |
|---|------|----------|---------|----------------|-----|--------|
| P0 | API | Critical | DB `transport.rest` frequent 503 / no SLA | Nationwide search fails | BVG-first Berlin; retry + cache; status page messaging | High |
| P0 | Architecture | Critical | Browser→HAFAS CORS without proxy | "Failed to fetch" | Vercel `/api/*` + `serve.py` / Vite proxy | High |
| P0 | Data | Critical | BVG vs DB stop IDs mixed | `LOCATION not found` | Separate `bvgId`/`dbId`; API-aware `locationParams` | High |
| P0 | QA | Critical | Zero automated tests | Regressions ship silently | Playwright E2E + Vitest unit | High |
| P1 | Engineering | High | 900-line monolithic `app.js` | Unmaintainable | TypeScript modules + Vite | High |
| P1 | UX | High | Raw JSON errors shown to users | Trust loss | Parsed HAFAS errors, human copy | Med |
| P1 | Performance | High | No request dedup/cache | Slow + rate limits | TTL cache, debounce, single-flight | Med |
| P1 | Observability | High | No Sentry/analytics | Blind in prod | Plausible + Sentry (opt-in) | Med |
| P1 | Security | High | Firebase keys in client source | Key exposure if real keys committed | Env vars on Vercel; rules locked | Med |
| P2 | UX | Medium | No home/work shortcuts | Daily commuter friction | localStorage presets | Med |
| P2 | UX | Medium | Disruptions buried in leg text | Missed delays | Disruption banner + confidence | Med |
| P2 | A11y | Medium | Incomplete ARIA on autocomplete | Screen reader gaps | `role="listbox"`, `aria-activedescendant` | Med |
| P2 | Mobile | Medium | Map height fixed small on mobile | Hard to read route | `min-height: 40dvh`, sticky CTA | Med |
| P2 | PWA | Medium | Not installable | No offline shell | manifest + SW cache static | Med |
| P3 | SEO | Low | Minimal meta/OG | Poor share previews | meta description, OG tags | Low |
| P3 | i18n | Low | Mixed EN/DE copy | Confusing locals | `lang=de`, consistent DE | Low |
| P3 | Cost | Low | Unbounded proxy traffic | Vercel bill risk | Edge cache, rate limit per IP | Low |

---

## 1. Architecture audit

**Current:** Static HTML + ES module CDN Firebase + Leaflet + `/api` Vercel proxies.

**Problems:** No build step (until Vite), no env separation, Firebase optional but inlined.

**Recommendation:** Vite + TypeScript → `dist/`; keep Vercel serverless proxies; optional Firebase via `import.meta.env`.

---

## 2. UX audit

**Jobs-to-be-done:** "Fastest D-Ticket route NOW" — partially met.

**Gaps vs Citymapper/DB Navigator:** No disruption hero, no platform info, no "make this connection", no home/work, weak empty states.

**Recommendation:** Single-screen flow: Search → Result (map + summary + disruptions) → Details. 48px tap targets, skeleton loaders, DE copy.

---

## 3. Accessibility audit

- ✅ Focus visible on buttons (needs audit)
- ⚠️ Autocomplete keyboard nav partial
- ❌ No `prefers-reduced-motion`
- ❌ Color-only delay indicators (add text)

**Target:** WCAG 2.2 AA — contrast on `#00ff88` on white fails; on dark bg OK.

---

## 4. Security audit

- Proxies: no auth (OK for public read-only HAFAS)
- Risk: open proxy abuse → add rate limiting (Vercel firewall / middleware)
- Firebase rules: create-only `routes` — good
- No secrets in repo if placeholders remain

---

## 5. Performance audit

- No bundle (good for size); many CDN round-trips (Firebase unused = waste if not configured)
- Map: multiple GeoJSON layers — OK for <10 legs
- Target Lighthouse 95+ after Vite tree-shake + drop unused Firebase when disabled

---

## 6–14. (Abbreviated)

| Audit | Status | Action |
|-------|--------|--------|
| Mobile | Good grid; improve thumb zone | Bottom sticky "Find route" |
| API reliability | Poor for DB | Multi-provider fallback chain |
| Scalability | Fine for MVP | Edge cache GET journeys 30s |
| Cost | Low until scale | Monitor Vercel invocations |
| SEO | Weak | `robots.txt`, sitemap |
| Errors | Improved | Central `TransitError` class |
| Observability | None | Sentry + structured console |
| Code quality | Monolith | TS strict modules |
| State | Global `state` object | Typed store module |

---

## What NOT to build (anti-bloat)

- Full user accounts (v2)
- Ticket purchase / affiliate checkout (v2)
- AI delay prediction (needs data pipeline)
- Push notifications (needs backend + consent)
- Live departure boards (separate product)
