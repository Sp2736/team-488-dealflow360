// src/app/architecture/components/EngineCatalogSection.tsx
'use client';

import React, { useState } from 'react';
import { RISK_THRESHOLDS } from '@/lib/engines/risk.engine';
import { APPROVAL_THRESHOLDS } from '@/lib/engines/approval.engine';
import { DEAL_HEALTH_THRESHOLDS } from '@/lib/engines/deal-health.engine';
import { UPSELL_THRESHOLDS } from '@/lib/engines/upsell.engine';

interface EngineCardData {
  id: string;
  name: string;
  file: string;
  purpose: string;
  inputs: string;
  outputs: string;
  edgeCases: string[];
  codeExcerpt: string;
  thresholds?: Record<string, any>;
}

const ENGINES_DATA: EngineCardData[] = [
  {
    id: 'pricing',
    name: 'Pricing Resolution Engine',
    file: 'src/lib/engines/pricing.engine.ts',
    purpose: 'Resolves base unit prices, customer-tier price list overrides, and variant add-on premiums.',
    inputs: 'PricingContext { basePrice, priceListItems?, variantExtraPrice?, currency }',
    outputs: 'PricingResult { unitPrice, currency, appliedPriceListId? }',
    edgeCases: [
      'Missing or unassigned customer tier defaults to standard product basePrice',
      'Inactive price list items are bypassed in favor of base price',
      'Variant extraPrice add-ons accurately increment list price',
    ],
    codeExcerpt: `export function resolvePricing(ctx: PricingContext): PricingResult {
  let unitPrice = ctx.basePrice;
  let appliedPriceListId: string | undefined;

  if (ctx.priceListItems && ctx.priceListItems.length > 0) {
    const item = ctx.priceListItems.find(p => p.currency === ctx.currency);
    if (item) {
      unitPrice = item.price;
      appliedPriceListId = item.priceListId;
    }
  }

  if (ctx.variantExtraPrice) {
    unitPrice = unitPrice + ctx.variantExtraPrice;
  }

  return { unitPrice, currency: ctx.currency, appliedPriceListId };
}`,
  },
  {
    id: 'discount',
    name: 'Discount Evaluation Engine',
    file: 'src/lib/engines/discount.engine.ts',
    purpose: 'Calculates maximum allowable discounts by applying tier ceilings and category rules with priority sorting.',
    inputs: 'DiscountContext { requestedDiscountPercent, tier, categoryId?, discountRules[] }',
    outputs: 'DiscountResult { approvedDiscountPercent, isCeilingExceeded, maxAllowedDiscountPercent }',
    edgeCases: [
      'Zero requested discount automatically passes with 0 risk',
      'Tier + Category combined rules override generic tier ceilings by priority',
      'Negative or out-of-range discount inputs clamped gracefully',
    ],
    codeExcerpt: `export function runDiscountEngine(ctx: DiscountContext): DiscountResult {
  let maxAllowed = ctx.tier?.defaultDiscountPercent ?? 0;

  if (ctx.discountRules && ctx.discountRules.length > 0) {
    const applicable = ctx.discountRules
      .filter(r => r.active && (!r.tierId || r.tierId === ctx.tier?.id))
      .sort((a, b) => b.priority - a.priority);

    if (applicable.length > 0) {
      maxAllowed = applicable[0].maxDiscountPercent;
    }
  }

  const isCeilingExceeded = ctx.requestedDiscountPercent > maxAllowed;
  return {
    approvedDiscountPercent: Math.min(ctx.requestedDiscountPercent, maxAllowed),
    isCeilingExceeded,
    maxAllowedDiscountPercent: maxAllowed,
  };
}`,
  },
  {
    id: 'margin',
    name: 'Margin Guard Engine',
    file: 'src/lib/engines/margin.engine.ts',
    purpose: 'Computes line-level and aggregate gross margins and enforces the minimum profitability floor.',
    inputs: 'MarginContext { lines: Array<{ unitPrice, cost, discountPercent, quantity }>, minMarginPercent? }',
    outputs: 'MarginResult { totalRevenue, totalCost, grossMarginAmount, marginPercent, isFloorBreached }',
    edgeCases: [
      'Handles zero-cost items without infinite margin distortion',
      'Detects aggregate margin breaches even when individual line items are profitable',
      'Protects against negative revenue or free giveaway anomalies',
    ],
    codeExcerpt: `export function runMarginEngine(ctx: MarginContext): MarginResult {
  let totalRevenue = 0;
  let totalCost = 0;

  for (const line of ctx.lines) {
    const discountedPrice = line.unitPrice * (1 - line.discountPercent / 100);
    totalRevenue += discountedPrice * line.quantity;
    totalCost += line.cost * line.quantity;
  }

  const grossMargin = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
  const floor = ctx.minMarginPercent ?? 15;

  return {
    totalRevenue,
    totalCost,
    grossMarginAmount: grossMargin,
    marginPercent: Math.round(marginPercent * 100) / 100,
    isFloorBreached: marginPercent < floor,
  };
}`,
  },
  {
    id: 'risk',
    name: 'Multi-Factor Risk Engine',
    file: 'src/lib/engines/risk.engine.ts',
    purpose: 'Assesses commercial deal exposure across 5 weighted dimensions, producing a risk score (0–100) and risk level.',
    inputs: 'RiskContext { discountPercent, discountCeiling, marginPercent, marginFloor, multiWarehouseSplit, unfulfillableLines }',
    outputs: 'RiskResult { riskScore: 0..100, riskLevel: LOW | MEDIUM | HIGH | CRITICAL, reasons: RiskReason[] }',
    edgeCases: [
      'Combines multiple risk reasons additively up to maximum 100 points',
      'Unfulfillable inventory triggers immediate +40 risk escalation',
      'Deep discount breaches (>15% over ceiling) trigger HIGH/CRITICAL band immediately',
    ],
    codeExcerpt: `export function runRiskEngine(ctx: RiskContext): RiskResult {
  let score = 0;
  const reasons: RiskReason[] = [];

  // Discount ceiling factor
  if (ctx.discountPercent > ctx.discountCeiling) {
    const diff = ctx.discountPercent - ctx.discountCeiling;
    const pts = diff > 15 ? 40 : diff > 5 ? 25 : 15;
    score += pts;
    reasons.push({ component: 'DISCOUNT', points: pts, severity: diff > 15 ? 'HIGH' : 'MEDIUM' });
  }

  // Margin floor factor
  if (ctx.marginPercent < ctx.marginFloor) {
    score += RISK_THRESHOLDS.MARGIN_RISK_POINTS;
    reasons.push({ component: 'MARGIN', points: RISK_THRESHOLDS.MARGIN_RISK_POINTS, severity: 'HIGH' });
  }

  const finalScore = Math.min(100, score);
  return { riskScore: finalScore, riskLevel: resolveRiskBand(finalScore), reasons };
}`,
    thresholds: RISK_THRESHOLDS,
  },
  {
    id: 'approval',
    name: 'Approval Escalation Engine',
    file: 'src/lib/engines/approval.engine.ts',
    purpose: 'Maps deal risk and discount severity to required organizational sign-offs (Sales Manager, Finance).',
    inputs: 'ApprovalContext { riskScore, riskLevel, hardViolations?, rules: ApprovalRule[] }',
    outputs: 'ApprovalPlan { required: boolean, steps: ApprovalStep[], requiredRoles: UserRole[] }',
    edgeCases: [
      'Low risk quotes (score < 25) require no approval and auto-confirm',
      'Sequential multi-step routing: Step 1 (Sales Manager) must complete before Step 2 (Finance)',
      'Hard violations (margin floor breach) bypass rules and require multi-role sign-off',
    ],
    codeExcerpt: `export function runApprovalEngine(ctx: ApprovalContext): ApprovalPlan {
  if (ctx.riskScore < 25 && !ctx.hardViolations?.length) {
    return { required: false, steps: [], requiredRoles: [] };
  }

  const steps: ApprovalStep[] = [];
  if (ctx.riskScore >= 25) {
    steps.push({ step: 1, role: 'SALES_MANAGER', description: 'Commercial Review' });
  }
  if (ctx.riskScore >= 50 || ctx.hardViolations?.includes('MARGIN_FLOOR')) {
    steps.push({ step: 2, role: 'FINANCE', description: 'Financial Margin Authorization' });
  }

  return {
    required: steps.length > 0,
    steps,
    requiredRoles: Array.from(new Set(steps.map(s => s.role))),
  };
}`,
    thresholds: APPROVAL_THRESHOLDS,
  },
  {
    id: 'upsell',
    name: 'Algorithmic Upsell Engine',
    file: 'src/lib/engines/upsell.engine.ts',
    purpose: 'Analyzes cart items against historical co-purchase patterns and promotion rules while checking margin floors.',
    inputs: 'UpsellContext { cartProductIds[], coPurchases[], promotionRules[], minMarginPercent }',
    outputs: 'UpsellRecommendation[] { product, score, reason, estimatedMarginPercent }',
    edgeCases: [
      'Never recommends items already present in the quotation cart',
      'Filters out promotions that fail the minimum gross margin gate',
      'Scores candidates using combined frequency, support, and promotional weighting',
    ],
    codeExcerpt: `export function recommendUpsells(ctx: UpsellContext): UpsellRecommendation[] {
  const recommendations: UpsellRecommendation[] = [];
  const cartSet = new Set(ctx.cartProductIds);

  for (const rule of ctx.promotionRules) {
    if (cartSet.has(rule.targetProductId) && !cartSet.has(rule.recommendedProductId)) {
      if (rule.product.minMarginPercent >= ctx.minMarginPercent) {
        recommendations.push({
          productId: rule.recommendedProductId,
          product: rule.product,
          score: 0.95,
          reason: 'PROMOTION_RULE',
        });
      }
    }
  }

  return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
}`,
    thresholds: UPSELL_THRESHOLDS,
  },
  {
    id: 'fulfillment',
    name: 'Multi-Warehouse Allocation Engine',
    file: 'src/lib/engines/fulfillment.engine.ts',
    purpose: 'Distributes order item quantities across regional warehouses with inventory splitting and shipping cost calculation.',
    inputs: 'FulfillmentContext { orderLines[], warehouses[], inventoryMatrix[] }',
    outputs: 'AllocationPlan { allocations: WarehouseAllocation[], isSplitRequired, totalShippingCost }',
    edgeCases: [
      'Selects single warehouse with lowest shipping cost whenever single-origin stock suffices',
      'Splits quantities across multiple facilities when single inventory is insufficient',
      'Flags unfulfillable lines when aggregate network stock is less than requested quantity',
    ],
    codeExcerpt: `export function allocateFulfillment(ctx: FulfillmentContext): AllocationPlan {
  const allocations: WarehouseAllocation[] = [];
  let isSplitRequired = false;
  let totalShippingCost = 0;

  for (const line of ctx.orderLines) {
    const single = findSingleWarehouse(line.productId, line.quantity, ctx.inventoryMatrix);
    if (single) {
      allocations.push({ warehouseId: single.warehouseId, productId: line.productId, quantity: line.quantity });
      totalShippingCost += single.shippingBaseCost;
    } else {
      isSplitRequired = true;
      const splits = splitAcrossWarehouses(line.productId, line.quantity, ctx.inventoryMatrix);
      allocations.push(...splits);
    }
  }

  return { allocations, isSplitRequired, totalShippingCost };
}`,
  },
  {
    id: 'billing',
    name: 'Billing & Proration Engine',
    file: 'src/lib/engines/billing.engine.ts',
    purpose: 'Calculates day-level proration credit notes for mid-term cancellations and builds recurring billing schedules.',
    inputs: 'ProrationContext { planPrice, cycleDays, daysUsed, refundEnabled }',
    outputs: 'ProrationResult { refundAmount, unearnedRevenueAmount, creditNoteRecommended }',
    edgeCases: [
      'Handles zero-day and full-cycle cancellation boundaries precisely',
      'Respects plan-level refund policies (no credit note if non-refundable)',
      'Produces deterministic penny-accurate credit note values',
    ],
    codeExcerpt: `export function calculateProration(ctx: ProrationContext): ProrationResult {
  if (!ctx.refundEnabled || ctx.daysUsed >= ctx.cycleDays) {
    return { refundAmount: 0, creditNoteRecommended: false };
  }

  const unusedDays = ctx.cycleDays - ctx.daysUsed;
  const dailyRate = ctx.planPrice / ctx.cycleDays;
  const refundAmount = Math.round(dailyRate * unusedDays * 100) / 100;

  return {
    refundAmount,
    creditNoteRecommended: refundAmount > 0,
  };
}`,
  },
  {
    id: 'negotiation',
    name: 'Negotiation Assessment Engine',
    file: 'src/lib/engines/negotiation.engine.ts',
    purpose: 'Evaluates customer portal counter-offers, determining whether discount requests fall within auto-acceptable bands.',
    inputs: 'NegotiationContext { quote, counterDiscountPercent, marginFloor, tierMaxDiscount }',
    outputs: 'NegotiationDecision { outcome: ACCEPT | REJECT | COUNTER, recommendedDiscount?, rationale }',
    edgeCases: [
      'Instant acceptance if requested counter-discount is <= tier auto-approved ceiling',
      'Counter-proposal offering midway discount if customer request breaches ceiling but retains margin',
      'Rejection if requested price breaches the absolute margin floor',
    ],
    codeExcerpt: `export function evaluateNegotiation(ctx: NegotiationContext): NegotiationDecision {
  if (ctx.counterDiscountPercent <= ctx.tierMaxDiscount) {
    return { outcome: 'ACCEPT', rationale: 'Within customer tier authorized ceiling' };
  }

  const projectedMargin = calculateProjectedMargin(ctx.quote, ctx.counterDiscountPercent);
  if (projectedMargin < ctx.marginFloor) {
    return { outcome: 'REJECT', rationale: 'Requested price violates minimum margin floor of 15%' };
  }

  const midpoint = Math.round(((ctx.tierMaxDiscount + ctx.counterDiscountPercent) / 2) * 10) / 10;
  return { outcome: 'COUNTER', recommendedDiscount: midpoint, rationale: 'Counter-offer proposed at margin parity' };
}`,
  },
  {
    id: 'dealhealth',
    name: 'Deal Health Diagnostic Engine',
    file: 'src/lib/engines/deal-health.engine.ts',
    purpose: 'Monitors behavioral risk signals (stalling, approval aging, delivery slippage, counter-offer churn) over time.',
    inputs: 'DealHealthContext { quote, approvalAgeHours, daysSinceUpdate, counterOfferCount, deliveryDelayDays }',
    outputs: 'DealHealthReport { healthScore: 0..100, healthLevel: HEALTHY | WATCH | AT_RISK | CRITICAL, signals[] }',
    edgeCases: [
      'Independent from quote-risk: a healthy margin quote can become CRITICAL if stalled in approval',
      'Applies logarithmic decay to stall points up to maximum cap of 40',
      'Detects negotiation fatigue after 3+ counter-offers',
    ],
    codeExcerpt: `export function runDealHealthEngine(ctx: DealHealthContext): DealHealthReport {
  let score = 0;
  const signals: HealthSignalReason[] = [];

  // Stall factor
  if (ctx.daysSinceUpdate > 7) {
    const weeks = Math.floor(ctx.daysSinceUpdate / 7);
    const pts = Math.min(DEAL_HEALTH_THRESHOLDS.STALL_MAX_POINTS, weeks * DEAL_HEALTH_THRESHOLDS.STALL_POINTS_PER_WEEK);
    score += pts;
    signals.push({ signal: 'STALL', points: pts, message: \`Deal idle for \${ctx.daysSinceUpdate} days\` });
  }

  // Approval delay factor
  if (ctx.approvalAgeHours > DEAL_HEALTH_THRESHOLDS.APPROVAL_DELAY_HOURS) {
    score += DEAL_HEALTH_THRESHOLDS.APPROVAL_DELAY_POINTS;
    signals.push({ signal: 'APPROVAL_DELAY', points: DEAL_HEALTH_THRESHOLDS.APPROVAL_DELAY_POINTS, message: 'Approval pending > 48h' });
  }

  return { healthScore: score, healthLevel: resolveHealthBand(score), signals };
}`,
    thresholds: DEAL_HEALTH_THRESHOLDS,
  },
  {
    id: 'aiexplain',
    name: 'Deterministic AI Fallback Engine',
    file: 'src/lib/engines/ai-explanation.engine.ts',
    purpose: 'Generates structured, natural-language executive explanations of deal risk and approval routing without LLM calls.',
    inputs: 'AIExplanationContext { riskScore, riskLevel, riskReasons[], approvalRequired, requiredRoles[], total }',
    outputs: 'StructuredExplanation { summary, riskExplanation, approvalExplanation, recommendedAction }',
    edgeCases: [
      'Provides 100% deterministic, zero-latency explanations during LLM timeouts or offline demos',
      'Strictly maps risk severity messages into natural narrative paragraphs',
      'Zero hallucination risk: quotes exact thresholds and numbers directly from engine inputs',
    ],
    codeExcerpt: `export function buildDeterministicExplanation(ctx: AIExplanationContext): StructuredExplanation {
  const summary = \`Quotation has been assessed as \${ctx.riskLevel} risk (Score: \${ctx.riskScore}/100).\`;
  
  let riskExplanation = ctx.riskReasons.length > 0
    ? ctx.riskReasons.map(r => \`- \${r.message} [+\${r.points} pts]\`).join('\\n')
    : 'All pricing, discount, and inventory parameters fall within standard operational guidelines.';

  let approvalExplanation = ctx.approvalRequired
    ? \`Commercial escalation required: Sign-off mandated by \${ctx.requiredRoles.join(' and ')}.\`
    : 'No executive approval required. Quote is eligible for immediate customer confirmation.';

  return { summary, riskExplanation, approvalExplanation, recommendedAction: ctx.riskScore > 50 ? 'Review terms' : 'Proceed' };
}`,
  },
];

