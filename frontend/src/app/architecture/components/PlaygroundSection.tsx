// src/app/architecture/components/PlaygroundSection.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { resolvePricing } from '@/lib/engines/pricing.engine';
import { runDiscountEngine } from '@/lib/engines/discount.engine';
import { runMarginEngine } from '@/lib/engines/margin.engine';
import { runRiskEngine } from '@/lib/engines/risk.engine';
import { runApprovalEngine } from '@/lib/engines/approval.engine';
import { runDealHealthEngine } from '@/lib/engines/deal-health.engine';

interface Preset {
  name: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  product: 'laptop' | 'server' | 'monitor' | 'support';
  qty: number;
  discountPct: number;
  wh1Stock: number;
  wh2Stock: number;
}

const PRESETS: Record<string, Preset> = {
  safe: {
    name: 'Safe Deal (Standard)',
    tier: 'GOLD',
    product: 'laptop',
    qty: 5,
    discountPct: 8,
    wh1Stock: 20,
    wh2Stock: 10,
  },
  deep: {
    name: 'Discount Too Deep (Margin Floor Breach)',
    tier: 'SILVER',
    product: 'monitor',
    qty: 12,
    discountPct: 35,
    wh1Stock: 15,
    wh2Stock: 10,
  },
  outofstock: {
    name: 'Out of Stock (Multi-Warehouse / Split)',
    tier: 'BRONZE',
    product: 'server',
    qty: 25,
    discountPct: 5,
    wh1Stock: 10,
    wh2Stock: 5,
  },
};

const PRODUCTS = {
  laptop: { name: 'ApexBook Pro 16" Workstation', basePrice: 185000, cost: 135000, categoryId: 'cat_hw' },
  server: { name: 'TitanCore 2U Rack Server', basePrice: 420000, cost: 310000, categoryId: 'cat_hw' },
  monitor: { name: 'UltraView 34" Curved Studio Monitor', basePrice: 48000, cost: 41000, categoryId: 'cat_periph' },
  support: { name: '24/7 Mission-Critical Support Plan (1 Yr)', basePrice: 75000, cost: 25000, categoryId: 'cat_serv' },
};

const TIERS = {
  BRONZE: { id: 'tier_bronze', name: 'Bronze', defaultDiscountPercent: 5, minMarginPercent: 15 },
  SILVER: { id: 'tier_silver', name: 'Silver', defaultDiscountPercent: 10, minMarginPercent: 15 },
  GOLD: { id: 'tier_gold', name: 'Gold', defaultDiscountPercent: 15, minMarginPercent: 15 },
};

