// src/demo/ui/TourOverlay.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoSession } from './useDemoSession';
import { withBasePath } from '@/lib/basePath';
import type { UserRole } from '@/lib/types';

interface TourStep {
  title: string;
  storyTag?: string;
  route: string;
  content: string;
  highlightAction: string;
}

const PERSONA_TOURS: Record<UserRole, TourStep[]> = {
  SALES_REP: [
    {
      title: 'Executive Sales Dashboard',
      route: '/dashboard',
      content: 'Welcome Sarah! The dashboard aggregates pipeline metrics, quote health distribution, and recent deals.',
      highlightAction: 'Observe the deal health breakdown and pending quote counts.',
    },
    {
      title: 'Story 1: Happy Path Quotation',
      storyTag: 'Story 1 · Auto-Approval to Cash',
      route: '/quotations/qte_0001',
      content: 'Quote QTE-2025-0001 for Acme Global Ltd was requested with 10% discount. Within Gold tier ceiling (15%), so Risk Engine scored LOW (0 pts) with no manager approval required.',
      highlightAction: 'Check the status badge (CONFIRMED) and linked Order ORD-2025-0001.',
    },
    {
      title: 'Story 8: Upsell Engine & Co-Purchases',
      storyTag: 'Story 8 · AI/Rule Upsell',
      route: '/quotations/qte_0008',
      content: 'This draft cart contains an ApexBook 16" Workstation. The Upsell Engine analyzed 80 co-purchase rules and suggested the 34" Curved Monitor & Thunderbolt Dock while verifying margin floors.',
      highlightAction: 'Check the "Recommended Upsell Additions" cards.',
    },
    {
      title: 'Interactive Quotation Builder',
      route: '/quotations/new',
      content: 'Ready to try creating a deal? New quotes automatically reserve an ID from the pre-rendered runtime pool (qte_new_01..40) ensuring static export compatibility.',
      highlightAction: 'Select a customer and add product lines to test real-time pricing.',
    },
  ],
  SALES_MANAGER: [
    {
      title: 'Commercial Approvals Queue',
      route: '/approvals',
      content: 'Welcome David! As Sales Manager, deals exceeding discount ceilings or margin thresholds require your authorization before sales reps can confirm them.',
      highlightAction: 'Inspect the pending approval queue prioritized by risk level.',
    },
    {
      title: 'Story 2: Two-Step Approval Escalation',
      storyTag: 'Story 2 · High Risk Escalation',
      route: '/approvals/qte_0002',
      content: 'Quote QTE-2025-0002 requested a 28% discount, exceeding the 10% Silver ceiling. The Risk Engine scored HIGH risk, requiring sequential approval from Sales Manager (already approved) and Finance (pending).',
      highlightAction: 'Review the approval history log showing manager justification.',
    },
    {
      title: 'Story 3: Margin Floor Protection Breach',
      storyTag: 'Story 3 · Margin Floor Alert',
      route: '/quotations/qte_0003',
      content: 'QTE-2025-0003 contains a low-cost peripheral bundle with thin margin. Combined with a requested discount, Margin Engine detected a breach below the 15% floor.',
      highlightAction: 'Notice the Risk Score points added specifically for margin degradation.',
    },
    {
      title: 'Story 6: Manager Revision Request Loop',
      storyTag: 'Story 6 · Revision Workflow',
      route: '/quotations/qte_0006',
      content: 'Sales Manager requested revision on terms. Quotation automatically moved back to DRAFT with revision notes, allowing rep to edit and resubmit.',
      highlightAction: 'Observe the quote status (DRAFT) and revision counter (Revision 2).',
    },
    {
      title: 'Deal Health Diagnostic Matrix',
      route: '/deal-health',
      content: 'Independent from single-quote risk, the Deal Health Engine detects stalling, approval age, delivery slips, and negotiation fatigue over time.',
      highlightAction: 'Review the 4 health tiers: Healthy, Watch, At Risk, and Critical.',
    },
  ],
  FINANCE: [
    {
      title: 'Invoicing & Accounts Receivable Hub',
      route: '/invoices',
      content: 'Welcome Elena! Review the 70 seeded invoices across one-time hardware orders and recurring cloud SaaS subscriptions.',
      highlightAction: 'Filter invoices by PAID, ISSUED, and DRAFT statuses.',
    },
    {
      title: 'Story 2: Finance 2nd-Step Commercial Sign-off',
      storyTag: 'Story 2 · Two-Step Approval',
      route: '/approvals/qte_0002',
      content: 'Quote QTE-2025-0002 is currently waiting for your Finance approval after David Kim approved Step 1.',
      highlightAction: 'Test clicking Approve or Request Revision to execute live store transaction.',
    },
    {
      title: 'Story 7: Recurring SaaS Proration & Credit Notes',
      storyTag: 'Story 7 · Subscription Lifecycle',
      route: '/subscriptions',
      content: 'Subscription sub_0001 (Wayne Tech Labs) was cancelled mid-term. The Billing Engine calculated exact day-level proration and generated Credit Note cn_0001.',
      highlightAction: 'Check the subscription status (CANCELLED) and credit note link.',
    },
    {
      title: 'Executive Financial Reporting',
      route: '/reports',
      content: 'Generate audit reports client-side using browser builds of jsPDF and ExcelJS. Zero external network calls required.',
      highlightAction: 'Click "Export PDF" or "Export XLS" to trigger a client Blob download.',
    },
  ],
  OPERATIONS: [
    {
      title: 'Logistics & Warehouse Allocation Hub',
      route: '/fulfillment',
      content: 'Welcome Marcus! Oversee stock fulfillment across all 5 distribution warehouses.',
      highlightAction: 'Observe warehouse inventory distribution and pending order lines.',
    },
    {
      title: 'Story 4: Multi-Warehouse Split & Unfulfillable Line',
      storyTag: 'Story 4 · Inventory Optimization',
      route: '/fulfillment/ord_0004',
      content: 'Order ORD-2025-0004 required 45 laptops. Greedy fulfillment split the line between Bengaluru (25 units) and Mumbai (20 units). A second line was out of stock, adding inventory risk points.',
      highlightAction: 'Check the multi-warehouse allocation breakdown and combined shipping costs.',
    },
    {
      title: 'Master Order Dispatch Tracking',
      route: '/orders',
      content: 'Track confirmed orders through FULFILLING, PARTIALLY_FULFILLED, and FULFILLED delivery lifecycles.',
      highlightAction: 'Click any order to jump directly to warehouse fulfillment details.',
    },
  ],
  ADMIN: [
    {
      title: 'Platform Administration Center',
      route: '/admin',
      content: 'Welcome Alex! Manage commercial rules, catalog pricing, and distribution warehouse nodes.',
      highlightAction: 'Explore the rule configuration modules.',
    },
    {
      title: 'Live Discount Rule Configuration',
      route: '/admin/discount-config',
      content: 'Edits made to discount rules in this screen immediately update the in-memory store and take effect on the very next quotation evaluation!',
      highlightAction: 'Observe priority ordering and tier/category max discount ceilings.',
    },
    {
      title: 'Warehouse Node Management',
      route: '/admin/warehouses',
      content: 'Inspect the 5 distribution hubs. Notice Chennai Coastal Depot is marked inactive to demonstrate routing exclusions.',
      highlightAction: 'Review shipping base costs for each regional warehouse.',
    },
  ],
  CUSTOMER: [
    {
      title: 'Customer Self-Service Quotation Portal',
      storyTag: 'Story 1 · Portal Review',
      route: '/portal/quotation?token=ptok_qte_0001',
      content: 'Welcome Rachel! As the buyer for Acme Global Ltd, review official quotation QTE-2025-0001 with restricted pricing (internal margin and risk scores are sanitized).',
      highlightAction: 'Review line item specifications and pricing totals.',
    },
    {
      title: 'Story 5: Live Counter-Offer Negotiation',
      storyTag: 'Story 5 · Negotiation Engine',
      route: '/portal/quotation?token=ptok_qte_0005',
      content: 'Try negotiating deal terms. Adjust line discount sliders and submit a counter-offer. The Negotiation Engine decides whether to auto-accept or trigger manager re-approval.',
      highlightAction: 'Enter a proposed discount percentage and click "Submit Counter-Offer".',
    },
    {
      title: 'Negotiation Message History',
      route: '/portal/messages',
      content: 'View the threaded commercial dialogue between your procurement team and the DealFlow360 sales team.',
      highlightAction: 'Inspect message exchange timestamps and negotiation rounds.',
    },
  ],
};

