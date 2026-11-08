# DealFlow360 — GitHub Pages Static Demo Branch (`gh-pages`)

This branch is a static demo. Never merge into main. Sync from main with `git merge main` into this branch only.

## Overview
This branch contains a 100% browser-side simulated deployment of DealFlow360 designed for static hosting on GitHub Pages.
- **Client-Side Simulation**: All 8 domain services run directly in the browser over a reactive `sessionStorage` relational store.
- **Pure Business Logic Engines**: 11 pure TypeScript business logic engines (pricing, discount, margin, risk, approval, upsell, fulfillment, billing/proration, negotiation, deal health, AI explanation) execute identical logic to production.
- **Deterministic 100% Fictional Data Flood**: Flooded with rich, interconnected B2B quotation, fulfillment, and subscription data.
- **Zero External Network Requests**: Enforced via a fail-closed `window.fetch` interceptor with request tracing and zero secret leaks.

