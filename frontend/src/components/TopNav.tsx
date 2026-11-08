'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDemoSession } from '@/demo/ui/useDemoSession';
import { getStore, reseedStore } from '@/demo/db/store';
import { withBasePath } from '@/lib/basePath';
import type { UserRole } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  roles?: UserRole[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

const NAV_ENTRIES: NavEntry[] = [
  { href: '/dashboard', label: 'Dashboard' },
  {
    label: 'Sales',
    items: [
      { href: '/quotations', label: 'Quotations' },
      { href: '/subscriptions', label: 'Subscriptions', roles: ['ADMIN', 'FINANCE', 'SALES_REP', 'SALES_MANAGER'] },
      { href: '/deal-health', label: 'Deal Health', roles: ['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'FINANCE'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/approvals', label: 'Approvals', roles: ['ADMIN', 'SALES_MANAGER', 'FINANCE'] },
      { href: '/fulfillment', label: 'Fulfillment', roles: ['ADMIN', 'OPERATIONS', 'SALES_MANAGER'] },
      { href: '/invoices', label: 'Invoices', roles: ['ADMIN', 'FINANCE', 'SALES_MANAGER'] },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/products', label: 'Products' },
      { href: '/customers', label: 'Customers' },
    ],
  },
  { href: '/reports', label: 'Reports' },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, switchPersona, logout } = useDemoSession();

  // If no user session, render nothing to avoid flash of wrong permissions
  if (!user) {
    return null;
  }

  const currentRole = user.role;

  const isItemVisible = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(currentRole);
  };

  const visibleNavEntries = NAV_ENTRIES.map(entry => {
    if ('items' in entry) {
      const visibleItems = entry.items.filter(isItemVisible);
      return visibleItems.length > 0 ? { ...entry, items: visibleItems } : null;
    }
    return isItemVisible(entry) ? entry : null;
  }).filter(Boolean) as NavEntry[];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    switchPersona(newRole);
    const target = newRole === 'CUSTOMER' ? '/portal/quotation' : '/dashboard';
    router.push(withBasePath(target));
  };

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

  const handleLogout = async () => {
    logout();
    router.push(withBasePath('/login'));
  };

  return (
    <header
      className="topbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        boxShadow: '0 3px 0 #000000',
        background: '#000000',
        padding: '0 20px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '16px' }}>
        <Link
          href={withBasePath('/dashboard')}
          className="topbar-brand"
          style={{ textDecoration: 'none', color: '#ffffff', fontWeight: 900, fontSize: '18px', letterSpacing: '-0.02em' }}
        >
          DEALFLOW360
        </Link>
        <span
          style={{
            background: '#fbbf24',
            color: '#000000',
            fontSize: '10px',
            fontWeight: 900,
            padding: '2px 6px',
            border: '1.5px solid #000',
            textTransform: 'uppercase',
          }}
        >
          DEMO
        </span>
      </div>

      {/* Tabs */}
      <nav className="topbar-tabs" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {visibleNavEntries.map((entry, idx) => {
          if ('items' in entry) {
            const isActiveGroup = entry.items.some(
              item => pathname === withBasePath(item.href) || pathname.startsWith(withBasePath(item.href) + '/')
            );
            return (
              <div key={idx} className="topbar-dropdown">
                <div
                  className={`topbar-tab${isActiveGroup ? ' active' : ''}`}
                  style={{ cursor: 'pointer', color: isActiveGroup ? '#fbbf24' : '#ffffff', fontWeight: 700 }}
                >
                  {entry.label} ▾
                </div>
                <div className="topbar-dropdown-content" style={{ border: '2px solid #000', boxShadow: '4px 4px 0px 0px #000' }}>
                  {entry.items.map(item => {
                    const isActive =
                      pathname === withBasePath(item.href) ||
                      pathname.startsWith(withBasePath(item.href) + '/');
                    return (
                      <Link
                        key={item.href}
                        href={withBasePath(item.href)}
                        className={`topbar-dropdown-item${isActive ? ' active' : ''}`}
                        style={{ fontWeight: 700 }}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          } else {
            const isActive =
              pathname === withBasePath(entry.href) ||
              pathname.startsWith(withBasePath(entry.href) + '/');
            return (
              <Link
                key={entry.href}
                href={withBasePath(entry.href)}
                className={`topbar-tab${isActive ? ' active' : ''}`}
                style={{ color: isActive ? '#fbbf24' : '#ffffff', fontWeight: 700 }}
              >
                {entry.label}
              </Link>
            );
          }
        })}
      </nav>

      {/* Actions & Persona Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
        {/* Architecture Link */}
        <Link
          href={withBasePath('/architecture')}
          style={{
            background: '#ffffff',
            color: '#000000',
            fontWeight: 800,
            fontSize: '11px',
            padding: '4px 10px',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px 0px #fbbf24',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>📐</span>
          <span>Architecture</span>
        </Link>

        {/* Backend Trace Button */}
        <button
          type="button"
          onClick={handleToggleTrace}
          style={{
            background: '#1e293b',
            color: '#38bdf8',
            fontWeight: 800,
            fontSize: '11px',
            padding: '4px 10px',
            border: '2px solid #38bdf8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Open intercepted network call trace log"
        >
          <span>⚡</span>
          <span>Trace</span>
        </button>

        {/* Reset Demo Button */}
        <button
          type="button"
          onClick={handleResetDemo}
          style={{
            background: '#374151',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '11px',
            padding: '4px 8px',
            border: '2px solid #9ca3af',
            cursor: 'pointer',
          }}
          title="Reset all store tables back to deterministic seed"
        >
          ↺ Reset
        </button>

        {/* Persona Switcher Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700 }}>As:</span>
          <select
            value={currentRole}
            onChange={handleRoleChange}
            style={{
              background: '#ffffff',
              color: '#000000',
              fontWeight: 900,
              fontSize: '12px',
              padding: '3px 8px',
              border: '2px solid #000000',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ADMIN">ADMIN (Alex Morgan)</option>
            <option value="SALES_REP">SALES_REP (Sarah Jenkins)</option>
            <option value="SALES_MANAGER">SALES_MANAGER (David Kim)</option>
            <option value="FINANCE">FINANCE (Elena Rostova)</option>
            <option value="OPERATIONS">OPERATIONS (Marcus Vance)</option>
            <option value="CUSTOMER">CUSTOMER (Rachel Green)</option>
          </select>
        </div>

        {/* Admin Link if admin */}
        {currentRole === 'ADMIN' && (
          <Link
            href={withBasePath('/admin')}
            style={{
              background: '#f59e0b',
              color: '#000000',
              fontSize: '11px',
              fontWeight: 800,
              padding: '4px 8px',
              border: '2px solid #000',
              textDecoration: 'none',
            }}
          >
            ⚙ Admin
          </Link>
        )}

        {/* New Quote CTA */}
        <Link
          href={withBasePath('/quotations/new')}
          style={{
            background: '#fbbf24',
            color: '#000000',
            fontSize: '12px',
            fontWeight: 900,
            padding: '5px 12px',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px 0px #ffffff',
            textDecoration: 'none',
          }}
        >
          + New Quote
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: 'transparent',
            color: '#ef4444',
            border: '1px solid #ef4444',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            cursor: 'pointer',
          }}
        >
          Exit
        </button>
      </div>
    </header>
  );
}
