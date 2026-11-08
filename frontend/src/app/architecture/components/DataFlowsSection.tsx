// src/app/architecture/components/DataFlowsSection.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface DataFlow {
  id: string;
  title: string;
  actors: string[];
  apiRoutes: string[];
  services: string[];
  engines: string[];
  tablesRead: string[];
  tablesWritten: string[];
  auditAction: string;
  steps: Array<{
    seq: number;
    title: string;
    description: string;
    actor: string;
    subsystem: string;
  }>;
}

const DATA_FLOWS: DataFlow[] = [
  {
    id: 'quote_eval',
    title: '1. Quotation Evaluation & Multi-Step Approval Routing',
    actors: ['Sales Rep', 'Sales Manager', 'Finance Director'],
    apiRoutes: ['POST /api/quotes/:id/evaluate', 'POST /api/approvals/:id/decide'],
    services: ['QuotationsService', 'ApprovalsService'],
    engines: ['pricing.engine', 'discount.engine', 'margin.engine', 'risk.engine', 'approval.engine', 'deal-health.engine'],
    tablesRead: ['Quote', 'Customer', 'CustomerTier', 'Product', 'DiscountRule', 'ApprovalRule'],
    tablesWritten: ['Quote', 'ApprovalRequest', 'DealHealthEvent', 'Alert', 'AuditLog'],
    auditAction: 'QUOTE_EVALUATED & APPROVAL_REQUESTED',
    steps: [
      { seq: 1, title: 'Rep requests evaluation', actor: 'Sales Rep', subsystem: 'UI Client', description: 'Rep submits quote with 28% discount for enterprise customer.' },
      { seq: 2, title: 'Engine cascade calculation', actor: 'System', subsystem: 'Business Engines', description: 'Risk Engine tallies 45 points; Margin Engine computes 18% gross margin.' },
      { seq: 3, title: 'Multi-step approval generation', actor: 'System', subsystem: 'ApprovalsService', description: 'Creates sequential requests: Step 1 (Sales Manager), Step 2 (Finance).' },
      { seq: 4, title: 'Step 1 Manager approval', actor: 'Sales Manager', subsystem: 'Approvals Queue', description: 'Manager reviews justification, signs off Step 1; unlocks Step 2.' },
      { seq: 5, title: 'Step 2 Finance sign-off', actor: 'Finance', subsystem: 'Approvals Queue', description: 'Finance approves margin parameters; Quote status transitions to APPROVED.' },
    ],
  },
  {
    id: 'negotiation_flow',
    title: '2. Customer Portal Counter-Offer & Negotiation Loop',
    actors: ['Customer Representative', 'Sales Rep', 'Negotiation Engine'],
    apiRoutes: ['POST /api/negotiations', 'POST /api/negotiations/:id/messages'],
    services: ['NegotiationService', 'QuotationsService'],
    engines: ['negotiation.engine', 'margin.engine', 'risk.engine'],
    tablesRead: ['Negotiation', 'Quote', 'CustomerTier', 'Product'],
    tablesWritten: ['Negotiation', 'NegotiationMessage', 'Quote', 'AuditLog'],
    auditAction: 'COUNTER_OFFER_SUBMITTED & NEGOTIATION_EVALUATED',
    steps: [
      { seq: 1, title: 'Customer accesses portal', actor: 'Customer', subsystem: 'Customer Portal', description: 'Customer opens quote via secure portal token and proposes 14% discount.' },
      { seq: 2, title: 'Engine algorithmic assessment', actor: 'System', subsystem: 'negotiation.engine', description: 'Tests counter against customer tier ceiling and 15% margin floor.' },
      { seq: 3, title: 'Automated decision / counter', actor: 'System', subsystem: 'NegotiationService', description: 'Engine recommends midpoint compromise of 12.5% discount.' },
      { seq: 4, title: 'Bidirectional chat negotiation', actor: 'Sales Rep & Customer', subsystem: 'Negotiation Messages', description: 'Parties agree on final terms; quote moves back to APPROVED.' },
    ],
  },
  {
    id: 'fulfillment_flow',
    title: '3. Order Confirmation & Multi-Warehouse Fulfillment Split',
    actors: ['Customer', 'Operations Specialist', 'Fulfillment Engine'],
    apiRoutes: ['POST /api/orders', 'POST /api/orders/:id/fulfill'],
    services: ['OrdersService', 'FulfillmentService'],
    engines: ['fulfillment.engine'],
    tablesRead: ['Quote', 'Order', 'Warehouse', 'Inventory', 'Product'],
    tablesWritten: ['Order', 'OrderLine', 'Inventory', 'FulfillmentAllocation', 'AuditLog'],
    auditAction: 'ORDER_CONFIRMED & INVENTORY_ALLOCATED',
    steps: [
      { seq: 1, title: 'Customer confirms quote', actor: 'Customer', subsystem: 'Portal', description: 'Customer accepts commercial quote; legally binding order spawned.' },
      { seq: 2, title: 'Warehouse stock matrix scan', actor: 'System', subsystem: 'fulfillment.engine', description: 'Checks line quantities across Mumbai, Delhi, Bengaluru, and Pune facilities.' },
      { seq: 3, title: 'Split allocation calculation', actor: 'System', subsystem: 'fulfillment.engine', description: 'Splits line: 15 units allocated to Mumbai, 10 units allocated to Bengaluru.' },
      { seq: 4, title: 'Inventory decrement & routing', actor: 'Operations', subsystem: 'Fulfillment Hub', description: 'Updates physical stock and generates dispatch slips with freight costs.' },
    ],
  },
  {
    id: 'billing_flow',
    title: '4. Order-to-Invoice, Recurring SaaS & Mid-Term Proration',
    actors: ['Finance Controller', 'Billing Engine', 'Customer'],
    apiRoutes: ['POST /api/invoices', 'POST /api/invoices/:id/payments', 'POST /api/subscriptions/:id/cancel'],
    services: ['InvoicesService', 'BillingService'],
    engines: ['billing.engine'],
    tablesRead: ['Order', 'Invoice', 'Subscription', 'SubscriptionPlan'],
    tablesWritten: ['Invoice', 'InvoiceLine', 'Payment', 'CreditNote', 'BillingSchedule', 'Subscription', 'AuditLog'],
    auditAction: 'INVOICE_ISSUED & PRORATION_CREDIT_GENERATED',
    steps: [
      { seq: 1, title: 'Automated invoice generation', actor: 'System', subsystem: 'InvoicesService', description: 'Spawns AR invoice from confirmed order lines with GST tax breakdown.' },
      { seq: 2, title: 'Recurring subscription schedule', actor: 'System', subsystem: 'billing.engine', description: 'Creates 12 monthly billing schedule installments for SaaS plan lines.' },
      { seq: 3, title: 'Customer payment match', actor: 'Finance', subsystem: 'Invoicing UI', description: 'Records bank transfer payment of full total; status moves to PAID.' },
      { seq: 4, title: 'Mid-term cancellation proration', actor: 'Customer/Admin', subsystem: 'Subscriptions UI', description: 'Customer cancels day 14 of 30; Billing Engine calculates credit note refund.' },
    ],
  },
  {
    id: 'audit_flow',
    title: '5. Audit & Notification Fan-Out on Every Mutation',
    actors: ['Any Persona', 'Audit Service', 'Notification Service'],
    apiRoutes: ['Every Intercepted API Route Handler'],
    services: ['AuditService', 'NotificationService'],
    engines: ['deal-health.engine (signal detection)'],
    tablesRead: ['User', 'Quote', 'ApprovalRequest', 'Order'],
    tablesWritten: ['AuditLog', 'Notification', 'Alert'],
    auditAction: 'MUTATION_COMMITTED & NOTIFICATION_DISPATCHED',
    steps: [
      { seq: 1, title: 'State mutation occurs', actor: 'User', subsystem: 'Service Layer', description: 'Quote status, order fulfillment, or approval decision changes.' },
      { seq: 2, title: 'Before/after state capture', actor: 'System', subsystem: 'Store Snapshot', description: 'Captures JSON delta between previous and newly committed record state.' },
      { seq: 3, title: 'Immutable audit log written', actor: 'System', subsystem: 'AuditService', description: 'Appends structured entry with actor ID, timestamp, and entity reference.' },
      { seq: 4, title: 'Targeted notification dispatch', actor: 'System', subsystem: 'NotificationService', description: 'Fans out notifications to assigned sales reps and managers.' },
    ],
  },
];

