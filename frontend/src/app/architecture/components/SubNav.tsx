// src/app/architecture/components/SubNav.tsx
'use client';

import React, { useEffect, useState } from 'react';

interface NavSection {
  id: string;
  number: string;
  label: string;
  icon: string;
}

export const ARCH_SECTIONS: NavSection[] = [
  { id: 'overview', number: '6.1', label: 'System Overview', icon: '🏛️' },
  { id: 'lifecycle', number: '6.2', label: 'Request Lifecycle', icon: '⚡' },
  { id: 'engines', number: '6.3', label: 'Business Engines', icon: '⚙️' },
  { id: 'playground', number: '6.4', label: 'Engine Playground', icon: '🎛️' },
  { id: 'statemachines', number: '6.5', label: 'State Machines', icon: '🔄' },
  { id: 'dataflows', number: '6.6', label: 'Data Flows', icon: '🌊' },
  { id: 'schema', number: '6.7', label: 'Database Schema', icon: '🗄️' },
  { id: 'rbac', number: '6.8', label: 'Security & RBAC', icon: '🛡️' },
  { id: 'notes', number: '6.9', label: 'Engineering Notes', icon: '📝' },
];

export function SubNav() {
  const [activeId, setActiveId] = useState<string>('overview');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = ARCH_SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(ARCH_SECTIONS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveId(ARCH_SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: '80px',
        width: '260px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        paddingRight: '12px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#64748b',
          marginBottom: '6px',
          paddingLeft: '8px',
        }}
      >
        Navigation
      </div>

      {ARCH_SECTIONS.map(sec => {
        const isActive = activeId === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollTo(sec.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: isActive ? 900 : 700,
              color: isActive ? '#000000' : '#475569',
              background: isActive ? '#fbbf24' : '#ffffff',
              border: '2px solid #000000',
              boxShadow: isActive ? '3px 3px 0px 0px #000000' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.1s ease',
              width: '100%',
            }}
          >
            <span style={{ fontSize: '14px' }}>{sec.icon}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.75 }}>{sec.number}</span>
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sec.label}
            </span>
          </button>
        );
      })}

      <div
        style={{
          marginTop: '16px',
          background: '#f8fafc',
          border: '2px solid #000000',
          padding: '10px',
          fontSize: '11px',
          color: '#334155',
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: '4px' }}>💡 Quick Tip</div>
        All engine functions run the exact production TypeScript code in your browser with zero network calls.
      </div>
    </nav>
  );
}

