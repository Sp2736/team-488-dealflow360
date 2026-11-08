// src/app/architecture/components/RequestLifecycleSection.tsx
'use client';

import React, { useState } from 'react';
import { getTraces, type TraceEntry } from '@/demo/server/trace';

interface LifecycleStep {
  step: number;
  phase: string;
  subsystem: string;
  sourceFile: string;
  description: string;
  detail: string;
}

const LIFECYCLE_STEPS: LifecycleStep[] = [
  {
    step: 1,
    phase: 'UI Trigger',
    subsystem: 'Client / TanStack Query',
    sourceFile: 'src/app/(dashboard)/quotations/[quotationId]/PageClient.tsx',
    description: 'User clicks "Evaluate Deal" on quote detail page or saves modified line item.',
    detail: 'Triggers handleEvaluate(quoteId) calling fetch("/api/quotes/qte_0001/evaluate", { method: "POST" }).',
  },
  {
    step: 2,
    phase: 'Fail-Closed Interception',
    subsystem: 'Demo Interceptor & Router',
    sourceFile: 'src/demo/interceptor.ts & router.ts',
    description: 'Patched window.fetch traps request, strips basePath, and matches registered route table.',
    detail: 'Validates route pattern POST /api/quotes/:id/evaluate, injects 35ms simulated latency, and creates trace record.',
  },
  {
    step: 3,
    phase: 'Session & RBAC Guard',
    subsystem: 'Auth & RBAC Layer',
    sourceFile: 'src/demo/server/session.ts',
    description: 'requireAuth() verifies active mock session and requireRole() validates role permissions.',
    detail: 'Ensures persona is SALES_REP, SALES_MANAGER, or ADMIN. Rejects unauthorized callers with 403 Forbidden.',
  },
  {
    step: 4,
    phase: 'Service Orchestration',
    subsystem: 'Quotations Service',
    sourceFile: 'src/demo/server/services/quotations.service.ts',
    description: 'Begins clone-on-write transaction on store; fetches quote, customer tier, product catalog, and lines.',
    detail: 'Coordinates the multi-engine cascade in deterministic order, passing output of each engine to the next.',
  },
  {
    step: 5,
    phase: 'Engine Cascade (6 Pure Engines)',
    subsystem: 'Pure Domain Engines Core',
    sourceFile: 'src/lib/engines/*.engine.ts',
    description: 'Executes pricing → discount → margin → risk → approval → deal-health in sequential dependency order.',
    detail: 'Computes line totals, detects margin floor breaches, tallies risk points (0-100), and assigns approval tiers.',
  },
  {
    step: 6,
    phase: 'Atomic Store Mutations',
    subsystem: 'ACID In-Memory Store',
    sourceFile: 'src/demo/db/store.ts',
    description: 'Commits state changes atomically across 4 tables: Quote, DealHealthEvent, Alert, and AuditLog.',
    detail: 'Updates quote.riskScore, inserts point-in-time deal health snapshot, dispatches high-risk alert, appends audit trail.',
  },
  {
    step: 7,
    phase: 'HTTP Response Delivery',
    subsystem: 'Mock Router / Interceptor',
    sourceFile: 'src/demo/server/router.ts',
    description: 'Serializes evaluated quote payload into a standard HTTP Response object with 200 OK JSON.',
    detail: 'Returns { success: true, quote, evaluation: { riskScore, riskLevel, requiredRoles, healthLevel } } in <10ms.',
  },
  {
    step: 8,
    phase: 'Cache Invalidation & UI Update',
    subsystem: 'TanStack Query Client',
    sourceFile: 'src/app/(dashboard)/quotations/[quotationId]/PageClient.tsx',
    description: 'React Query invalidates ["quotes", id] cache key; UI re-renders badges and activates AI Copilot.',
    detail: 'Displays updated Risk Badge (e.g. LOW 0 pts), enables "Explain This Deal Risk", and updates TopNav notification count.',
  },
];

