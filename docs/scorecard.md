# Production Scorecard (post v1.2 pass)

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Reliability** | 6/10 → **7.5/10** | Transfer risk, reliability rank, retries; still dependent on transport.rest SLA |
| **Speed** | 5/10 → **7/10** | Lazy map chunk; dedup; SW shell — target <1.5s needs field metrics |
| **UX** | 6/10 → **8/10** | Make-connection, return, share URL, morning banner, DE disruptions |
| **Retention** | 4/10 → **7/10** | Home/work, morning, offline recent, PWA install |
| **Accessibility** | 5/10 → **6/10** | ARIA on new panels; needs audit for listbox |
| **Scalability** | 6/10 → **6.5/10** | Client-only; proxy rate limits still manual |

**Verdict:** Commute-ready beta. Not yet Citymapper-grade until live vehicle positions + push alerts.
