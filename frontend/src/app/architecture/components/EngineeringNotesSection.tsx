// src/app/architecture/components/EngineeringNotesSection.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { withBasePath } from '@/lib/basePath';
import { useDemoSession } from '@/demo/ui/useDemoSession';

export function EngineeringNotesSection() {
  const { user } = useDemoSession();

  return (
    <section id="notes" className="card" style={{ border: '3px solid #000000', padding: '24px', background: '#ffffff' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Section 6.9 · Engineering Decisions & Credibility
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Engineering Notes & Architectural Tradeoffs
        </h2>
      </div>

      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
        Honest, practical notes on the engineering principles, tradeoffs, safety mechanisms, and architectural philosophy governing DealFlow360:
      </p>

      {/* Grid of Engineering Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Note 1: Modular Monolith */}
        <div style={{ border: '2px solid #000000', padding: '16px', background: '#f8fafc', boxShadow: '3px 3px 0px 0px #000000' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0', color: '#0369a1' }}>
            1. Why a Modular Monolith?
          </h3>
          <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
            Premature microservices introduce distributed transaction overhead, network latency, and eventual-consistency nightmares across tightly coupled commercial operations (e.g. quote evaluation must reserve stock and check credit terms in one atomic boundary). A modular monolith with strict domain boundaries provides the developer velocity of a single repository while keeping business engines decoupled from transport and storage layers.
          </p>
        </div>

        {/* Note 2: Pure Engines */}
        <div style={{ border: '2px solid #000000', padding: '16px', background: '#f8fafc', boxShadow: '3px 3px 0px 0px #000000' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0', color: '#059669' }}>
            2. Pure Engines as the Core Foundation
          </h3>
          <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
            By constraining all business logic into pure functions (<code>pricing</code>, <code>discount</code>, <code>margin</code>, <code>risk</code>, <code>approval</code>, <code>deal-health</code>), logic is completely decoupled from I/O. This enabled this very GitHub Pages deployment: the exact same TypeScript files execute natively inside the browser, allowing prospective recruiters and senior engineers to evaluate authentic logic rather than shallow frontend mocks.
          </p>
        </div>

        {/* Note 3: Deterministic AI Fallback */}
        <div style={{ border: '2px solid #000000', padding: '16px', background: '#f8fafc', boxShadow: '3px 3px 0px 0px #000000' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0', color: '#d97706' }}>
            3. Deterministic AI Fallback & Safety
          </h3>
          <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
            In production, <code>explainWithAI</code> issues an LLM call wrapped in a strict 5-second timeout and Zod runtime schema validation. If the LLM provider experiences an outage, exceeds latency thresholds, or yields unparseable JSON, the system instantaneously falls back to <code>buildDeterministicExplanation()</code>. The user never sees a broken spinner, and business explanations remain grounded in verified rule thresholds.
          </p>
        </div>

        {/* Note 4: Browser Interceptor Architecture */}
        <div style={{ border: '2px solid #000000', padding: '16px', background: '#f8fafc', boxShadow: '3px 3px 0px 0px #000000' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0', color: '#7c3aed' }}>
            4. Fail-Closed Interceptor Architecture
          </h3>
          <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
            Our demo interceptor hooks <code>window.fetch</code> before any React components mount. It implements strict fail-closed isolation: any request outside same-origin static assets is rejected with a network-disabled TypeError and logged to our telemetry ring buffer. Data state resides in tab-isolated <code>sessionStorage</code> with ACID clone-on-write transaction rollback support.
          </p>
        </div>

        {/* Note 5: Testing Strategy */}
        <div style={{ border: '2px solid #000000', padding: '16px', background: '#f8fafc', boxShadow: '3px 3px 0px 0px #000000' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0', color: '#dc2626' }}>
            5. Testing & Seed Invariant Verification
          </h3>
          <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
            Testing relies on deterministic PRNG generation (Mulberry32 seed = 360). On boot, a master self-check validator executes in under 2 ms, verifying referential integrity across 33 relational tables, line-item sum consistency (<code>sum(lineTotal) == subtotal - discount</code>), and inventory non-negativity across all 120 seeded quotes.
          </p>
        </div>

        {/* Note 6: Known Limitations & Roadmap */}
        <div style={{ border: '2px solid #000000', padding: '16px', background: '#f8fafc', boxShadow: '3px 3px 0px 0px #000000' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0', color: '#0f172a' }}>
            6. Known Limitations & What I'd Do Next
          </h3>
          <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
            In production, we would introduce distributed Redis locking during high-frequency warehouse inventory allocation to prevent race conditions during flash sales. We would also add OpenTelemetry distributed tracing spans across the 8 service boundaries and transition from polling to WebSockets for real-time manager approval push notifications.
          </p>
        </div>
      </div>

      {/* Repository & Back to Demo Call to Action */}
      <div
        style={{
          background: '#000000',
          color: '#ffffff',
          padding: '24px',
          border: '3px solid #000000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 6px 0', color: '#fbbf24' }}>
            Ready to explore the live application?
          </h3>
          <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
            Switch personas, create quotations, trigger approvals, and review trace logs.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href="https://github.com/swayam-ag/team-488-dealflow360"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 800,
              textDecoration: 'none',
              background: '#1e293b',
              color: '#ffffff',
              border: '2px solid #ffffff',
            }}
          >
            GitHub Repository ↗
          </a>

          <Link
            href={withBasePath(user ? (user.role === 'CUSTOMER' ? '/portal/quotation' : '/dashboard') : '/login')}
            className="btn btn-primary"
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 900,
              textDecoration: 'none',
              background: '#fbbf24',
              color: '#000000',
              border: '2px solid #000000',
              boxShadow: '3px 3px 0px 0px #ffffff',
            }}
          >
            {user ? 'Return to DealFlow360 →' : 'Launch Interactive Demo →'}
          </Link>
        </div>
      </div>
    </section>
  );
}

