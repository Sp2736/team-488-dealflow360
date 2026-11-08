'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/basePath';
import type { UserRole } from '@/lib/types';

interface PersonaInfo {
  role: UserRole;
  title: string;
  name: string;
  email: string;
  description: string;
  badgeBg: string;
  badgeFg: string;
  unlockedRoutes: string[];
}

const PERSONAS: PersonaInfo[] = [
  {
    role: 'ADMIN',
    title: 'System Administrator',
    name: 'Alex Morgan',
    email: 'admin@acme-corp.example.com',
    description: 'Configure multi-tier discount rules, risk thresholds, approval matrix, and warehouse nodes.',
    badgeBg: '#1e293b',
    badgeFg: '#ffffff',
    unlockedRoutes: ['/admin', '/admin/discount-config', '/admin/upsell-rules', '/admin/warehouses'],
  },
  {
    role: 'SALES_REP',
    title: 'Senior Account Executive',
    name: 'Sarah Jenkins',
    email: 'sales@acme-corp.example.com',
    description: 'Draft quotes, resolve product pricing, run discount engine, evaluate deal health and pipeline.',
    badgeBg: '#0284c7',
    badgeFg: '#ffffff',
    unlockedRoutes: ['/quotations', '/quotations/new', '/customers', '/dashboard'],
  },
  {
    role: 'SALES_MANAGER',
    title: 'Commercial Sales Director',
    name: 'David Kim',
    email: 'manager@acme-corp.example.com',
    description: 'Review high-risk quotations, manage margin floor alerts, request revisions, and grant exceptions.',
    badgeBg: '#7c3aed',
    badgeFg: '#ffffff',
    unlockedRoutes: ['/approvals', '/deal-health', '/analytics/dashboard', '/quotations'],
  },
  {
    role: 'FINANCE',
    title: 'Finance & Controller',
    name: 'Elena Rostova',
    email: 'finance@acme-corp.example.com',
    description: '2nd-step commercial approval, credit terms, invoice reconciliation, and subscription proration.',
    badgeBg: '#059669',
    badgeFg: '#ffffff',
    unlockedRoutes: ['/invoices', '/subscriptions', '/reports', '/approvals'],
  },
  {
    role: 'OPERATIONS',
    title: 'Logistics & Warehouse Lead',
    name: 'Marcus Vance',
    email: 'ops@acme-corp.example.com',
    description: 'Multi-warehouse stock allocation, order fulfillment dispatch, and inventory level management.',
    badgeBg: '#d97706',
    badgeFg: '#ffffff',
    unlockedRoutes: ['/fulfillment', '/orders', '/dashboard'],
  },
  {
    role: 'CUSTOMER',
    title: 'Flagship Portal Buyer',
    name: 'Rachel Green',
    email: 'customer@globex.example.com',
    description: 'Review live quotation QTE-2025-0001, negotiate terms via live counter-offers, and confirm orders.',
    badgeBg: '#dc2626',
    badgeFg: '#ffffff',
    unlockedRoutes: ['/portal/quotation', '/portal/messages', '/portal/profile'],
  },
];

export default function LoginPage() {
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (role: UserRole, startTour = false) => {
    setLoadingRole(role);
    setError(null);

    try {
      const res = await fetch(withBasePath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: role, role }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        if (startTour && typeof window !== 'undefined') {
          window.sessionStorage.setItem('df360.demo.startTour', role);
        }
        const target = role === 'CUSTOMER' ? '/portal/quotation' : '/dashboard';
        router.push(withBasePath(target));
        router.refresh();
      } else {
        setError(data.error?.message || data.error || 'Failed to authenticate persona');
      }
    } catch {
      setError('Simulated backend error: failed to switch persona');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg, #fdfbf7)' }}>
      {/* Top Header */}
      <header
        style={{
          background: 'var(--fg, #000000)',
          color: '#ffffff',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '4px solid #000000',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 900, fontSize: '24px', letterSpacing: '-0.03em' }}>
            DEALFLOW360
          </span>
          <span
            style={{
              background: '#fbbf24',
              color: '#000000',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 900,
              border: '2px solid #000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            INTERACTIVE DEMO
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href={withBasePath('/architecture')}
            style={{
              background: '#ffffff',
              color: '#000000',
              fontWeight: 800,
              fontSize: '12px',
              padding: '6px 14px',
              border: '2px solid #000000',
              boxShadow: '3px 3px 0px 0px #000000',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            Architecture & Specs →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        {/* Banner Section */}
        <div
          style={{
            background: '#ffffff',
            border: '4px solid #000000',
            boxShadow: '8px 8px 0px 0px #000000',
            padding: '28px 32px',
            marginBottom: '36px',
          }}
        >
          <div style={{ display: 'inline-block', background: '#000000', color: '#ffffff', fontWeight: 800, fontSize: '11px', padding: '3px 8px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Pure Client-Side Simulated Stack
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            Select an Authorized Demo Persona
          </h1>
          <p style={{ fontSize: '15px', color: '#4b5563', margin: 0, lineHeight: 1.6, maxWidth: '850px' }}>
            This application runs 100% in your browser. All API requests are intercepted client-side, executing real pure business logic engines (pricing resolution, margin calculation, risk scoring, multi-warehouse fulfillment, and approval routing) over an in-memory <code>sessionStorage</code> database. All company profiles, financial figures, and identities are completely fictional.
          </p>
          {error && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#fee2e2', border: '2px solid #ef4444', color: '#991b1b', fontWeight: 700, fontSize: '14px' }}>
              {error}
            </div>
          )}
        </div>

        {/* Persona Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {PERSONAS.map(p => {
            const isLoading = loadingRole === p.role;
            return (
              <div
                key={p.role}
                style={{
                  background: '#ffffff',
                  border: '3px solid #000000',
                  boxShadow: '6px 6px 0px 0px #000000',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.1s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span
                      style={{
                        background: p.badgeBg,
                        color: p.badgeFg,
                        fontWeight: 900,
                        fontSize: '11px',
                        padding: '3px 8px',
                        border: '2px solid #000000',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {p.role}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280' }}>
                      {p.email}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 4px 0' }}>
                    {p.name}
                  </h2>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '14px' }}>
                    {p.title}
                  </div>

                  <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.5, margin: '0 0 16px 0', minHeight: '60px' }}>
                    {p.description}
                  </p>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>
                      Primary Workspaces:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {p.unlockedRoutes.map(r => (
                        <span
                          key={r}
                          style={{
                            background: '#f3f4f6',
                            border: '1.5px solid #000000',
                            padding: '2px 6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleLogin(p.role, false)}
                    style={{
                      flex: 1,
                      background: '#000000',
                      color: '#ffffff',
                      border: '2px solid #000000',
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      boxShadow: '3px 3px 0px 0px #000000',
                      textTransform: 'uppercase',
                    }}
                  >
                    {isLoading ? 'Booting…' : `Log In as ${p.role}`}
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleLogin(p.role, true)}
                    style={{
                      background: '#ffffff',
                      color: '#000000',
                      border: '2px solid #000000',
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      boxShadow: '3px 3px 0px 0px #000000',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Tour
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
