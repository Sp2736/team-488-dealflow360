// src/demo/ui/DemoBanner.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemoSession } from './useDemoSession';
import { getStore, reseedStore } from '../db/store';
import { withBasePath } from '@/lib/basePath';
import type { UserRole } from '@/lib/types';

export function DemoBanner() {
  const router = useRouter();
  const { user, switchPersona } = useDemoSession();

  const handleResetDemo = () => {
    if (confirm('Reset demo state to deterministic seed? This tab’s sessionStorage will be refreshed.')) {
      const store = getStore();
      reseedStore(store);
      window.location.reload();
    }
  };

  const handleToggleTrace = () => {
    window.dispatchEvent(new CustomEvent('df360:toggle-trace'));
  };

  const handleStartTour = () => {
    window.dispatchEvent(new CustomEvent('df360:start-tour'));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    switchPersona(newRole);
    const target = newRole === 'CUSTOMER' ? '/portal/quotation' : '/dashboard';
    router.push(withBasePath(target));
  };

  return (
    <div
      style={{
        background: '#fbbf24',
        color: '#000000',
        borderBottom: '2px solid #000000',
        padding: '6px 16px',
        fontSize: '12px',
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        zIndex: 60,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            background: '#000000',
            color: '#ffffff',
            padding: '1px 6px',
            fontSize: '10px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          DEMO MODE
        </span>
        <span style={{ fontSize: '11px', color: '#1f2937' }}>
          All data is fictional & running simulated client-side engines over sessionStorage
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Switch Persona */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#374151' }}>Persona:</span>
            <select
              value={user.role}
              onChange={handleRoleChange}
              style={{
                background: '#ffffff',
                color: '#000000',
                fontWeight: 900,
                fontSize: '11px',
                padding: '2px 6px',
                border: '1.5px solid #000000',
                cursor: 'pointer',
              }}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="SALES_REP">SALES_REP</option>
              <option value="SALES_MANAGER">SALES_MANAGER</option>
              <option value="FINANCE">FINANCE</option>
              <option value="OPERATIONS">OPERATIONS</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </select>
          </div>
        )}

        {/* Start Tour */}
        <button
          type="button"
          onClick={handleStartTour}
          style={{
            background: '#000000',
            color: '#ffffff',
            border: '1.5px solid #000000',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          ▶ Start Tour
        </button>

        {/* Backend Trace */}
        <button
          type="button"
          onClick={handleToggleTrace}
          style={{
            background: '#ffffff',
            color: '#000000',
            border: '1.5px solid #000000',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          ⚡ Trace
        </button>

        {/* Architecture */}
        <Link
          href={withBasePath('/architecture')}
          style={{
            background: '#ffffff',
            color: '#000000',
            border: '1.5px solid #000000',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 900,
            textDecoration: 'none',
          }}
        >
          📐 Architecture
        </Link>

        {/* Reset Demo */}
        <button
          type="button"
          onClick={handleResetDemo}
          style={{
            background: '#ffffff',
            color: '#dc2626',
            border: '1.5px solid #dc2626',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}

