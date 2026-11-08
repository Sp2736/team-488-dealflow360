// src/app/architecture/page.tsx
'use client';

import React from 'react';
import { Header } from './components/Header';
import { SubNav } from './components/SubNav';
import { SystemOverviewSection } from './components/SystemOverviewSection';
import { RequestLifecycleSection } from './components/RequestLifecycleSection';
import { EngineCatalogSection } from './components/EngineCatalogSection';
import { PlaygroundSection } from './components/PlaygroundSection';
import { StateMachinesSection } from './components/StateMachinesSection';
import { DataFlowsSection } from './components/DataFlowsSection';
import { SchemaSection } from './components/SchemaSection';
import { SecurityRbacSection } from './components/SecurityRbacSection';
import { EngineeringNotesSection } from './components/EngineeringNotesSection';

export default function ArchitecturePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fdfbf7', color: '#000000', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Header />

      {/* Main Content Layout with Sticky Sidebar */}
      <div
        style={{
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '24px',
          display: 'flex',
          gap: '32px',
          alignItems: 'flex-start',
        }}
      >
        {/* Sticky Left SubNav */}
        <SubNav />

        {/* Sections Container */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Section 6.1 */}
          <SystemOverviewSection />

          {/* Section 6.2 */}
          <RequestLifecycleSection />

          {/* Section 6.3 */}
          <EngineCatalogSection />

          {/* Section 6.4 */}
          <PlaygroundSection />

          {/* Section 6.5 */}
          <StateMachinesSection />

          {/* Section 6.6 */}
          <DataFlowsSection />

          {/* Section 6.7 */}
          <SchemaSection />

          {/* Section 6.8 */}
          <SecurityRbacSection />

          {/* Section 6.9 */}
          <EngineeringNotesSection />
        </main>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: '3px solid #000000',
          background: '#ffffff',
          padding: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b',
          marginTop: 'auto',
        }}
      >
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
          DEALFLOW360 · B2B COMMERCE ENGINE & SALES OPERATIONS COMMAND CENTER
        </div>
        <div>
          Static export running browser-side business engines. All data is fictional and isolated to your browser tab.
        </div>
      </footer>
    </div>
  );
}

