// src/app/architecture/components/StateMachinesSection.tsx
'use client';

import React, { useState } from 'react';

interface StateMachineTab {
  id: string;
  title: string;
  description: string;
  nodes: Array<{
    id: string;
    label: string;
    description: string;
    storyTag?: string;
    isTerminal?: boolean;
    color: string;
  }>;
  transitions: Array<{
    from: string;
    to: string;
    trigger: string;
  }>;
}

const MACHINES: StateMachineTab[] = [
  {
    id: 'quote',
    title: 'Quote Commercial Lifecycle',
    description: 'Enforces deal progression from initial draft through multi-step risk evaluations, customer negotiations, and commercial locking.',
    nodes: [
      { id: 'DRAFT', label: 'DRAFT', description: 'Rep edits line items and evaluates pricing waterfall.', storyTag: 'Story 1, 8', color: '#64748b' },
      { id: 'PENDING_APPROVAL', label: 'PENDING_APPROVAL', description: 'Risk score > 25 or margin floor breach triggers escalation.', storyTag: 'Story 2, 3', color: '#f59e0b' },
      { id: 'APPROVED', label: 'APPROVED', description: 'All required management steps authorized.', storyTag: 'Story 1, 2', color: '#10b981' },
      { id: 'REVISION_REQUESTED', label: 'REVISION', description: 'Manager returned quote for rep adjustment.', storyTag: 'Story 6', color: '#8b5cf6' },
      { id: 'UNDER_NEGOTIATION', label: 'UNDER_NEGOTIATION', description: 'Customer counter-offer submitted via portal.', storyTag: 'Story 5', color: '#06b6d4' },
      { id: 'CONFIRMED', label: 'CONFIRMED', description: 'Legally binding agreement. Spawns Order.', storyTag: 'Story 1', color: '#16a34a' },
      { id: 'FULFILLING', label: 'FULFILLING', description: 'Warehouse allocations in progress.', storyTag: 'Story 4', color: '#0284c7' },
      { id: 'COMPLETED', label: 'COMPLETED', description: 'All goods delivered and invoice paid.', storyTag: 'Story 1', isTerminal: true, color: '#15803d' },
      { id: 'CANCELLED', label: 'CANCELLED', description: 'Abandoned or terminated before execution.', isTerminal: true, color: '#ef4444' },
    ],
    transitions: [
      { from: 'DRAFT', to: 'PENDING_APPROVAL', trigger: 'Submit with Risk > 0' },
      { from: 'DRAFT', to: 'CONFIRMED', trigger: 'Auto-Approved (Low Risk)' },
      { from: 'PENDING_APPROVAL', to: 'APPROVED', trigger: 'Final Approver Signs Off' },
      { from: 'PENDING_APPROVAL', to: 'REVISION_REQUESTED', trigger: 'Manager Requests Revision' },
      { from: 'REVISION_REQUESTED', to: 'DRAFT', trigger: 'Rep Resets for Edit' },
      { from: 'APPROVED', to: 'UNDER_NEGOTIATION', trigger: 'Customer Counter-Offers' },
      { from: 'UNDER_NEGOTIATION', to: 'APPROVED', trigger: 'Counter Accepted by Engine' },
      { from: 'APPROVED', to: 'CONFIRMED', trigger: 'Customer Signs / Accepts' },
      { from: 'CONFIRMED', to: 'FULFILLING', trigger: 'Order Generation & Routing' },
      { from: 'FULFILLING', to: 'COMPLETED', trigger: 'Goods Received & Invoice Paid' },
      { from: 'DRAFT', to: 'CANCELLED', trigger: 'Rep Discards' },
    ],
  },
  {
    id: 'approval',
    title: 'Approval Request Lifecycle',
    description: 'Sequential governance workflow ensuring separation of duties between sales management and finance.',
    nodes: [
      { id: 'PENDING', label: 'PENDING', description: 'Assigned to reviewer role (Sales Manager or Finance).', storyTag: 'Story 2', color: '#f59e0b' },
      { id: 'APPROVED', label: 'APPROVED', description: 'Authorized with optional justification note.', storyTag: 'Story 2', isTerminal: true, color: '#16a34a' },
      { id: 'REJECTED', label: 'REJECTED', description: 'Deal permanently denied by reviewer.', isTerminal: true, color: '#ef4444' },
      { id: 'REVISION_REQUESTED', label: 'REVISION_REQUESTED', description: 'Returned with requested modifications.', storyTag: 'Story 6', isTerminal: true, color: '#8b5cf6' },
    ],
    transitions: [
      { from: 'PENDING', to: 'APPROVED', trigger: 'POST /api/approvals/:id/decide (APPROVE)' },
      { from: 'PENDING', to: 'REJECTED', trigger: 'POST /api/approvals/:id/decide (REJECT)' },
      { from: 'PENDING', to: 'REVISION_REQUESTED', trigger: 'POST /api/approvals/:id/decide (REQUEST_REVISION)' },
    ],
  },
  {
    id: 'order',
    title: 'Order Fulfillment Lifecycle',
    description: 'Coordinates multi-origin inventory allocation, warehouse packing, and shipping execution.',
    nodes: [
      { id: 'PENDING', label: 'PENDING', description: 'Order spawned, waiting for warehouse routing.', color: '#64748b' },
      { id: 'CONFIRMED', label: 'CONFIRMED', description: 'Stock reserved across target warehouses.', storyTag: 'Story 1', color: '#10b981' },
      { id: 'FULFILLING', label: 'FULFILLING', description: 'Warehouse allocations dispatched.', storyTag: 'Story 4', color: '#f59e0b' },
      { id: 'PARTIALLY_FULFILLED', label: 'PARTIALLY_FULFILLED', description: 'Some warehouse splits delivered.', storyTag: 'Story 4', color: '#06b6d4' },
      { id: 'FULFILLED', label: 'FULFILLED', description: 'All shipments confirmed delivered.', isTerminal: true, color: '#16a34a' },
      { id: 'CANCELLED', label: 'CANCELLED', description: 'Order cancelled, reserved inventory restored.', isTerminal: true, color: '#ef4444' },
    ],
    transitions: [
      { from: 'PENDING', to: 'CONFIRMED', trigger: 'Stock Reservation Confirmed' },
      { from: 'CONFIRMED', to: 'FULFILLING', trigger: 'allocateFulfillment() Splitting' },
      { from: 'FULFILLING', to: 'PARTIALLY_FULFILLED', trigger: 'Partial Warehouse Delivery' },
      { from: 'PARTIALLY_FULFILLED', to: 'FULFILLED', trigger: 'All Shipments Received' },
      { from: 'FULFILLING', to: 'FULFILLED', trigger: 'Single Origin Delivery' },
      { from: 'CONFIRMED', to: 'CANCELLED', trigger: 'Cancel & Return Stock' },
    ],
  },
  {
    id: 'billing',
    title: 'Invoice & Accounts Receivable Lifecycle',
    description: 'Manages billing issuance, payment tracking, aging, and automated delinquency flags.',
    nodes: [
      { id: 'DRAFT', label: 'DRAFT', description: 'Generated from order lines or recurring schedule.', color: '#64748b' },
      { id: 'ISSUED', label: 'ISSUED', description: 'Dispatched to customer with due date terms.', storyTag: 'Story 1', color: '#f59e0b' },
      { id: 'PAID', label: 'PAID', description: 'Payment recorded and matched against balance.', storyTag: 'Story 1', isTerminal: true, color: '#16a34a' },
      { id: 'CANCELLED', label: 'CANCELLED', description: 'Voided by finance or credit note replacement.', isTerminal: true, color: '#ef4444' },
    ],
    transitions: [
      { from: 'DRAFT', to: 'ISSUED', trigger: 'Finalize & Send to Customer' },
      { from: 'ISSUED', to: 'PAID', trigger: 'POST /api/invoices/:id/payments (Full Amount)' },
      { from: 'ISSUED', to: 'CANCELLED', trigger: 'Void / Credit Note Issued' },
    ],
  },
  {
    id: 'subscription',
    title: 'SaaS Subscription Lifecycle',
    description: 'Tracks recurring cloud contracts, billing schedules, and mid-term proration refunds.',
    nodes: [
      { id: 'ACTIVE', label: 'ACTIVE', description: 'Recurring service active, billing schedules generating.', storyTag: 'Story 7', color: '#16a34a' },
      { id: 'CANCELLED', label: 'CANCELLED', description: 'Terminated mid-term; proration credit note issued.', storyTag: 'Story 7', isTerminal: true, color: '#dc2626' },
      { id: 'EXPIRED', label: 'EXPIRED', description: 'Contract term completed without renewal.', isTerminal: true, color: '#64748b' },
    ],
    transitions: [
      { from: 'ACTIVE', to: 'CANCELLED', trigger: 'Mid-term cancel → calculateProration() → Credit Note' },
      { from: 'ACTIVE', to: 'EXPIRED', trigger: 'End date reached without renewal' },
    ],
  },
  {
    id: 'invite',
    title: 'Customer Onboarding Invite Lifecycle',
    description: 'Secures initial portal registration via expiring single-use invite tokens.',
    nodes: [
      { id: 'PENDING', label: 'PENDING', description: 'Invite generated with token; awaiting customer click.', storyTag: 'Story 5', color: '#f59e0b' },
      { id: 'ACCEPTED', label: 'ACCEPTED', description: 'Portal account created and bound to customer.', isTerminal: true, color: '#16a34a' },
      { id: 'EXPIRED', label: 'EXPIRED', description: '7-day validity window lapsed.', isTerminal: true, color: '#64748b' },
      { id: 'REVOKED', label: 'REVOKED', description: 'Superceded by newly generated invite token.', isTerminal: true, color: '#ef4444' },
    ],
    transitions: [
      { from: 'PENDING', to: 'ACCEPTED', trigger: 'POST /api/onboard/:token (Set Password)' },
      { from: 'PENDING', to: 'EXPIRED', trigger: 'Clock > 7 Days' },
      { from: 'PENDING', to: 'REVOKED', trigger: 'Sales Rep Generates New Invite' },
    ],
  },
];

