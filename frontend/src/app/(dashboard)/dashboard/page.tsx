'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDemoSession } from '@/demo/ui/useDemoSession';
import { withBasePath } from '@/lib/basePath';
import type { UserRole } from '@/lib/types';

interface ChecklistItem {
  id: string;
  title: string;
  desc: string;
  href?: string;
  actionText?: string;
}

const PERSONA_CHECKLISTS: Record<UserRole, ChecklistItem[]> = {
  SALES_REP: [
    {
      id: 'rep_1',
      title: 'Story 1: Inspect Happy Path Quote (Auto-Approval)',
      desc: 'View QTE-2025-0001 under Gold discount ceiling with 0 risk points and linked confirmed order.',
      href: '/quotations/qte_0001',
      actionText: 'View Quote',
    },
    {
      id: 'rep_2',
      title: 'Story 8: Test Upsell Engine & Co-Purchases',
      desc: 'Open QTE-2025-0008 cart to see algorithmic accessory suggestions respecting margin floors.',
      href: '/quotations/qte_0008',
      actionText: 'View Upsells',
    },
    {
      id: 'rep_3',
      title: 'Test AI Deal Copilot Risk Explanation',
      desc: 'On any evaluated quote, trigger deterministic AI explanation with typing animation & inputs.',
      href: '/quotations/qte_0002',
      actionText: 'Try AI Copilot',
    },
    {
      id: 'rep_4',
      title: 'Create a Deal via Interactive Quotation Builder',
      desc: 'Create a quote using runtime pool IDs (qte_new_01..40) with real-time tier pricing.',
      href: '/quotations/new',
      actionText: 'New Quote',
    },
    {
      id: 'rep_5',
      title: 'Open Customer Portal Link & Test Counter-Offer',
      desc: 'Open the portal URL from a quote or switch to CUSTOMER persona to simulate negotiation.',
      href: '/portal/quotation?token=ptok_qte_0001',
      actionText: 'Open Portal',
    },
    {
      id: 'rep_6',
      title: 'Inspect Intercepted Backend Calls in Trace Drawer',
      desc: 'Click "⚡ Trace" in the top bar to inspect SQL-like table reads/writes and latency.',
    },
  ],
  SALES_MANAGER: [
    {
      id: 'mgr_1',
      title: 'Story 2: Review Two-Step Approval Escalation',
      desc: 'Inspect QTE-2025-0002 with 28% discount requiring Sales Manager then Finance sign-offs.',
      href: '/approvals/qte_0002',
      actionText: 'Review Approval',
    },
    {
      id: 'mgr_2',
      title: 'Story 3: Margin Floor Protection Alert',
      desc: 'Examine QTE-2025-0003 where thin peripheral margin breached the 15% minimum threshold.',
      href: '/quotations/qte_0003',
      actionText: 'View Margin Breach',
    },
    {
      id: 'mgr_3',
      title: 'Story 6: Manager Revision Request Workflow',
      desc: 'See how manager revision notes return a quote to DRAFT state for rep adjustments.',
      href: '/quotations/qte_0006',
      actionText: 'View Revision',
    },
    {
      id: 'mgr_4',
      title: 'Inspect Deal Health Diagnostic Matrix',
      desc: 'Explore the 4 diagnostic health tiers (Healthy, Watch, At Risk, Critical) and signal reasons.',
      href: '/deal-health',
      actionText: 'Deal Health',
    },
    {
      id: 'mgr_5',
      title: 'Test Simulated 500 Error Injection',
      desc: 'Open Backend Trace (⚡ Trace) and toggle "Simulate 500 Failures" to test UI error resiliency.',
    },
  ],
  FINANCE: [
    {
      id: 'fin_1',
      title: 'Review Accounts Receivable & 70 Seeded Invoices',
      desc: 'Filter invoices across one-time hardware sales and recurring subscription billings.',
      href: '/invoices',
      actionText: 'View Invoices',
    },
    {
      id: 'fin_2',
      title: 'Story 2: Sign Off on Step 2 Commercial Approval',
      desc: 'Review and approve the finance step on escalated high-discount quotation QTE-2025-0002.',
      href: '/approvals/qte_0002',
      actionText: 'Sign Off',
    },
    {
      id: 'fin_3',
      title: 'Story 7: Recurring SaaS Proration & Credit Notes',
      desc: 'Review cancelled subscription sub_0001 and the resulting day-level proration credit note.',
      href: '/subscriptions',
      actionText: 'Subscriptions',
    },
    {
      id: 'fin_4',
      title: 'Generate Client-Side PDF & Excel Reports',
      desc: 'Export financial reports to real XLSX and PDF blobs generated entirely in-browser.',
      href: '/reports',
      actionText: 'Export Reports',
    },
    {
      id: 'fin_5',
      title: 'Inspect Relational Schema Live Row Counts',
      desc: 'Visit Architecture to inspect live session row counts across all 33 database tables.',
      href: '/architecture',
      actionText: 'Architecture',
    },
  ],
  OPERATIONS: [
    {
      id: 'ops_1',
      title: 'Story 4: Multi-Warehouse Split Fulfillment',
      desc: 'Check order allocations split across warehouses when single-location stock is insufficient.',
      href: '/fulfillment',
      actionText: 'Fulfillment Hub',
    },
    {
      id: 'ops_2',
      title: 'Inspect Inventory Depletion & Shipping Costs',
      desc: 'Examine warehouse base shipping rates and stock allocations on confirmed orders.',
      href: '/fulfillment',
      actionText: 'View Inventory',
    },
    {
      id: 'ops_3',
      title: 'Track Order Fulfillment State Transitions',
      desc: 'Follow orders from CONFIRMED → FULFILLING → PARTIALLY_FULFILLED → FULFILLED.',
      href: '/dashboard',
      actionText: 'Orders',
    },
    {
      id: 'ops_4',
      title: 'Explore Fulfillment State Machine Diagram',
      desc: 'Inspect the domain state machine and warehouse routing logic in the Architecture module.',
      href: '/architecture',
      actionText: 'Architecture',
    },
  ],
  ADMIN: [
    {
      id: 'adm_1',
      title: 'Explore Architecture & Business-Engine Catalog',
      desc: 'Review the 11 pure business engines, threshold constants, and interactive playground.',
      href: '/architecture',
      actionText: 'Architecture',
    },
    {
      id: 'adm_2',
      title: 'Test Live Engine Playground with Sliders',
      desc: 'Adjust discounts, quantities, and tiers to watch real engine calculations compute in real time.',
      href: '/architecture#playground',
      actionText: 'Playground',
    },
    {
      id: 'adm_3',
      title: 'Generate Portal Customer Invite (Simulated Email)',
      desc: 'Send an invite from the Customer list and inspect the rendered HTML email preview modal.',
      href: '/customers',
      actionText: 'Customers',
    },
    {
      id: 'adm_4',
      title: 'Verify Route Guard & Role-Based Access Control',
      desc: 'Switch personas using the top navigation dropdown to observe strict 403 access control.',
    },
    {
      id: 'adm_5',
      title: 'Test Deterministic Seed Reset',
      desc: 'Click "↺ Reset" in the top bar to verify all 33 tables reseed in <400 ms without reload.',
    },
  ],
  CUSTOMER: [
    {
      id: 'cus_1',
      title: 'Review Flagship Customer Portal Quotation',
      desc: 'Inspect live quotation QTE-2025-0001 with line items, tax details, and terms.',
      href: '/portal/quotation',
      actionText: 'Portal Quotation',
    },
    {
      id: 'cus_2',
      title: 'Story 5: Submit Counter-Offer Negotiation',
      desc: 'Negotiate quote pricing and watch the negotiation.engine decide acceptance or revision.',
      href: '/portal/quotation',
      actionText: 'Negotiate',
    },
    {
      id: 'cus_3',
      title: 'Accept Terms & Confirm Commercial Agreement',
      desc: 'Accept the quotation to trigger order generation and multi-warehouse fulfillment.',
      href: '/portal/quotation',
      actionText: 'Confirm Quote',
    },
  ],
};

