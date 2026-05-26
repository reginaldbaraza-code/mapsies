# FastRoute UI System v2.1 (v1.3 signature)

## Identity

**Decision engine** — not a map app, not a dashboard. One question per screen: *What do I do NOW?* → *Which route?* → *How do I get there?*

## Information hierarchy (PRIMARY / SECONDARY / BACKGROUND)

| Tier | Content | Components |
|------|---------|------------|
| **PRIMARY** | Recommended action, urgency, success %, fastest route times | `RouteDecisionCore` |
| **SECONDARY** | Disruptions, ≤2 subdued alts, step link | `DisruptionStrip`, `alt-subdued` |
| **BACKGROUND** | Map (opt-in only) | `map-layer.is-expanded` |

## Instant Decision Mode

1. Navigate to results + skeleton core (<300ms perceived)
2. API returns → **RouteDecisionCore** renders
3. +100ms → secondary fades in
4. Map only on “Karte anzeigen”

## State-based layout (`state-*` on RouteDecisionCore)

| State | Layout behavior |
|-------|-----------------|
| `urgent-leave` | Giant action, compressed route, pulsing accent bar |
| `late` | Action dominates, probability hidden, route dimmed |
| `missed-risk` | Dashed separator, action in accent |
| `low-reliability` | Faded probability ring |
| `night` | Reduced accent, calmer type |
| `calm` | Default balanced layout |

## Before → After

| Before | After |
|--------|-------|
| Two-column dashboard + dominant map | Full-screen decision flow; map as 30% background |
| Equal-weight cards | Single **RouteHero** + max 3 alternates |
| Badge soup (confidence, metrics, pills) | One **DisruptionStrip** + subtle reliability line |
| Sidebar recent | Inline **recent rail** on Home |
| Mixed EN/DE, generic chips | German, **StationChip**, opinionated hierarchy |

## Typography (IBM Plex Sans)

| Token | Size | Use |
|-------|------|-----|
| `--type-hero` | 32px / 600 | Route duration on hero |
| `--type-title` | 20px / 600 | Screen titles |
| `--type-body` | 16px / 400 | Body, inputs |
| `--type-caption` | 13px / 500 | Meta, labels |

## Spacing (8pt only)

`4 · 8 · 16 · 24 · 32 · 48` — no other values.

## Color

- Background `#06080c`
- Surface `#0c1016` / raised `#121820`
- Text `#f2f4f6` / secondary `#8b939e`
- **Accent only** `#00e87a` (+ 12% alpha fills)

No product-colored badges. Risk = typography weight + copy, not red/green/yellow chips.

## Components

| Component | Role |
|-----------|------|
| **RouteHero** | Dominant result: duration, dep→arr, transfers, tap → detail |
| **DepartureTimer** | “In 6 Min. los” urgency strip |
| **DisruptionStrip** | Thin contextual line, max 2 messages |
| **StationChip** | Suggestion / recent / Home·Work |
| **TransferTimeline** | Vertical guided path (detail) |

## Motion

| Animates | Never animates |
|----------|----------------|
| Screen enter (220ms, ease-out) | Map tiles |
| CTA press (scale 0.98) | Spinner decoration |
| Loading sheet slide | Badge colors |
| Hero reveal (opacity) | Autocomplete list bounce |

## Screens

1. **Home** — route stack, GPS, recent, one CTA  
2. **Results** — DepartureTimer + RouteHero + ≤3 alts  
3. **Detail** — TransferTimeline only
