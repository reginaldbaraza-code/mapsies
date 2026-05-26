# API Integration

## Proxies (browser → same origin)

| Path | Upstream |
|------|----------|
| `/api/db/*` | v6.db.transport.rest |
| `/api/db-v5/*` | v5.db.transport.rest |
| `/api/nominatim/*` | nominatim.openstreetmap.org |

## Direct (CORS allowed)

- `https://v6.bvg.transport.rest` — Berlin

## Journey parameters

- `deutschlandTicketConnectionsOnly=true`
- `nationalExpress=false` & `national=false`
- `polylines=true` & `remarks=true`

## Stop IDs

- DB nationwide: `80xxxxxx`
- BVG Berlin: `900xxxxx`

Never send DB ids to BVG.
