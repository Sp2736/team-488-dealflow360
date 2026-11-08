# 🚀 DealFlow360 – Interactive Demo Deployment

[![GitHub Pages Demo](https://img.shields.io/badge/Demo-Live%20on%20GitHub%20Pages-success?style=for-the-badge&logo=github)](https://swayam-ag.github.io/team-488-dealflow360/)
[![Architecture Showcase](https://img.shields.io/badge/Architecture-Interactive%20Walkthrough-blue?style=for-the-badge)](https://swayam-ag.github.io/team-488-dealflow360/architecture)
[![Pure Engines](https://img.shields.io/badge/Business%20Engines-11%20Pure%20Functions-amber?style=for-the-badge)](https://swayam-ag.github.io/team-488-dealflow360/architecture#engines)

> **Live Demo URL:** [https://swayam-ag.github.io/team-488-dealflow360/](https://swayam-ag.github.io/team-488-dealflow360/)  
> *(If self-hosting or reviewing locally, open `/team-488-dealflow360` under `http://localhost:3000/team-488-dealflow360`)*

Welcome to the **DealFlow360 Interactive Demo** branch (`gh-pages`). This branch contains a complete, self-contained, browser-side simulated deployment of DealFlow360 designed for senior engineers, hiring managers, and technical auditors.

---

## ⚡ How the Interactive Demo Works

* **1. Fail-Closed Client Interception:** A lightweight in-browser router traps all `window.fetch('/api/*')` network requests before they touch the network. Requests outside the static bundle are rejected, ensuring zero external backend dependency and zero server hosting cost.
* **2. The Exact Same Pure Business Engines:** All 11 core commercial business engines (`pricing`, `discount`, `margin`, `risk`, `approval`, `fulfillment`, `billing`, `upsell`, `negotiation`, `deal-health`, `ai-explanation`) run the **exact production TypeScript source code** unmodified inside the browser.
* **3. ACID In-Memory Store & Deterministic Seed:** A tab-scoped `sessionStorage` database provides transactional clone-on-write mutations, foreign-key cascade checks, and unique constraint enforcement. Seeded with 120 quotes, 60 products, 50 orders, and 70 invoices generated deterministically via PRNG (Mulberry32 seed = 360) in &lt;2 ms.

---

## 👥 The Six Personas

The login interface provides instant one-click access across all 6 roles with complete Role-Based Access Control (RBAC):

1. **ADMIN (Alex Morgan)** – Full system access; catalog authoring, discount ceilings, approval rule configuration, and system architecture audit.
2. **SALES_REP (Sarah Jenkins)** – Deal creation, real-time pricing calculations, upsell recommendations, and customer portal negotiation.
3. **SALES_MANAGER (David Kim)** – Commercial approval Step 1 sign-off, margin floor breach alerts, revision request loops, and deal health monitoring.
4. **FINANCE (Elena Rostova)** – Commercial approval Step 2 sign-off, accounts receivable invoicing, payment application, and SaaS proration credit notes.
5. **OPERATIONS (Marcus Vance)** – Order fulfillment hub, multi-warehouse stock split allocations, and delivery tracking.
6. **CUSTOMER (Rachel Green - Acme Global)** – External portal user; quote review, interactive counter-offer negotiation, and binding order confirmation.

---

## 🎯 Eight Scripted Story Scenarios

Explore realistic end-to-end commercial workflows with pre-seeded data records:

* **Story 1 (Happy Path to Cash):** Gold tier quote `QTE-2025-0001` under discount ceiling → 0 risk points → auto-approved → confirmed order `ORD-2025-0001` → invoice `INV-2025-0001` → payment.
* **Story 2 (Two-Step Approval Escalation):** High-discount quote `QTE-2025-0002` (28% requested) → HIGH risk → sequential sign-offs by Sales Manager (approved) then Finance (pending).
* **Story 3 (Margin Floor Breach Alert):** Quote `QTE-2025-0003` with thin peripheral margins breaches the 15% minimum margin floor → emergency escalation.
* **Story 4 (Multi-Warehouse Inventory Split):** Order lines exceeding single warehouse stock automatically split between Mumbai and Bengaluru facilities with calculated freight.
* **Story 5 (Customer Portal Counter-Offer):** Portal user counter-offers discount → `negotiation.engine` calculates compromise parity → auto-reapproval loop.
* **Story 6 (Manager Revision Workflow):** Sales Manager requests revisions with comments → quote moves back to `DRAFT` (Revision 2) for rep updates.
* **Story 7 (Subscription Proration & Credit Note):** Cancelled SaaS contract `sub_0001` triggers `billing.engine` day-level proration → generates Credit Note `cn_0001`.
* **Story 8 (Algorithmic Cart Upsells):** Workstation quote `QTE-2025-0008` triggers co-purchase recommendations while verifying margin floor compatibility.

---

## 📐 Architecture & Data Flow Showcase Module

Visit the dedicated public architecture briefing at [`/architecture`](https://swayam-ag.github.io/team-488-dealflow360/architecture) featuring:

* **6.1 System Overview:** Side-by-side production vs. demo architecture comparison, 9-point Real vs. Simulated honesty table, and tech stack chips.
* **6.2 Request Lifecycle:** 8-step animated flow of `POST /api/quotes/:id/evaluate` with an interactive "Run it live" button capturing real trace telemetry.
* **6.3 Business-Engine Catalog:** Inputs, outputs, live threshold constants, real code excerpts, and edge cases for all 11 pure engines.
* **6.4 Interactive Engine Playground:** Dynamic sliders for tier, discount %, quantity, and warehouse stock with live waterfall recalculations.
* **6.5 Domain State Machines:** Finite state machines for Quote, Approval, Order, Invoice, Subscription, and Invite lifecycles.
* **6.6 Data-Flow Diagrams:** 5 animated end-to-end data flows with live replay.
* **6.7 Database Schema:** 33 core models across 10 business domains with real-time live session row counts.
* **6.8 Security & RBAC:** Full permission matrix rendered from `ROUTE_ROLE_MAP` and defense-in-depth principles.
* **6.9 Engineering Notes:** Modular monolith rationale, pure engine benefits, and deterministic AI fallback reliability guarantees.

---

## 🛠 Local Build & Verification

```bash
# Navigate to frontend
cd frontend

# Set GitHub Pages base path
export NEXT_PUBLIC_BASE_PATH=/team-488-dealflow360

# Install dependencies
npm install

# Run type check & static build
npm run build

# Serve static output locally
npx serve out -s -p 3000
# Open http://localhost:3000/team-488-dealflow360
```

---

*Note on Database Configuration: The original repository README mentions PostgreSQL in an introductory blurb, but the active schema is configured for Microsoft SQL Server (`provider = "sqlserver"` in `schema.prisma`). In this demo, storage is simulated via tab-isolated browser `sessionStorage`.*