export function RequestLifecycleSection() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [liveRunning, setLiveRunning] = useState(false);
  const [lastTrace, setLastTrace] = useState<TraceEntry | null>(null);

  const handleRunLive = async () => {
    setLiveRunning(true);
    try {
      const res = await fetch('/api/quotes/qte_0001/evaluate', {
        method: 'POST',
      });
      await res.json();
      const all = getTraces();
      if (all.length > 0) {
        setLastTrace(all[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLiveRunning(false);
    }
  };

  const current = LIFECYCLE_STEPS[activeStep - 1];

  return (
    <section id="lifecycle" className="card" style={{ border: '3px solid #000000', padding: '24px', background: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Section 6.2 · Trace & Flow
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Request Lifecycle: POST /api/quotes/:id/evaluate
          </h2>
        </div>

        {/* Live Execution Button */}
        <button
          type="button"
          onClick={handleRunLive}
          disabled={liveRunning}
          className="btn btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 900,
            background: '#fbbf24',
            color: '#000000',
            border: '2px solid #000000',
            boxShadow: '3px 3px 0px 0px #000000',
            cursor: liveRunning ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{liveRunning ? '⏳' : '▶'}</span>
          <span>{liveRunning ? 'Executing Live…' : 'Run It Live on qte_0001'}</span>
        </button>
      </div>

      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
        Step through the complete execution sequence of a commercial deal evaluation call. From client event to atomic store mutation, observe how zero-side-effect engines cooperate with transaction guards.
      </p>

      {/* Step Stepper Navigation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '6px',
          marginBottom: '20px',
        }}
      >
        {LIFECYCLE_STEPS.map(s => {
          const isSelected = activeStep === s.step;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step)}
              style={{
                background: isSelected ? '#000000' : '#f1f5f9',
                color: isSelected ? '#ffffff' : '#000000',
                border: '2px solid #000000',
                padding: '8px 4px',
                textAlign: 'center',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: '11px',
                boxShadow: isSelected ? '2px 2px 0px 0px #fbbf24' : 'none',
              }}
            >
              <div>Step {s.step}</div>
              <div style={{ fontSize: '9px', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.phase}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Detail Card */}
      <div
        style={{
          border: '3px solid #000000',
          padding: '20px',
          background: '#f8fafc',
          boxShadow: '4px 4px 0px 0px #000000',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          <div>
            <span
              style={{
                background: '#fbbf24',
                color: '#000',
                fontSize: '11px',
                fontWeight: 900,
                padding: '2px 8px',
                border: '1.5px solid #000',
                textTransform: 'uppercase',
                marginRight: '8px',
              }}
            >
              Step {current.step} of 8
            </span>
            <span style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase' }}>
              {current.phase} · {current.subsystem}
            </span>
          </div>

          <span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#e2e8f0', padding: '3px 8px', border: '1px solid #94a3b8' }}>
            Source: {current.sourceFile}
          </span>
        </div>

        <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          {current.description}
        </p>
        <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, background: '#ffffff', padding: '12px', border: '1px solid #cbd5e1' }}>
          <strong>Execution Detail:</strong> {current.detail}
        </div>
      </div>

      {/* Live Execution Telemetry Panel */}
      {lastTrace && (
        <div
          style={{
            border: '3px solid #16a34a',
            background: '#f0fdf4',
            padding: '16px',
            boxShadow: '4px 4px 0px 0px #16a34a',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <strong style={{ fontSize: '13px', textTransform: 'uppercase', color: '#166534' }}>
                Live Execution Captured in Buffer
              </strong>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: 800 }}>
              <span style={{ background: '#dcfce7', padding: '2px 6px', border: '1px solid #16a34a' }}>
                Status: {lastTrace.status} OK
              </span>
              <span style={{ background: '#dcfce7', padding: '2px 6px', border: '1px solid #16a34a' }}>
                Latency: {lastTrace.latencyMs} ms
              </span>
              <span style={{ background: '#dcfce7', padding: '2px 6px', border: '1px solid #16a34a' }}>
                Role: {lastTrace.actorRole || 'ANONYMOUS'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: 800, marginBottom: '4px', color: '#166534' }}>Tables Read:</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {lastTrace.tablesRead?.map(t => (
                  <span key={t} style={{ background: '#ffffff', border: '1px solid #86efac', padding: '2px 6px', fontFamily: 'monospace' }}>
                    {t}
                  </span>
                )) || <span style={{ color: '#64748b' }}>None</span>}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 800, marginBottom: '4px', color: '#166534' }}>Tables Written (Atomic Commit):</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {lastTrace.tablesWritten?.map(t => (
                  <span key={t} style={{ background: '#bbf7d0', border: '1.5px solid #16a34a', padding: '2px 6px', fontFamily: 'monospace', fontWeight: 700 }}>
                    {t}
                  </span>
                )) || <span style={{ color: '#64748b' }}>None</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

