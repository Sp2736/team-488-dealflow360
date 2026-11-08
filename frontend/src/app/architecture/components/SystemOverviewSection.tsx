// src/app/architecture/components/SystemOverviewSection.tsx
'use client';

import React, { useState } from 'react';

export function SystemOverviewSection() {
  const [activeArchView, setActiveArchView] = useState<'side-by-side' | 'production' | 'demo'>('side-by-side');

  const techStack = [
    { name: 'Next.js', version: '16.3.4 (App Router, Static Export)', role: 'Web Framework & Prerender' },
    { name: 'React', version: '19.2.8', role: 'UI Library & Component Model' },
    { name: 'TypeScript', version: '5.7.3', role: 'Type Safety & Domain Modeling' },
    { name: 'TanStack Query', version: '^5.102.8', role: 'Client State & Cache Management' },
    { name: 'Zod', version: '^4.5.4', role: 'Runtime Contract & Payload Validation' },
    { name: 'Prisma Client', version: '6.3.1', role: 'ORM & Relational Modeling (SQL Server)' },
    { name: 'ExcelJS', version: '^4.4.0', role: 'In-Browser Spreadsheet Generation' },
    { name: 'jsPDF', version: '^4.2.1', role: 'In-Browser Document & PDF Generation' },
    { name: 'Tailwind CSS', version: '^4.0.0', role: 'Utility Styling & Custom Design Tokens' },
  ];

  const honestyRows = [
    {
      component: '11 Pure Business Engines',
      production: 'Node.js runtime / Next.js Server Actions',
      demo: 'Direct browser runtime (exact same TS source)',
      status: 'REAL (100% Identical)',
      detail: 'Pure TS functions have zero side effects, making them compile and execute identically in both environments.',
    },
    {
      component: 'Service & Orchestration Layer',
      production: '8 server-side services (Quotations, Orders, etc.)',
      demo: '8 ported services with atomic transaction semantics',
      status: 'REAL Logic / In-Memory State',
      detail: 'Multi-step orchestrations, inventory checks, and approval routing preserve full business semantics.',
    },
    {
      component: 'Role-Based Access Control (RBAC)',
      production: 'Middleware JWT cookie check + requireRole()',
      demo: 'RouteGuard component + mock handler requireRole()',
      status: 'REAL Rules',
      detail: 'Uses the exact same ROUTE_ROLE_MAP and 403 Forbidden enforcement logic.',
    },
    {
      component: 'Domain State Machines',
      production: 'Enforced via Prisma transactions and service guards',
      demo: 'Enforced in store with atomic clone-on-write',
      status: 'REAL State Transitions',
      detail: 'Transitions like DRAFT → PENDING_APPROVAL → CONFIRMED → FULFILLED strictly checked.',
    },
    {
      component: 'Relational Database',
      production: 'Microsoft SQL Server (schema.prisma provider)*',
      demo: 'sessionStorage ACID store with unique indexes & FKs',
      status: 'SIMULATED (In-Tab Storage)',
      detail: 'Clone-on-write rollbacks, foreign-key cascade deletes, and unique constraint validation in JS.',
    },
    {
      component: 'Authentication & Session',
      production: 'Signed HS256 JWT in HttpOnly secure cookie',
      demo: 'Unsigned JWT-shaped token in sessionStorage',
      status: 'SIMULATED (No Crypto)',
      detail: 'Allows instantaneous persona switching across 6 roles without server roundtrips.',
    },
    {
      component: 'AI Deal Copilot',
      production: 'LLM API (Gemini/OpenAI) with 5s timeout fallback',
      demo: 'Pure deterministic explanation engine fallback',
      status: 'SIMULATED (Pure Fallback)',
      detail: 'Uses the production fallback engine: 0 external API cost, 0 latency, 0 outage risk.',
    },
    {
      component: 'Transactional Email / Invites',
      production: 'SMTP / SendGrid dispatch',
      demo: 'In-browser HTML email preview modal with pool tokens',
      status: 'SIMULATED (Preview UI)',
      detail: 'Renders the exact production email markup directly for review.',
    },
    {
      component: 'PDF & Excel Report Exports',
      production: 'Server-side Node streams (pdfkit, exceljs)',
      demo: 'Dynamic in-browser client exports (jsPDF, ExcelJS)',
      status: 'REAL Files (Client-Generated)',
      detail: 'Produces real .xlsx spreadsheets and .pdf binary downloads in the user’s browser.',
    },
  ];

  return (
    <section id="overview" className="card" style={{ border: '3px solid #000000', padding: '24px', background: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Section 6.1 · Architecture Comparison
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            System Overview & Architecture
          </h2>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '4px', background: '#000000', padding: '4px', border: '2px solid #000' }}>
          {(['side-by-side', 'production', 'demo'] as const).map(view => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveArchView(view)}
              style={{
                background: activeArchView === view ? '#fbbf24' : '#1e293b',
                color: activeArchView === view ? '#000000' : '#ffffff',
                fontWeight: 900,
                fontSize: '11px',
                padding: '4px 10px',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {view.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
        DealFlow360 is structured as a <strong>modular monolith</strong> separating pure domain business logic, stateful orchestrations, and presentation. In this GitHub Pages deployment, the production architecture is faithfully mirrored client-side: the <em>exact same pure TypeScript business engines</em> run natively in your browser over an ACID-like in-memory store.
      </p>

      {/* Architecture Diagrams */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: activeArchView === 'side-by-side' ? 'repeat(auto-fit, minmax(420px, 1fr))' : '1fr',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* Production Architecture Box */}
        {(activeArchView === 'side-by-side' || activeArchView === 'production') && (
          <div
            style={{
              border: '3px solid #000000',
              padding: '20px',
              background: '#f8fafc',
              boxShadow: '4px 4px 0px 0px #000000',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🏢</span>
                <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
                  Production Architecture
                </h3>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, background: '#e2e8f0', padding: '2px 6px', border: '1px solid #000' }}>
                Full-Stack Node.js
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              {/* Layer 1: Client */}
              <div style={{ background: '#ffffff', border: '2px solid #000', padding: '10px' }}>
                <div style={{ fontWeight: 800, color: '#0369a1', marginBottom: '2px' }}>1. Presentation Tier (Browser)</div>
                <div>React 19, TanStack Query 5, Neo-Brutalist UI Components</div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: 900, color: '#64748b', fontSize: '14px' }}>↓ HTTP / HTTPS</div>

              {/* Layer 2: API Gateway */}
              <div style={{ background: '#ffffff', border: '2px solid #000', padding: '10px' }}>
                <div style={{ fontWeight: 800, color: '#7c3aed', marginBottom: '2px' }}>2. API & Security Layer</div>
                <div>Next.js Route Handlers (<code>/api/*</code>), HttpOnly JWT Auth Guard, RBAC Check</div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: 900, color: '#64748b', fontSize: '14px' }}>↓ Domain Invocation</div>

              {/* Layer 3: Services */}
              <div style={{ background: '#ffffff', border: '2px solid #000', padding: '10px' }}>
                <div style={{ fontWeight: 800, color: '#059669', marginBottom: '2px' }}>3. Service Layer (8 Services)</div>
                <div>Quotations, Approvals, Orders, Invoices, Subscriptions, Catalog, Audit, AI Copilot</div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: 900, color: '#64748b', fontSize: '14px' }}>↓ Pure Evaluation</div>

              {/* Layer 4: Pure Engines */}
              <div style={{ background: '#fef3c7', border: '2px solid #000', padding: '10px' }}>
                <div style={{ fontWeight: 900, color: '#b45309', marginBottom: '2px' }}>4. Business-Engine Core (11 Engines)</div>
                <div>Pricing, Discount, Margin, Risk, Approval, Upsell, Fulfillment, Billing, Negotiation, Deal Health</div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: 900, color: '#64748b', fontSize: '14px' }}>↓ Prisma ORM</div>

              {/* Layer 5: Database */}
              <div style={{ background: '#ffffff', border: '2px solid #000', padding: '10px' }}>
                <div style={{ fontWeight: 800, color: '#dc2626', marginBottom: '2px' }}>5. Persistence Layer</div>
                <div>Microsoft SQL Server 2022 (per <code>schema.prisma</code>) / ACID Relational Storage</div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', fontStyle: 'italic' }}>
              *Footnote: The original repository README mentions PostgreSQL in an introductory blurb, but the active schema is configured for SQL Server (`provider = &quot;sqlserver&quot;`).
            </div>
          </div>
        )}

        {/* Demo Architecture Box */}
        {(activeArchView === 'side-by-side' || activeArchView === 'demo') && (
          <div
            style={{
              border: '3px solid #000000',
              padding: '20px',
              background: '#fefce8',
              boxShadow: '4px 4px 0px 0px #000000',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
                  Interactive Demo Architecture
                </h3>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, background: '#fbbf24', color: '#000', padding: '2px 6px', border: '1px solid #000' }}>
                100% In-Browser
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              {/* Layer 1: Client */}
              <div style={{ background: '#ffffff', border: '2px solid #000', padding: '10px' }}>
                <div style={{ fontWeight: 800, color: '#0369a1', marginBottom: '2px' }}>1. Presentation Tier (Browser)</div>
                <div>Identical React 19 UI, TanStack Query cache, RouteGuard & persona switcher</div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: 900, color: '#64748b', fontSize: '14px' }}>↓ window.fetch()</div>

              {/* Layer 2: Interceptor & Router */}
              <div style={{ background: '#ffffff', border: '2px solid #000', padding: '10px' }}>
                <div style={{ fontWeight: 800, color: '#7c3aed', marginBottom: '2px' }}>2. Fail-Closed Interceptor & Router</div>
                <div>Intercepts all <code>/api/*</code> calls, ring-buffer telemetry logger, simulated network delay (20–120ms)</div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: 900, color: '#64748b', fontSize: '14px' }}>↓ Mock Handler</div>

              {/* Layer 3: Services */}
              <div style={{ background: '#ffffff', border: '2px solid #000', padding: '10px' }}>
                <div style={{ fontWeight: 800, color: '#059669', marginBottom: '2px' }}>3. Ported Service Layer</div>
                <div>Identical multi-step business logic operating on transactional store snapshots</div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: 900, color: '#64748b', fontSize: '14px' }}>↓ Real Code Execution</div>

              {/* Layer 4: Pure Engines */}
              <div style={{ background: '#fef3c7', border: '2px solid #000', padding: '10px' }}>
                <div style={{ fontWeight: 900, color: '#b45309', marginBottom: '2px' }}>4. The Exact Same Pure Engines</div>
                <div>Zero mocking. Real risk scores, discount ceilings, margin calculations, and approvals</div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: 900, color: '#64748b', fontSize: '14px' }}>↓ Atomic Commit</div>

              {/* Layer 5: Store */}
              <div style={{ background: '#ffffff', border: '2px solid #000', padding: '10px' }}>
                <div style={{ fontWeight: 800, color: '#dc2626', marginBottom: '2px' }}>5. In-Memory Relational Store</div>
                <div>ACID clone-on-write store over sessionStorage. Deterministic 33-table seed hydrated in &lt;400ms</div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', fontStyle: 'italic' }}>
              State is private to your browser tab, surviving page reloads without external databases or server processes.
            </div>
          </div>
        )}
      </div>

      {/* Real vs Simulated Honesty Table */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>
          Real vs. Simulated Capabilities (Honesty Table)
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
          Senior engineers and technical recruiters value total clarity on what is genuine code versus simulated infrastructure:
        </p>

        <div className="table-wrap" style={{ border: '3px solid #000000', boxShadow: '4px 4px 0px 0px #000000' }}>
          <table className="data-table">
            <thead>
              <tr style={{ background: '#000000', color: '#ffffff' }}>
                <th style={{ color: '#fff' }}>Component</th>
                <th style={{ color: '#fff' }}>Production Architecture</th>
                <th style={{ color: '#fff' }}>Demo Implementation</th>
                <th style={{ color: '#fff' }}>Fidelity Status</th>
              </tr>
            </thead>
            <tbody>
              {honestyRows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 900 }}>{row.component}</td>
                  <td style={{ fontSize: '12px', color: '#475569' }}>{row.production}</td>
                  <td style={{ fontSize: '12px', color: '#0f172a', fontWeight: 600 }}>{row.demo}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        padding: '2px 6px',
                        border: '1.5px solid #000',
                        background: row.status.startsWith('REAL') ? '#dcfce7' : '#fef3c7',
                        color: row.status.startsWith('REAL') ? '#166534' : '#9a3412',
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tech Stack Chips */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>
          Production Tech Stack & Tooling
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {techStack.map((tech, i) => (
            <div
              key={i}
              style={{
                background: '#f8fafc',
                border: '2px solid #000000',
                padding: '10px 14px',
                boxShadow: '2px 2px 0px 0px #000000',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                <span style={{ fontWeight: 900, fontSize: '14px' }}>{tech.name}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>{tech.version}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>{tech.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