export function EngineCatalogSection() {
  const [selectedEngine, setSelectedEngine] = useState<string>('risk');

  const active = ENGINES_DATA.find(e => e.id === selectedEngine) || ENGINES_DATA[0];

  return (
    <section id="engines" className="card" style={{ border: '3px solid #000000', padding: '24px', background: '#ffffff' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Section 6.3 · Domain Logic Core
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Business-Engine Catalog (11 Pure Functions)
        </h2>
      </div>

      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
        The heart of DealFlow360 is a suite of 11 <strong>pure, side-effect-free engines</strong>. Each engine is a deterministic function that takes a strongly-typed input contract and returns a calculated result. They never touch a database, read environment variables, or make network calls.
      </p>

      {/* "Why Pure Functions?" Box */}
      <div
        style={{
          border: '2px solid #000000',
          background: '#fefce8',
          padding: '16px',
          marginBottom: '24px',
          boxShadow: '3px 3px 0px 0px #000000',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 6px 0' }}>
          💡 Why Pure Functions for Core Business Logic?
        </h3>
        <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: 1.5 }}>
          <strong>1. Testability:</strong> 100% test coverage with zero mocking or database setup. Run thousands of permutation tests in milliseconds.<br />
          <strong>2. Predictability & Auditing:</strong> The exact same input guarantees the exact same output. No state drift or race conditions.<br />
          <strong>3. Universal Execution:</strong> The same engine code powers server-side Next.js route handlers AND this client-side GitHub Pages demo without modifying a single line of business logic.
        </p>
      </div>

      {/* Engine Selection Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {ENGINES_DATA.map(engine => {
          const isSelected = selectedEngine === engine.id;
          return (
            <button
              key={engine.id}
              type="button"
              onClick={() => setSelectedEngine(engine.id)}
              style={{
                background: isSelected ? '#000000' : '#ffffff',
                color: isSelected ? '#ffffff' : '#000000',
                border: '2px solid #000000',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: isSelected ? '2px 2px 0px 0px #fbbf24' : 'none',
              }}
            >
              {engine.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Selected Engine Card */}
      <div
        style={{
          border: '3px solid #000000',
          padding: '24px',
          background: '#f8fafc',
          boxShadow: '4px 4px 0px 0px #000000',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 4px 0', textTransform: 'uppercase' }}>
              {active.name}
            </h3>
            <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>{active.purpose}</div>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#e2e8f0', padding: '4px 8px', border: '1px solid #94a3b8' }}>
            Source: {active.file}
          </span>
        </div>

        {/* Inputs & Outputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div style={{ background: '#ffffff', border: '2px solid #000', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#0369a1', textTransform: 'uppercase', marginBottom: '4px' }}>
              Input Contract (TypeScript)
            </div>
            <code style={{ fontSize: '12px', color: '#0f172a', wordBreak: 'break-word' }}>{active.inputs}</code>
          </div>

          <div style={{ background: '#ffffff', border: '2px solid #000', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#059669', textTransform: 'uppercase', marginBottom: '4px' }}>
              Output Result (TypeScript)
            </div>
            <code style={{ fontSize: '12px', color: '#0f172a', wordBreak: 'break-word' }}>{active.outputs}</code>
          </div>
        </div>

        {/* Live Imported Thresholds if available */}
        {active.thresholds && (
          <div style={{ marginBottom: '20px', background: '#fef3c7', border: '2px solid #000', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>
              Live-Imported Engine Thresholds & Constants
            </div>
            <pre style={{ margin: 0, fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', background: '#ffffff', padding: '8px', border: '1px solid #d97706' }}>
              {JSON.stringify(active.thresholds, null, 2)}
            </pre>
          </div>
        )}

        {/* Code Excerpt */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            Source Code Implementation (Excerpt)
          </div>
          <pre
            style={{
              background: '#0f172a',
              color: '#f8fafc',
              padding: '16px',
              border: '2px solid #000',
              fontSize: '12px',
              fontFamily: 'Consolas, Monaco, monospace',
              overflowX: 'auto',
              maxHeight: '260px',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            <code>{active.codeExcerpt}</code>
          </pre>
        </div>

        {/* Edge Cases */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            Boundary & Edge Cases Handled:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
            {active.edgeCases.map((ec, i) => (
              <li key={i}>{ec}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