export function TourOverlay() {
  const router = useRouter();
  const { role } = useDemoSession();
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const handleStart = () => {
      setStepIndex(0);
      setIsActive(true);
    };

    window.addEventListener('df360:start-tour', handleStart);

    // Auto-start if requested during login
    if (typeof window !== 'undefined') {
      const pendingTour = window.sessionStorage.getItem('df360.demo.startTour');
      if (pendingTour) {
        window.sessionStorage.removeItem('df360.demo.startTour');
        setIsActive(true);
      }
    }

    return () => {
      window.removeEventListener('df360:start-tour', handleStart);
    };
  }, []);

  if (!isActive || !role) return null;

  const steps = PERSONA_TOURS[role] || PERSONA_TOURS.SALES_REP;
  const currentStep = steps[stepIndex] || steps[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const goToStep = (newIdx: number) => {
    if (newIdx < 0 || newIdx >= steps.length) return;
    setStepIndex(newIdx);
    const targetRoute = steps[newIdx].route;
    router.push(withBasePath(targetRoute));
  };

  const handleNext = () => {
    if (isLast) {
      setIsActive(false);
    } else {
      goToStep(stepIndex + 1);
    }
  };

  const handlePrev = () => {
    goToStep(stepIndex - 1);
  };

  const handleClose = () => {
    setIsActive(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: '460px',
        width: 'calc(100vw - 48px)',
        background: '#ffffff',
        border: '4px solid #000000',
        boxShadow: '8px 8px 0px 0px #000000',
        zIndex: 9000,
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Tag & Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#000000', color: '#fbbf24', padding: '2px 8px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>
            {role} GUIDED TOUR
          </span>
          {currentStep.storyTag && (
            <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', padding: '1px 6px', fontSize: '10px', fontWeight: 800 }}>
              {currentStep.storyTag}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleClose}
          style={{ background: 'transparent', border: 'none', fontWeight: 900, fontSize: '16px', cursor: 'pointer', padding: '2px 6px' }}
          title="Exit Tour"
        >
          ✕
        </button>
      </div>

      <div style={{ fontSize: '12px', fontWeight: 800, color: '#6b7280', marginBottom: '6px' }}>
        Step {stepIndex + 1} of {steps.length}
      </div>

      {/* Title */}
      <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 10px 0', textTransform: 'uppercase' }}>
        {currentStep.title}
      </h3>

      {/* Content */}
      <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5, margin: '0 0 14px 0' }}>
        {currentStep.content}
      </p>

      {/* Highlight Action */}
      <div style={{ background: '#fdfbf7', border: '2px solid #000000', padding: '10px 12px', marginBottom: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#b45309', marginBottom: '4px' }}>
          💡 What to verify:
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000' }}>
          {currentStep.highlightAction}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <button
          type="button"
          disabled={isFirst}
          onClick={handlePrev}
          style={{
            background: isFirst ? '#f3f4f6' : '#ffffff',
            color: isFirst ? '#9ca3af' : '#000000',
            border: '2px solid #000000',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: isFirst ? 'not-allowed' : 'pointer',
          }}
        >
          ← Back
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'transparent',
              color: '#6b7280',
              border: 'none',
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Skip Tour
          </button>

          <button
            type="button"
            onClick={handleNext}
            style={{
              background: '#000000',
              color: '#ffffff',
              border: '2px solid #000000',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '2px 2px 0px 0px #000000',
              textTransform: 'uppercase',
            }}
          >
            {isLast ? 'Finish Tour ✓' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  );
}

