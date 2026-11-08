// src/app/architecture/components/Header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { withBasePath } from '@/lib/basePath';
import { useDemoSession } from '@/demo/ui/useDemoSession';

export function Header() {
  const { user } = useDemoSession();

  return (
    <header
      style={{
        borderBottom: '4px solid #000000',
        background: '#ffffff',
        boxShadow: '0 4px 0px 0px #000000',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Brand & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href={withBasePath(user ? (user.role === 'CUSTOMER' ? '/portal/quotation' : '/dashboard') : '/login')}
            style={{
              textDecoration: 'none',
              color: '#000000',
              fontWeight: 900,
              fontSize: '20px',
              letterSpacing: '-0.03em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>DEALFLOW360</span>
          </Link>
          <span
            style={{
              background: '#fbbf24',
              color: '#000000',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px 0px #000000',
              fontSize: '11px',
              fontWeight: 900,
              padding: '2px 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            ARCHITECTURE SHOWCASE
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#4b5563',
              background: '#f3f4f6',
              padding: '2px 8px',
              border: '1px solid #d1d5db',
            }}
          >
            Senior Engineer & Hiring Manager Briefing
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('df360:toggle-trace'))}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#1e293b',
              color: '#38bdf8',
              border: '2px solid #000000',
            }}
          >
            <span>⚡</span>
            <span>Live Trace</span>
          </button>

          <Link
            href={withBasePath(user ? (user.role === 'CUSTOMER' ? '/portal/quotation' : '/dashboard') : '/login')}
            className="btn btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 900,
              textDecoration: 'none',
              border: '2px solid #000000',
              boxShadow: '3px 3px 0px 0px #000000',
              background: '#fbbf24',
              color: '#000000',
            }}
          >
            {user ? '← Back to Live App' : '← Go to Login'}
          </Link>
        </div>
      </div>
    </header>
  );
}

