// src/app/architecture/components/SecurityRbacSection.tsx
'use client';

import React from 'react';
import { ROUTE_ROLE_MAP, API_ROUTE_ROLE_MAP } from '@/lib/auth/rbac.shared';
import type { UserRole } from '@/lib/types';

const ROLES: UserRole[] = ['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'CUSTOMER'];

const PERSONA_SUMMARIES: Record<UserRole, string> = {
  ADMIN: 'Full platform visibility, user onboarding, discount ceiling & approval rule authoring.',
  SALES_REP: 'Creates quotations, negotiates deals, evaluates pricing, views own assigned deal pipeline.',
  SALES_MANAGER: 'Commercial approval Step 1 sign-off, margin floor oversight, revision requests, deal health monitoring.',
  FINANCE: 'Approval Step 2 sign-off, AR invoicing, cash payment applications, SaaS proration credit notes.',
  OPERATIONS: 'Order fulfillment allocations, multi-warehouse stock reservation, shipment tracking.',
  CUSTOMER: 'Portal access via secure token to view live quotation, submit counter-offers, and sign agreements.',
};

export function SecurityRbacSection() {
  return (
    <section id="rbac" className="card" style={{ border: '3px solid #000000', padding: '24px', background: '#ffffff' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Section 6.8 · Access Control & Governance
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Security Architecture & RBAC Matrix
        </h2>
      </div>

      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
        DealFlow360 enforces strict <strong>Defense in Depth</strong> across 4 discrete authorization layers. Route permissions and API handlers are governed by centralized role maps rather than scattered component-level checks.
      </p>

      {/* 4 Layers of Defense in Depth */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '14px' }}>
          Four Layers of Defense in Depth
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#f8fafc', border: '2px solid #000', padding: '14px', boxShadow: '2px 2px 0px 0px #000' }}>
            <div style={{ fontWeight: 900, fontSize: '13px', color: '#0369a1', marginBottom: '4px' }}>
              Layer 1: Edge & Route Guards
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              In production, Next.js Edge Middleware validates the signed JWT cookie. In this demo, client-side <code>RouteGuard</code> inspects active session roles and renders 403 Forbidden screens.
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '2px solid #000', padding: '14px', boxShadow: '2px 2px 0px 0px #000' }}>
            <div style={{ fontWeight: 900, fontSize: '13px', color: '#7c3aed', marginBottom: '4px' }}>
              Layer 2: API Handler Enforcement
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              Every API route executes <code>requireRole(['ADMIN', ...])</code> prior to invoking business logic. Requests from unprivileged sessions are rejected immediately with 403 JSON envelopes.
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '2px solid #000', padding: '14px', boxShadow: '2px 2px 0px 0px #000' }}>
            <div style={{ fontWeight: 900, fontSize: '13px', color: '#059669', marginBottom: '4px' }}>
              Layer 3: Service-Level Scoping
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              Domain services enforce tenant and ownership boundaries. Sales reps query only quotes matching their <code>salesRepId</code>; portal customers access only quotes matching their <code>portalToken</code>.
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '2px solid #000', padding: '14px', boxShadow: '2px 2px 0px 0px #000' }}>
            <div style={{ fontWeight: 900, fontSize: '13px', color: '#d97706', marginBottom: '4px' }}>
              Layer 4: UI Navigation Filtering
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              Top navigation tabs and quick action links are filtered dynamically based on <code>NAV_ENTRIES</code> role definitions, preventing discovery of unpermitted workflows.
            </div>
          </div>
        </div>
      </div>

      {/* Real RBAC Matrix Table */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>
          Role-Based Access Control Matrix (Rendered from ROUTE_ROLE_MAP)
        </h3>

        <div className="table-wrap" style={{ border: '3px solid #000000', boxShadow: '4px 4px 0px 0px #000000' }}>
          <table className="data-table" style={{ fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#000000', color: '#ffffff' }}>
                <th style={{ color: '#fff' }}>Route Path</th>
                {ROLES.map(role => (
                  <th key={role} style={{ color: '#fff', textAlign: 'center' }}>
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(ROUTE_ROLE_MAP).map(([route, permittedRoles]) => (
                <tr key={route}>
                  <td style={{ fontWeight: 800, fontFamily: 'monospace' }}>{route}</td>
                  {ROLES.map(role => {
                    const hasAccess = permittedRoles.includes(role);
                    return (
                      <td key={role} style={{ textAlign: 'center' }}>
                        {hasAccess ? (
                          <span style={{ color: '#16a34a', fontWeight: 900, fontSize: '14px' }}>✓</span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Persona Capability Summary */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>
          Persona Responsibilities & Privilege Scope
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {ROLES.map(role => (
            <div
              key={role}
              style={{
                border: '2px solid #000000',
                background: '#f8fafc',
                padding: '12px',
                boxShadow: '2px 2px 0px 0px #000000',
              }}
            >
              <div style={{ fontWeight: 900, fontSize: '13px', marginBottom: '4px', color: '#0f172a' }}>
                {role}
              </div>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                {PERSONA_SUMMARIES[role]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Production vs Demo Auth Mechanisms (Concept Level) */}
      <div style={{ background: '#f8fafc', border: '2px solid #000000', padding: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 6px 0' }}>
          🔒 Authentication Mechanisms (Production vs. Demo)
        </h4>
        <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
          <strong>Production Implementation:</strong> Passwords hashed with bcrypt (salt rounds = 12); login issues HS256 JWT containing user ID and role with 8-hour expiry stored in an HttpOnly, Secure, SameSite=Lax cookie; rate-limited by IP via Redis sliding-window.<br />
          <strong>Demo Implementation:</strong> Fictional personas sign in instantly without crypto overhead; session stored in tab-scoped <code>sessionStorage</code>; zero real passwords, hashes, or secrets stored anywhere in static output.
        </div>
      </div>
    </section>
  );
}

