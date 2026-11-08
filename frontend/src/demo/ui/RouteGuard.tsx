// src/demo/ui/RouteGuard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDemoSession } from './useDemoSession';
import { getRequiredRolesForPath } from '@/lib/auth/rbac.shared';
import { withBasePath } from '@/lib/basePath';
import type { UserRole } from '@/lib/types';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const rawPathname = usePathname() || '/';
  const { user, isAuthenticated, switchPersona } = useDemoSession();
  const [checking, setChecking] = useState(true);

  // Normalize pathname by stripping basePath if present
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  let pathname = rawPathname;
  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || '/';
  }

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace(withBasePath('/login'));
      return;
    }
    setChecking(false);
  }, [isAuthenticated, router]);

  if (checking || !isAuthenticated || !user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '24px', border: '3px solid #000', background: '#fff', boxShadow: '4px 4px 0px 0px #000', fontWeight: 800 }}>
          Verifying persona permissions…
        </div>
      </div>
    );
  }

  const requiredRoles = getRequiredRolesForPath(pathname);

  // If page requires specific roles and current role is not permitted
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    const homeTarget = user.role === 'CUSTOMER' ? '/portal/quotation' : '/dashboard';

    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            background: '#ffffff',
            border: '4px solid #000000',
            boxShadow: '8px 8px 0px 0px #000000',
            padding: '32px',
          }}
        >
          <div style={{ display: 'inline-block', background: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 900, padding: '3px 8px', border: '2px solid #000', textTransform: 'uppercase', marginBottom: '16px' }}>
            403 · Access Restricted
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Persona Cannot Access This Workspace
          </h1>

          <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.6, margin: '0 0 20px 0' }}>
            Your current persona <strong>{user.name}</strong> ({user.role}) is restricted from opening{' '}
            <code style={{ background: '#f3f4f6', padding: '2px 6px', border: '1px solid #000', fontFamily: 'monospace' }}>{pathname}</code>.
          </p>

          <div style={{ background: '#f9fafb', border: '2px solid #000', padding: '16px', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>
              Authorized Roles for this Workspace:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {requiredRoles.map(r => (
                <span
                  key={r}
                  style={{
                    background: '#000',
                    color: '#fff',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 900,
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const targetRole = requiredRoles[0] as UserRole;
                switchPersona(targetRole);
              }}
              style={{
                flex: 1,
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #000000',
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '3px 3px 0px 0px #000000',
                textTransform: 'uppercase',
              }}
            >
              Switch to {requiredRoles[0]}
            </button>

            <button
              type="button"
              onClick={() => router.push(withBasePath(homeTarget))}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: '2px solid #000000',
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '3px 3px 0px 0px #000000',
              }}
            >
              Go to My Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