export function DataFlowsSection() {
  const [selectedFlow, setSelectedFlow] = useState<string>('quote_eval');
  const [activeStepSeq, setActiveStepSeq] = useState<number>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  const current = DATA_FLOWS.find(f => f.id === selectedFlow) || DATA_FLOWS[0];

  useEffect(() => {
    setActiveStepSeq(1);
    setIsAutoPlaying(false);
  }, [selectedFlow]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStepSeq(prev => {
        if (prev >= current.steps.length) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [isAutoPlaying, current.steps.length]);

  const handleReplayLive = () => {
    setActiveStepSeq(1);
    setIsAutoPlaying(true);
  };

  return (
    <section id="dataflows" className="card" style={{ border: '3px solid #000000', padding: '24px', background: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Section 6.6 · Architectural Telemetry
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Data-Flow Diagrams (5 End-to-End Workflows)
          </h2>
        </div>

        <button
          type="button"
          onClick={handleReplayLive}
          className="btn btn-secondary"
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isAutoPlaying ? '#fbbf24' : '#1e293b',
            color: isAutoPlaying ? '#000000' : '#ffffff',
            border: '2px solid #000000',
          }}
        >
          <span>{isAutoPlaying ? '⏸' : '▶'}</span>
          <span>{isAutoPlaying ? 'Playing Flow…' : 'Replay Live Animation'}</span>
        </button>
      </div>

      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
        Inspect the actors, API endpoints, services, pure engines, and database tables touched throughout the 5 key business workflows of DealFlow360.
      </p>

      {/* Flow Selection Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {DATA_FLOWS.map(flow => {
          const isSelected = selectedFlow === flow.id;
          return (
            <button
              key={flow.id}
              type="button"
              onClick={() => setSelectedFlow(flow.id)}
              style={{
                background: isSelected ? '#000000' : '#ffffff',
                color: isSelected ? '#ffffff' : '#000000',
                border: '2px solid #000000',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: isSelected ? '2px 2px 0px 0px #fbbf24' : 'none',
              }}
            >
              {flow.title.split(' ')[0]} {flow.title.split(' ')[1]}
            </button>
          );
        })}
      </div>

      {/* Flow Metadata Banner */}
      <div
        style={{
          border: '3px solid #000000',
          padding: '20px',
          background: '#f8fafc',
          boxShadow: '4px 4px 0px 0px #000000',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 14px 0', textTransform: 'uppercase' }}>
          {current.title}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12px' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Actors Involved:</div>
            <div>{current.actors.join(' · ')}</div>
          </div>

          <div>
            <div style={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>API Routes:</div>
            <div style={{ fontFamily: 'monospace' }}>{current.apiRoutes.join(', ')}</div>
          </div>

          <div>
            <div style={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Engines Executed:</div>
            <div style={{ fontFamily: 'monospace', color: '#b45309' }}>{current.engines.join(', ')}</div>
          </div>

          <div>
            <div style={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Tables Mutated:</div>
            <div style={{ fontFamily: 'monospace', color: '#166534', fontWeight: 700 }}>{current.tablesWritten.join(', ')}</div>
          </div>
        </div>
      </div>

      {/* Animated Step-Through Visualizer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>
          Step-Through Sequence ({current.steps.length} Steps):
        </div>

        {current.steps.map(step => {
          const isActive = activeStepSeq === step.seq;
          const isPassed = activeStepSeq > step.seq;

          return (
            <div
              key={step.seq}
              onClick={() => setActiveStepSeq(step.seq)}
              style={{
                border: isActive ? '3px solid #000000' : '2px solid #cbd5e1',
                background: isActive ? '#fefce8' : isPassed ? '#f0fdf4' : '#ffffff',
                padding: '14px 18px',
                cursor: 'pointer',
                boxShadow: isActive ? '4px 4px 0px 0px #000000' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      background: isActive ? '#fbbf24' : isPassed ? '#16a34a' : '#94a3b8',
                      color: isPassed ? '#fff' : '#000',
                      fontWeight: 900,
                      fontSize: '11px',
                      padding: '2px 7px',
                      borderRadius: '999px',
                    }}
                  >
                    {step.seq}
                  </span>
                  <span style={{ fontWeight: 900, fontSize: '14px', color: '#0f172a' }}>{step.title}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                  <span style={{ background: '#e2e8f0', padding: '2px 6px', fontWeight: 700 }}>Actor: {step.actor}</span>
                  <span style={{ background: '#e2e8f0', padding: '2px 6px', fontWeight: 700 }}>Subsystem: {step.subsystem}</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 28px', lineHeight: 1.5 }}>
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

