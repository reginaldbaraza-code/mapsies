# FastRoute Brand Identity v1.4

## Positioning

**A calm, authoritative decision engine for Deutschlandticket travel.**

Not a map app. Not a dashboard. A **decision product**.

## Visual signature: Route Spine

Every route is a **vertical spine**:

| Variant | Meaning |
|---------|---------|
| `primary` | Glowing green spine — recommended decision |
| `subdued` | Thin grey spine — secondary alternative |
| `risk` | Amber break nodes — transfer attention |

- **Transit** = solid glowing segment  
- **Walk** = dim segment  
- **Transfer** = gap or amber/red dot  

Recognizable in screenshots without reading copy.

## Typography (Inter only)

| Role | Rule |
|------|------|
| Times | Always dominant (`.time-dominant`) |
| Labels | Minimal — `.type-caption` |
| Actions | Verb-first: "Jetzt los", "S5 nehmen", "Zum Gleis gehen" |

## Color behavior

| Token | Use |
|-------|-----|
| `--fr-green` | Recommended spine + success + primary CTA |
| `--fr-amber` | Transfer risk, disruption strip |
| `--fr-red` | Missed departure only |

Color **confirms** hierarchy; layout **creates** it.

## Rail Glide motion

`cubic-bezier(0.2, 0.8, 0.2, 1)` — calm, mechanical, no bounce.

- Spine draws top-to-bottom on decision reveal  
- Core appears immediately  
- Secondary fades +140ms  
- Map only on user request  

## Components

| Component | Tier |
|-----------|------|
| `RouteDecisionCore` | PRIMARY |
| `RouteSpine` | PRIMARY visual |
| `DepartureTimer` | PRIMARY urgency |
| `DisruptionStrip` | SECONDARY |
| `alt-subdued` + mini spine | SECONDARY |
| Map | BACKGROUND |

## Files

- `src/styles/brand-tokens.css` — tokens  
- `src/styles/brand.css` — spine + motion  
- `src/ui/components/route-spine.ts` — spine renderer  