export default function DashboardPage() {
  const { user } = useDemoSession();
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    openQuotations: 0,
    atRiskDeals: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);

  // Load checklist progress from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('df360.demo.checklist');
      if (raw) setCompletedItems(JSON.parse(raw));
    } catch {
      // Ignore
    }
  }, []);

  const toggleItem = (id: string) => {
    setCompletedItems(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        sessionStorage.setItem('df360.demo.checklist', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [approvalsRes, quotesRes, healthRes] = await Promise.all([
          fetch('/api/approvals').catch(() => null),
          fetch('/api/quotes').catch(() => null),
          fetch('/api/deal-health').catch(() => null)
        ]);

        let pendingApprovals = 0;
        let openQuotations = 0;
        let atRiskDeals = 0;
        
        if (approvalsRes?.ok) {
          const appData = await approvalsRes.json();
          pendingApprovals = appData.data?.pendingApprovalsCount || appData.approvals?.filter((a: any) => a.status === 'PENDING').length || 0;
        }
        
        if (quotesRes?.ok) {
          const qData = await quotesRes.json();
          const quotes = Array.isArray(qData) ? qData : qData.data || qData.quotes || [];
          openQuotations = quotes.filter((q: any) => q.status !== 'COMPLETED' && q.status !== 'CANCELLED').length;
          
          // Generate activities from recent quotes
          const recentQuotes = [...quotes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
          
          setActivities(recentQuotes.map(q => ({
            text: `Quote ${q.quoteNumber} for ${q.customer?.companyName || 'Unknown'} is now ${q.status.replace('_', ' ')}`,
            badge: q.status === 'APPROVED' ? 'badge-success' : q.status === 'PENDING_APPROVAL' ? 'badge-warning' : 'badge-info',
            label: q.status,
            time: new Date(q.updatedAt).toLocaleDateString()
          })));
        }
        
        if (healthRes?.ok) {
          const hData = await healthRes.json();
          atRiskDeals = hData.results?.filter((d: any) => d.healthLevel === 'AT_RISK' || d.healthLevel === 'CRITICAL').length || 0;
        }

        setStats({ pendingApprovals, openQuotations, atRiskDeals });
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    }
    fetchData();
  }, []);

  const currentRole = user?.role || 'SALES_REP';
  const checklist = PERSONA_CHECKLISTS[currentRole] || PERSONA_CHECKLISTS.SALES_REP;
  const completedCount = checklist.filter(item => completedItems[item.id]).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Sales Dashboard / Home</h1>
          <p className="support-text">Central hub, links out to every module below</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/quotations/new" className="btn btn-primary">+ New Quotation</Link>
          <Link href="/approvals" className="btn btn-secondary">View Approvals</Link>
        </div>
      </div>

      {/* "What to try as <persona>" Checklist */}
      <div
        className="card"
        style={{
          border: '3px solid #000000',
          boxShadow: '6px 6px 0px 0px #000000',
          background: '#fefce8',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
              What to try as {currentRole} ({user?.name})
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800 }}>
              {completedCount} of {checklist.length} completed
            </span>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('df360:start-tour'))}
              className="btn btn-secondary"
              style={{ padding: '3px 10px', fontSize: 11, fontWeight: 800 }}
            >
              🎯 Start Guided Tour
            </button>
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>
          Explore key scripted business-engine scenarios and workflows tailored for this role:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {checklist.map(item => {
            const isDone = Boolean(completedItems[item.id]);
            return (
              <div
                key={item.id}
                style={{
                  background: isDone ? '#f0fdf4' : '#ffffff',
                  border: isDone ? '2px solid #16a34a' : '2px solid #000000',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.1)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleItem(item.id)}
                      style={{ marginTop: 3, cursor: 'pointer', width: 16, height: 16 }}
                      id={item.id}
                    />
                    <label
                      htmlFor={item.id}
                      style={{
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: 'pointer',
                        textDecoration: isDone ? 'line-through' : 'none',
                        color: isDone ? '#16a34a' : '#000000',
                      }}
                    >
                      {item.title}
                    </label>
                  </div>
                  <p style={{ fontSize: 12, color: '#4b5563', margin: 0, paddingLeft: 24, lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>

                {item.href && (
                  <div style={{ marginTop: 10, paddingLeft: 24 }}>
                    <Link
                      href={withBasePath(item.href)}
                      className="btn btn-secondary"
                      style={{
                        padding: '3px 8px',
                        fontSize: 11,
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'inline-block',
                      }}
                    >
                      {item.actionText || 'Try Now'} →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <Link href="/approvals" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-card card-shadow">
            <div className="card-label">Pending Approvals</div>
            <div className="kpi-value" style={{ color: 'var(--warning-fg)' }}>{stats.pendingApprovals}</div>
            <div className="kpi-sub">quotations waiting</div>
          </div>
        </Link>
        <Link href="/quotations" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-card card-shadow">
            <div className="card-label">Open Quotations</div>
            <div className="kpi-value" style={{ color: 'var(--primary)' }}>{stats.openQuotations}</div>
            <div className="kpi-sub">active deals</div>
          </div>
        </Link>
        <Link href="/deal-health" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-card card-shadow">
            <div className="card-label">At-Risk Deals</div>
            <div className="kpi-value" style={{ color: 'var(--danger-fg)' }}>{stats.atRiskDeals}</div>
            <div className="kpi-sub">flagged by Deal Health</div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="section-title">Recent Activity</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {activities.length === 0 ? (
            <div style={{ padding: '20px 0', color: 'var(--fg-muted)' }}>No recent activity to show.</div>
          ) : activities.map((a, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 0',
              borderBottom: i < activities.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              gap: 12,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.text}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{a.time}</div>
              </div>
              <span className={`badge ${a.badge}`}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
