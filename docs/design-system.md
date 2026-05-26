# Design System (Phase 2)

## Benchmark takeaways

| App | Take |
|-----|------|
| Citymapper | Bold leg colors, disruption strip |
| DB Navigator | Official trust, clear times |
| Google Maps | Single primary CTA |
| Apple Maps | Calm dark, generous spacing |

## Tokens

```css
--accent: #00e87a;        /* D-Ticket green — WCAG on --bg */
--bg: #0a0e14;
--surface: #161d27;
--text: #e8edf4;
--muted: #8b9cb3;
--danger: #ff6b6b;
--warning: #ffc857;
--radius: 14px;
--tap: 48px;              /* min touch target */
--font: system-ui;
```

## Typography

| Role | Size | Weight |
|------|------|--------|
| H1 | 1.375rem | 700 |
| Time display | 1.5rem | 700 (tabular nums) |
| Body | 1rem | 400 |
| Caption | 0.75rem | 500 |

## Components

- **SearchCard** — origin, dest, time chips, primary CTA
- **DisruptionBanner** — warning strip when remarks present
- **ConfidenceBadge** — High / Medium / Low
- **JourneyTimeline** — colored leg badges
- **MapPanel** — sticky right (desktop), top (mobile)
- **ShortcutRow** — Home · Work · Recent

## Motion

- Skeleton shimmer 1.2s (respect `prefers-reduced-motion: reduce`)
- Panel fade-in 200ms on results

## Wireframe (mobile)

```text
[☰] FastRoute          [D-Ticket]
[ Home ] [ Work ]
From: [_______________] [GPS]
Suggestions: chips…
To:   [_______________]
[ Now +15 +30 +1h ]
[ FIND FASTEST ROUTE  ]
── disruption banner ──
Duration 47m · 2 transfers
[ Map                    ]
[ Step-by-step ▼         ]
```