export function PlaygroundSection() {
  const [tierKey, setTierKey] = useState<'BRONZE' | 'SILVER' | 'GOLD'>('GOLD');
  const [prodKey, setProdKey] = useState<'laptop' | 'server' | 'monitor' | 'support'>('laptop');
  const [quantity, setQuantity] = useState<number>(5);
  const [discountPercent, setDiscountPercent] = useState<number>(8);
  const [wh1Stock, setWh1Stock] = useState<number>(20);
  const [wh2Stock, setWh2Stock] = useState<number>(10);

  const applyPreset = (key: keyof typeof PRESETS) => {
    const p = PRESETS[key];
    setTierKey(p.tier);
    setProdKey(p.product);
    setQuantity(p.qty);
    setDiscountPercent(p.discountPct);
    setWh1Stock(p.wh1Stock);
    setWh2Stock(p.wh2Stock);
  };

  const product = PRODUCTS[prodKey];
  const tier = TIERS[tierKey];

  // Pure Client Waterfall Computation
  const waterfall = useMemo(() => {
    // 1. Pricing Engine
    const pricing = resolvePricing({
      basePrice: product.basePrice,
      costPrice: product.cost,
      quantity,
      taxPercent: 18,
    });

    // 2. Discount Engine
    const discount = runDiscountEngine({
      lines: [
        {
          lineId: 'line_1',
          categoryId: product.categoryId,
          requestedDiscountPercent: discountPercent,
          lineRevenue: pricing.subtotal,
          tierCeilingPercent: tier.defaultDiscountPercent,
          categoryMaxPercent: 20,
        },
      ],
    });

    // 3. Margin Engine
    const margin = runMarginEngine({
      lines: [
        {
          lineId: 'line_1',
          unitPrice: pricing.unitPrice,
          quantity,
          discountPercent,
          costPrice: product.cost,
        },
      ],
    });

    const isFloorBreached = margin.quoteMarginPercent < tier.minMarginPercent;

    // Fulfillment stock checks
    const totalNetworkStock = wh1Stock + wh2Stock;
    const isSingleSufficient = wh1Stock >= quantity || wh2Stock >= quantity;
    const isSplitRequired = !isSingleSufficient && totalNetworkStock >= quantity;
    const isUnfulfillable = totalNetworkStock < quantity;

    // 4. Risk Engine
    const risk = runRiskEngine({
      lines: [
        {
          lineId: 'line_1',
          lineRevenue: margin.quoteTotalRevenue,
          overagePercent: discount.lineResults[0]?.overagePercent ?? 0,
          productName: product.name,
          categoryName: product.categoryId,
        },
      ],
      quoteMarginPercent: margin.quoteMarginPercent,
      inventory: {
        warehouseCount: isSplitRequired ? 2 : 1,
        fullyFulfillable: !isUnfulfillable,
      },
    });

    // 5. Approval Engine
    const approval = runApprovalEngine({
      riskLevel: risk.level,
      lineOverages: discount.lineResults.map(l => ({
        lineId: l.lineId,
        overagePercent: l.overagePercent,
        productName: product.name,
      })),
    });

    // 6. Deal Health Engine
    const dealHealth = runDealHealthEngine({
      quoteId: 'demo_quote',
      daysSinceLastActivity: 2,
      repAvgDiscountPercent: 10,
      quoteDiscountPercent: discountPercent,
      pendingApprovalAgeHours: approval.approvalRequired ? 12 : null,
      warehouseCount: isSplitRequired ? 2 : 1,
      deliveryDateSlipped: false,
      negotiationCounterCount: 0,
    });

    return {
      pricing,
      discount,
      margin,
      isFloorBreached,
      risk,
      approval,
      dealHealth,
      isSplitRequired,
      isUnfulfillable,
    };
  }, [product, tier, quantity, discountPercent, wh1Stock, wh2Stock]);

  return (
    <section id="playground" className="card" style={{ border: '3px solid #000000', padding: '24px', background: '#ffffff' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Section 6.4 · Interactive Computation
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Interactive Business Engine Playground
        </h2>
      </div>

      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
        Move the sliders or select a scenario preset below. The real pure business engines execute synchronously on every input change, rendering the complete commercial waterfall in real time with zero network latency.
      </p>

      {/* Preset Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Scenario Presets:</span>
        <button
          type="button"
          onClick={() => applyPreset('safe')}
          style={{
            background: '#dcfce7',
            color: '#166534',
            border: '2px solid #000000',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ✓ Safe Deal (Auto-Approved)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('deep')}
          style={{
            background: '#fef3c7',
            color: '#9a3412',
            border: '2px solid #000000',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ⚠ Discount Too Deep (Floor Breach)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('outofstock')}
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            border: '2px solid #000000',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ⚡ Out of Stock (Warehouse Split)
        </button>
      </div>

      {/* Form Controls & Waterfall Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Form Controls */}
        <div style={{ background: '#f8fafc', border: '3px solid #000000', padding: '20px', boxShadow: '4px 4px 0px 0px #000000' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '16px' }}>
            Deal Parameters
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            {/* Customer Tier */}
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '4px' }}>
                Customer Tier (Ceiling: {tier.defaultDiscountPercent}%):
              </label>
              <select
                value={tierKey}
                onChange={e => setTierKey(e.target.value as any)}
                style={{ width: '100%', padding: '6px', border: '2px solid #000', fontWeight: 700 }}
              >
                <option value="GOLD">Gold Tier (15% Ceiling, 15% Min Margin)</option>
                <option value="SILVER">Silver Tier (10% Ceiling, 15% Min Margin)</option>
                <option value="BRONZE">Bronze Tier (5% Ceiling, 15% Min Margin)</option>
              </select>
            </div>

            {/* Product Selection */}
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '4px' }}>
                Catalog Product:
              </label>
              <select
                value={prodKey}
                onChange={e => setProdKey(e.target.value as any)}
                style={{ width: '100%', padding: '6px', border: '2px solid #000', fontWeight: 700 }}
              >
                <option value="laptop">ApexBook Pro 16" (Base: ₹1,85,000 / Cost: ₹1,35,000)</option>
                <option value="server">TitanCore 2U Rack Server (Base: ₹4,20,000 / Cost: ₹3,10,000)</option>
                <option value="monitor">UltraView 34" Monitor (Base: ₹48,000 / Cost: ₹41,000)</option>
                <option value="support">24/7 Support Plan (Base: ₹75,000 / Cost: ₹25,000)</option>
              </select>
            </div>

            {/* Quantity Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginBottom: '4px' }}>
                <span>Order Quantity:</span>
                <span style={{ fontFamily: 'monospace' }}>{quantity} units</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            {/* Discount Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginBottom: '4px' }}>
                <span>Requested Discount:</span>
                <span style={{ fontFamily: 'monospace', color: discountPercent > tier.defaultDiscountPercent ? '#dc2626' : '#166534' }}>
                  {discountPercent}% {discountPercent > tier.defaultDiscountPercent && `(Exceeds ${tier.defaultDiscountPercent}% Ceiling)`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={discountPercent}
                onChange={e => setDiscountPercent(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            {/* Warehouse Stock Controls */}
            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '10px' }}>
              <div style={{ fontWeight: 800, marginBottom: '6px', fontSize: '12px' }}>Warehouse Stock Allocation:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>Mumbai WH1: {wh1Stock}</div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={wh1Stock}
                    onChange={e => setWh1Stock(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>Bengaluru WH2: {wh2Stock}</div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={wh2Stock}
                    onChange={e => setWh2Stock(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Engine Waterfall Results */}
        <div style={{ background: '#ffffff', border: '3px solid #000000', padding: '20px', boxShadow: '4px 4px 0px 0px #000000' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '16px' }}>
            Engine Evaluation Waterfall
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            {/* Financial Totals */}
            <div style={{ background: '#f8fafc', border: '2px solid #000', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#475569' }}>Gross Base Value:</span>
                <strong style={{ fontFamily: 'monospace' }}>
                  ₹{(product.basePrice * quantity).toLocaleString('en-IN')}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#dc2626' }}>
                <span>Discount Applied ({discountPercent}%):</span>
                <span style={{ fontFamily: 'monospace' }}>
                  - ₹{(product.basePrice * quantity * (discountPercent / 100)).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
                <span style={{ fontWeight: 800 }}>Net Deal Revenue:</span>
                <strong style={{ fontFamily: 'monospace', fontSize: '15px', color: '#0f172a' }}>
                  ₹{Math.round(waterfall.margin.quoteTotalRevenue).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Margin Engine Result */}
            <div
              style={{
                background: waterfall.isFloorBreached ? '#fee2e2' : '#f0fdf4',
                border: '2px solid #000',
                padding: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800 }}>Gross Margin:</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 900,
                    fontSize: '14px',
                    color: waterfall.isFloorBreached ? '#dc2626' : '#166534',
                  }}
                >
                  {waterfall.margin.quoteMarginPercent}% {waterfall.isFloorBreached ? '⛔ FLOOR BREACH (<15%)' : '✓ HEALTHY'}
                </span>
              </div>
            </div>

            {/* Risk Engine Score */}
            <div style={{ background: '#f8fafc', border: '2px solid #000', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 800 }}>Risk Score & Level:</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    border: '1.5px solid #000',
                    background:
                      waterfall.risk.level === 'CRITICAL'
                        ? '#fee2e2'
                        : waterfall.risk.level === 'HIGH'
                        ? '#fed7aa'
                        : waterfall.risk.level === 'MEDIUM'
                        ? '#fef08a'
                        : '#dcfce7',
                    color: '#000',
                  }}
                >
                  {waterfall.risk.score}/100 · {waterfall.risk.level}
                </span>
              </div>

              {/* Reasons Breakdown */}
              {waterfall.risk.reasons.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                  {waterfall.risk.reasons.map((r, i) => (
                    <div key={i} style={{ fontSize: '11px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                      <span>• {r.component}: {r.severity} severity</span>
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>+{r.points} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#166534' }}>✓ No risk penalty points detected</div>
              )}
            </div>

            {/* Approval Routing */}
            <div style={{ background: '#f8fafc', border: '2px solid #000', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800 }}>Approval Escalation:</span>
                <span style={{ fontSize: '11px', fontWeight: 900 }}>
                  {waterfall.approval.approvalRequired
                    ? `Required (${waterfall.approval.requiredRoles.join(' → ')})`
                    : 'Auto-Approved (None Required)'}
                </span>
              </div>
            </div>

            {/* Deal Health Level */}
            <div style={{ background: '#f8fafc', border: '2px solid #000', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800 }}>Deal Health Level:</span>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#0369a1' }}>
                  {waterfall.dealHealth.level} (Score: {waterfall.dealHealth.score})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