export function StateMachinesSection() {
  const [selectedMachine, setSelectedMachine] = useState<string>('quote');

  const current = MACHINES.find(m => m.id === selectedMachine) || MACHINES[0];

  return (
    <section id="statemachines" className="card" style={{ border: '3px solid #000000', padding: '24px', background: '#ffffff' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Section 6.5 · Domain Lifecycles
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Domain State Machines
        </h2>
      </div>

      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
        DealFlow360 models all core business entities as strict finite state machines. State transitions are verified by service guards and executed atomically in the database layer.
      </p>

      {/* State Machine Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {MACHINES.map(m => {
          const isSelected = selectedMachine === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMachine(m.id)}
              style={{
                background: isSelected ? '#000000' : '#ffffff',
                color: isSelected ? '#ffffff' : '#000000',
                border: '2px solid #000000',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: isSelected ? '2px 2px 0px 0px #fbbf24' : 'none',
              }}
            >
              {m.title.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Machine Details & Interactive Canvas */}
      <div
        style={{
          border: '3px solid #000000',
          padding: '20px',
          background: '#f8fafc',
          boxShadow: '4px 4px 0px 0px #000000',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 4px 0', textTransform: 'uppercase' }}>
            {current.title}
          </h3>
          <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{current.description}</p>
        </div>

        {/* State Nodes Grid */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Lifecycle States ({current.nodes.length} States):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {current.nodes.map(node => (
              <div
                key={node.id}
                style={{
                  background: '#ffffff',
                  border: `2px solid ${node.color}`,
                  padding: '12px',
                  boxShadow: '2px 2px 0px 0px #000',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 900, fontSize: '12px', color: node.color }}>
                    {node.label}
                  </span>
                  {node.storyTag && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        background: '#fbbf24',
                        color: '#000',
                        padding: '1px 5px',
                        border: '1px solid #000',
                      }}
                    >
                      {node.storyTag}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>{node.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Allowed Transitions Table */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Valid State Transitions & Business Triggers:
          </div>
          <div className="table-wrap" style={{ border: '2px solid #000000', background: '#ffffff' }}>
            <table className="data-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th>From State</th>
                  <th>Direction</th>
                  <th>To Target State</th>
                  <th>Business Trigger / Service Action</th>
                </tr>
              </thead>
              <tbody>
                {current.transitions.map((t, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 800, fontFamily: 'monospace' }}>{t.from}</td>
                    <td style={{ textAlign: 'center', color: '#f59e0b', fontWeight: 900 }}>➔</td>
                    <td style={{ fontWeight: 800, fontFamily: 'monospace' }}>{t.to}</td>
                    <td style={{ color: '#334155' }}>{t.trigger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

