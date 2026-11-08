'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { withBasePath } from '@/lib/basePath';

export default function NotFound() {
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);

  const getDynamicContext = () => {
    if (pathname.includes('/quotations/')) return { entity: 'quotation', listUrl: '/quotations', label: 'View Quotations' };
    if (pathname.includes('/approvals/')) return { entity: 'approval request', listUrl: '/approvals', label: 'View Approvals' };
    if (pathname.includes('/fulfillment/')) return { entity: 'order fulfillment', listUrl: '/fulfillment', label: 'View Fulfillment' };
    if (pathname.includes('/invoices/')) return { entity: 'invoice', listUrl: '/invoices', label: 'View Invoices' };
    if (pathname.includes('/products/')) return { entity: 'product', listUrl: '/products', label: 'View Products' };
    if (pathname.includes('/subscriptions/')) return { entity: 'subscription', listUrl: '/subscriptions', label: 'View Subscriptions' };
    if (pathname.includes('/onboard/')) return { entity: 'invitation', listUrl: '/login', label: 'Back to Login' };
    return null;
  };

  const dynamicContext = getDynamicContext();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: 'var(--surface-sunken, #f5f4ef)',
      color: 'var(--fg, #111)',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    }}>
      <div style={{
        maxWidth: 540,
        width: '100%',
        background: 'var(--surface, #fff)',
        border: '3px solid var(--border, #000)',
        boxShadow: 'var(--shadow-brutal, 6px 6px 0px #000)',
        padding: '2.5rem',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 10px',
          background: 'var(--primary, #FFE600)',
          color: '#000',
          fontWeight: 800,
          border: '2px solid #000',
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          {dynamicContext ? 'Demo Record Not Found' : '404 · Page Not Found'}
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
          {dynamicContext
            ? `This ${dynamicContext.entity} does not exist in your demo session.`
            : 'Page not found'}
        </h1>
        <p style={{ color: 'var(--fg-muted, #555)', lineHeight: 1.6, marginBottom: '2rem' }}>
          {dynamicContext
            ? 'Because this demo runs statically on GitHub Pages, only seeded records and newly created demo records from your session exist. Resetting the demo or navigating back to the list will get you back on track.'
            : 'The requested page could not be located in the DealFlow360 static demo environment.'}
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {dynamicContext && (
            <Link
              href={dynamicContext.listUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                background: 'var(--primary, #FFE600)',
                color: '#000',
                border: '2px solid #000',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '3px 3px 0px #000',
              }}
            >
              {dynamicContext.label}
            </Link>
          )}
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: '#fff',
              color: '#000',
              border: '2px solid #000',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '3px 3px 0px #000',
            }}
          >
            Dashboard
          </Link>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: 'var(--surface-sunken, #eee)',
              color: '#000',
              border: '2px solid #000',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '3px 3px 0px #000',
            }}
          >
            Switch Persona
          </Link>
        </div>
      </div>
    </div>
  );
}

