// src/demo/db/seed/builder.ts
/**
 * Master Seed Data Generator for DealFlow360 Static Demo.
 * Deterministic PRNG (Mulberry32, seed=360), index-based IDs,
 * pure business engine derivations at build time, 100% fictional data.
 */

import {
  type DemoDatabaseSchema,
  type User,
  type CustomerTier,
  type Customer,
  type CustomerInvite,
  type ProductCategory,
  type Product,
  type ProductVariant,
  type PriceList,
  type PriceListItem,
  type DiscountRule,
  type ApprovalRule,
  type SubscriptionPlan,
  type Warehouse,
  type Inventory,
  type Quote,
  type QuoteLine,
  type ApprovalRequest,
  type ApprovalAction,
  type Order,
  type FulfillmentAllocation,
  type Invoice,
  type Payment,
  type CreditNote,
  type Subscription,
  type BillingSchedule,
  type Negotiation,
  type NegotiationMessage,
  type DealHealthEvent,
  type Alert,
  type ProductCoPurchase,
  type UpsellRule,
  type AuditLog,
  type Notification,
  type QuoteStatus,
  type DealHealthLevel,
  type AlertSeverity,
} from '../schema';

import {
  BASE_QUOTE_IDS,
  BASE_ORDER_IDS,
  BASE_INVOICE_IDS,
  BASE_PRODUCT_IDS,
  BASE_SUBSCRIPTION_IDS,
  BASE_INVITE_TOKENS,
} from './ids';

import { createMulberry32, randInt, randChoice, randSample, padZero } from './prng';
import { FICTIONAL_COMPANIES, PRODUCT_CATALOG_TEMPLATES } from './fictional';

// Real pure business engines
import { resolvePricing } from '@/lib/engines/pricing.engine';
import { runDiscountEngine } from '@/lib/engines/discount.engine';
import { runMarginEngine } from '@/lib/engines/margin.engine';
import { runRiskEngine } from '@/lib/engines/risk.engine';
import { runApprovalEngine } from '@/lib/engines/approval.engine';
import { runDealHealthEngine } from '@/lib/engines/deal-health.engine';

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

function offsetDate(base: Date, daysOffset: number, hoursOffset = 0): string {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + daysOffset);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
}

export function generateSeedDatabase(now: Date = new Date()): { db: DemoDatabaseSchema; hash: string } {
  const rng = createMulberry32(360);

  // ---------------------------------------------------------------------------
  // 1. Users (16 users, 6 primary personas)
  // ---------------------------------------------------------------------------
  const users: User[] = [
    // 6 Primary Personas
    { id: 'usr_001', email: 'admin@acme-corp.example.com', name: 'Alex Morgan', role: 'ADMIN', active: true, createdAt: offsetDate(now, -365), updatedAt: offsetDate(now, -365) },
    { id: 'usr_002', email: 'sales@acme-corp.example.com', name: 'Sarah Jenkins', role: 'SALES_REP', active: true, createdAt: offsetDate(now, -365), updatedAt: offsetDate(now, -365) },
    { id: 'usr_003', email: 'manager@acme-corp.example.com', name: 'David Kim', role: 'SALES_MANAGER', active: true, createdAt: offsetDate(now, -365), updatedAt: offsetDate(now, -365) },
    { id: 'usr_004', email: 'finance@acme-corp.example.com', name: 'Elena Rostova', role: 'FINANCE', active: true, createdAt: offsetDate(now, -365), updatedAt: offsetDate(now, -365) },
    { id: 'usr_005', email: 'ops@acme-corp.example.com', name: 'Marcus Vance', role: 'OPERATIONS', active: true, createdAt: offsetDate(now, -365), updatedAt: offsetDate(now, -365) },
    { id: 'usr_006', email: 'customer@globex.example.com', name: 'Rachel Green', role: 'CUSTOMER', active: true, createdAt: offsetDate(now, -365), updatedAt: offsetDate(now, -365) },

    // Additional Team & Customer Users
    { id: 'usr_007', email: 'admin2@acme-corp.example.com', name: 'Jordan Lee', role: 'ADMIN', active: true, createdAt: offsetDate(now, -300), updatedAt: offsetDate(now, -300) },
    { id: 'usr_008', email: 'sales2@acme-corp.example.com', name: 'Priya Sharma', role: 'SALES_REP', active: true, createdAt: offsetDate(now, -280), updatedAt: offsetDate(now, -280) },
    { id: 'usr_009', email: 'sales3@acme-corp.example.com', name: 'Carlos Mendez', role: 'SALES_REP', active: true, createdAt: offsetDate(now, -240), updatedAt: offsetDate(now, -240) },
    { id: 'usr_010', email: 'sales4.inactive@acme-corp.example.com', name: 'Tom Offboarded', role: 'SALES_REP', active: false, createdAt: offsetDate(now, -365), updatedAt: offsetDate(now, -90) },
    { id: 'usr_011', email: 'manager2@acme-corp.example.com', name: 'Amina Khan', role: 'SALES_MANAGER', active: true, createdAt: offsetDate(now, -320), updatedAt: offsetDate(now, -320) },
    { id: 'usr_012', email: 'finance2@acme-corp.example.com', name: 'Robert Chen', role: 'FINANCE', active: true, createdAt: offsetDate(now, -310), updatedAt: offsetDate(now, -310) },
    { id: 'usr_013', email: 'ops2@acme-corp.example.com', name: 'Sanjay Gupta', role: 'OPERATIONS', active: true, createdAt: offsetDate(now, -300), updatedAt: offsetDate(now, -300) },
    { id: 'usr_014', email: 'customer2@northwind.example.com', name: 'Lisa Simpson', role: 'CUSTOMER', active: true, createdAt: offsetDate(now, -200), updatedAt: offsetDate(now, -200) },
    { id: 'usr_015', email: 'customer3@initech.example.com', name: 'Peter Gibbons', role: 'CUSTOMER', active: true, createdAt: offsetDate(now, -180), updatedAt: offsetDate(now, -180) },
    { id: 'usr_016', email: 'customer4@umbrella.example.com', name: 'Claire Redfield', role: 'CUSTOMER', active: true, createdAt: offsetDate(now, -150), updatedAt: offsetDate(now, -150) },
  ];

  // ---------------------------------------------------------------------------
  // 2. Customer Tiers (3 tiers: BRONZE, SILVER, GOLD)
  // ---------------------------------------------------------------------------
  const customerTiers: CustomerTier[] = [
    { id: 'tier_bronze', name: 'BRONZE', defaultDiscountPercent: 5, createdAt: offsetDate(now, -365) },
    { id: 'tier_silver', name: 'SILVER', defaultDiscountPercent: 10, createdAt: offsetDate(now, -365) },
    { id: 'tier_gold', name: 'GOLD', defaultDiscountPercent: 15, createdAt: offsetDate(now, -365) },
  ];

  // ---------------------------------------------------------------------------
  // 3. Product Categories (6 categories)
  // ---------------------------------------------------------------------------
  const categoryMaxDiscountMap: Record<string, number> = {
    cat_001: 20,
    cat_002: 15,
    cat_003: 15,
    cat_004: 25,
    cat_005: 12,
    cat_006: 10,
  };

  const productCategories: ProductCategory[] = [
    { id: 'cat_001', name: 'Laptops & Workstations', createdAt: offsetDate(now, -365) },
    { id: 'cat_002', name: 'Enterprise Servers', createdAt: offsetDate(now, -365) },
    { id: 'cat_003', name: 'Networking Hardware', createdAt: offsetDate(now, -365) },
    { id: 'cat_004', name: 'Office Peripherals', createdAt: offsetDate(now, -365) },
    { id: 'cat_005', name: 'Cloud Infrastructure & SaaS', createdAt: offsetDate(now, -365) },
    { id: 'cat_006', name: 'Managed Support Plans', createdAt: offsetDate(now, -365) },
  ];

  // ---------------------------------------------------------------------------
  // 4. Products (60 products)
  // ---------------------------------------------------------------------------
  const products: Product[] = PRODUCT_CATALOG_TEMPLATES.map((tmpl, index) => {
    const id = BASE_PRODUCT_IDS[index];
    const isInactive = index === 58 || index === 59;
    return {
      id,
      name: tmpl.name,
      sku: tmpl.sku,
      categoryId: tmpl.cat,
      type: tmpl.type as any,
      unit: 'UNIT',
      basePrice: tmpl.basePrice,
      costPrice: tmpl.costPrice,
      taxPercent: tmpl.taxPercent,
      description: `High-durability enterprise-grade ${tmpl.name.toLowerCase()} with full warranty support.`,
      active: !isInactive,
      createdAt: offsetDate(now, -365),
      updatedAt: offsetDate(now, -365),
    };
  });

  // ---------------------------------------------------------------------------
  // 5. Product Variants (40 variants)
  // ---------------------------------------------------------------------------
  const productVariants: ProductVariant[] = [];
  let variantIndex = 1;
  const variantOptions = [
    { suffix: 'RAM64', name: '64GB RAM Upgrade', extraPrice: 22000 },
    { suffix: 'SSD2TB', name: '2TB NVMe Gen4 Storage', extraPrice: 18000 },
    { suffix: 'DUALPWR', name: 'Redundant Titanium PSU', extraPrice: 25000 },
    { suffix: 'CLR-BLK', name: 'Midnight Matte Finish', extraPrice: 3500 },
  ];

  for (let i = 0; i < 20; i++) {
    const prod = products[i];
    for (let optIdx = 0; optIdx < 2; optIdx++) {
      if (variantIndex > 40) break;
      const opt = variantOptions[(i + optIdx) % variantOptions.length];
      productVariants.push({
        id: `var_${padZero(variantIndex)}`,
        productId: prod.id,
        sku: `${prod.sku}-${opt.suffix}`,
        name: `${prod.name} (${opt.name})`,
        extraPrice: opt.extraPrice,
        active: true,
        createdAt: offsetDate(now, -365),
      });
      variantIndex++;
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Price Lists & Items (3 price lists)
  // ---------------------------------------------------------------------------
  const priceLists: PriceList[] = [
    { id: 'pl_001', name: 'Standard Wholesale Commercial', currency: 'INR', description: 'Default commercial wholesale pricing', active: true, createdAt: offsetDate(now, -365) },
    { id: 'pl_002', name: 'Enterprise Strategic Partner Rate', currency: 'INR', description: 'Volume-committed premier enterprise accounts', active: true, createdAt: offsetDate(now, -365) },
    { id: 'pl_003', name: 'Public Sector & Education Catalog', currency: 'INR', description: 'Institutional framework rate sheet', active: true, createdAt: offsetDate(now, -365) },
  ];

  const priceListItems: PriceListItem[] = [];
  let pliIndex = 1;
  for (const pl of priceLists) {
    const discountMultiplier = pl.id === 'pl_002' ? 0.92 : pl.id === 'pl_003' ? 0.90 : 0.98;
    for (let pIdx = 0; pIdx < 12; pIdx++) {
      const prod = products[pIdx];
      priceListItems.push({
        id: `pli_${padZero(pliIndex++)}`,
        priceListId: pl.id,
        productId: prod.id,
        price: Math.round(prod.basePrice * discountMultiplier),
        createdAt: offsetDate(now, -365),
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Discount Rules (12 rules)
  // ---------------------------------------------------------------------------
  const discountRules: DiscountRule[] = [
    // Tier-only rules
    { id: 'disc_001', name: 'Gold Tier Default Rule', customerTierId: 'tier_gold', categoryId: null, maxDiscountPercent: 18, priority: 1, active: true, createdAt: offsetDate(now, -365) },
    { id: 'disc_002', name: 'Silver Tier Default Rule', customerTierId: 'tier_silver', categoryId: null, maxDiscountPercent: 12, priority: 2, active: true, createdAt: offsetDate(now, -365) },
    { id: 'disc_003', name: 'Bronze Tier Default Rule', customerTierId: 'tier_bronze', categoryId: null, maxDiscountPercent: 6, priority: 3, active: true, createdAt: offsetDate(now, -365) },

    // Category-only rules
    { id: 'disc_004', name: 'Laptops Standard Ceiling', customerTierId: null, categoryId: 'cat_001', maxDiscountPercent: 20, priority: 5, active: true, createdAt: offsetDate(now, -365) },
    { id: 'disc_005', name: 'Servers Standard Ceiling', customerTierId: null, categoryId: 'cat_002', maxDiscountPercent: 15, priority: 6, active: true, createdAt: offsetDate(now, -365) },
    { id: 'disc_006', name: 'Peripherals Promo Ceiling', customerTierId: null, categoryId: 'cat_004', maxDiscountPercent: 25, priority: 7, active: true, createdAt: offsetDate(now, -365) },

    // Combined Tier + Category rules
    { id: 'disc_007', name: 'Gold Tier Laptops Boost', customerTierId: 'tier_gold', categoryId: 'cat_001', maxDiscountPercent: 22, priority: 10, active: true, createdAt: offsetDate(now, -365) },
    { id: 'disc_008', name: 'Gold Tier Servers Boost', customerTierId: 'tier_gold', categoryId: 'cat_002', maxDiscountPercent: 18, priority: 11, active: true, createdAt: offsetDate(now, -365) },
    { id: 'disc_009', name: 'Silver Tier Laptops Standard', customerTierId: 'tier_silver', categoryId: 'cat_001', maxDiscountPercent: 16, priority: 12, active: true, createdAt: offsetDate(now, -365) },
    { id: 'disc_010', name: 'Silver Tier Peripherals', customerTierId: 'tier_silver', categoryId: 'cat_004', maxDiscountPercent: 20, priority: 13, active: true, createdAt: offsetDate(now, -365) },
    { id: 'disc_011', name: 'Bronze Tier Peripherals Cap', customerTierId: 'tier_bronze', categoryId: 'cat_004', maxDiscountPercent: 10, priority: 14, active: true, createdAt: offsetDate(now, -365) },
    { id: 'disc_012', name: 'Legacy Inactive Support Rule', customerTierId: 'tier_bronze', categoryId: 'cat_006', maxDiscountPercent: 8, priority: 15, active: false, createdAt: offsetDate(now, -365) },
  ];

  // ---------------------------------------------------------------------------
  // 8. Approval Rules (4 rules matching risk bands)
  // ---------------------------------------------------------------------------
  const approvalRules: ApprovalRule[] = [
    { id: 'appr_rule_001', name: 'Low Risk Auto-Approval', minRiskScore: 0, maxRiskScore: 9, requiredRoles: '[]', active: true, createdAt: offsetDate(now, -365) },
    { id: 'appr_rule_002', name: 'Medium Risk Sales Manager Escalation', minRiskScore: 10, maxRiskScore: 19, requiredRoles: '["SALES_MANAGER"]', active: true, createdAt: offsetDate(now, -365) },
    { id: 'appr_rule_003', name: 'High Risk Manager & Finance Sequential', minRiskScore: 20, maxRiskScore: 34, requiredRoles: '["SALES_MANAGER","FINANCE"]', active: true, createdAt: offsetDate(now, -365) },
    { id: 'appr_rule_004', name: 'Critical Risk Executive & Finance Required', minRiskScore: 35, maxRiskScore: 100, requiredRoles: '["SALES_MANAGER","FINANCE"]', active: true, createdAt: offsetDate(now, -365) },
  ];

  // ---------------------------------------------------------------------------
  // 9. Subscription Plans (8 plans)
  // ---------------------------------------------------------------------------
  const subscriptionPlans: SubscriptionPlan[] = [
    { id: 'plan_001', name: 'Enterprise Cloud VPC Monthly', frequency: 'MONTHLY', price: 45000, prorationEnabled: true, refundEnabled: true, active: true, createdAt: offsetDate(now, -365) },
    { id: 'plan_002', name: 'Enterprise Cloud VPC Annual', frequency: 'YEARLY', price: 480000, prorationEnabled: true, refundEnabled: true, active: true, createdAt: offsetDate(now, -365) },
    { id: 'plan_003', name: 'DataLake Analytics Monthly', frequency: 'MONTHLY', price: 65000, prorationEnabled: true, refundEnabled: false, active: true, createdAt: offsetDate(now, -365) },
    { id: 'plan_004', name: 'DataLake Analytics Quarterly', frequency: 'QUARTERLY', price: 185000, prorationEnabled: true, refundEnabled: false, active: true, createdAt: offsetDate(now, -365) },
    { id: 'plan_005', name: 'Kubernetes Container Mesh Monthly', frequency: 'MONTHLY', price: 75000, prorationEnabled: false, refundEnabled: false, active: true, createdAt: offsetDate(now, -365) },
    { id: 'plan_006', name: 'ZeroTrust Security 250-Seat Annual', frequency: 'YEARLY', price: 410000, prorationEnabled: true, refundEnabled: true, active: true, createdAt: offsetDate(now, -365) },
    { id: 'plan_007', name: '24x7 Mission-Critical Support Monthly', frequency: 'MONTHLY', price: 120000, prorationEnabled: true, refundEnabled: true, active: true, createdAt: offsetDate(now, -365) },
    { id: 'plan_008', name: 'AI-Ops Continuous Monitoring Annual', frequency: 'YEARLY', price: 620000, prorationEnabled: false, refundEnabled: false, active: true, createdAt: offsetDate(now, -365) },
  ];

  // ---------------------------------------------------------------------------
  // 10. Warehouses (5 warehouses, 1 inactive)
  // ---------------------------------------------------------------------------
  const warehouses: Warehouse[] = [
    { id: 'wh_001', code: 'WH-BLR', name: 'Bengaluru Central Distribution Hub', location: 'Bengaluru, Karnataka', shippingBaseCost: 1500, active: true, createdAt: offsetDate(now, -365) },
    { id: 'wh_002', code: 'WH-BOM', name: 'Mumbai Western Sea-Port Depot', location: 'Mumbai, Maharashtra', shippingBaseCost: 1800, active: true, createdAt: offsetDate(now, -365) },
    { id: 'wh_003', code: 'WH-DEL', name: 'NCR Northern Regional Logistics', location: 'Gurugram, Haryana', shippingBaseCost: 2000, active: true, createdAt: offsetDate(now, -365) },
    { id: 'wh_004', code: 'WH-HYD', name: 'Hyderabad Southern Tech Depot', location: 'Hyderabad, Telangana', shippingBaseCost: 1600, active: true, createdAt: offsetDate(now, -365) },
    { id: 'wh_005', code: 'WH-MAA', name: 'Chennai Coastal Transit Depot', location: 'Chennai, Tamil Nadu', shippingBaseCost: 2200, active: false, createdAt: offsetDate(now, -365) },
  ];

  // ---------------------------------------------------------------------------
  // 11. Inventory (~180 sparse rows across 4 active warehouses)
  // ---------------------------------------------------------------------------
  const inventory: Inventory[] = [];
  let invRowId = 1;
  const activeWarehouses = warehouses.filter(w => w.active);

  for (const wh of activeWarehouses) {
    for (const prod of products) {
      if (prod.type !== 'HARDWARE') continue;

      let onHand = randInt(rng, 15, 80);
      let reserved = randInt(rng, 0, Math.floor(onHand * 0.3));

      // Story 4 conditions:
      if (prod.sku === 'DEMO-NB-APEX16') {
        if (wh.code === 'WH-BLR') { onHand = 25; reserved = 0; }
        else if (wh.code === 'WH-BOM') { onHand = 20; reserved = 0; }
        else { onHand = 0; reserved = 0; }
      }

      if (prod.sku === 'DEMO-NB-QDUAL') {
        onHand = 0;
        reserved = 0;
      }

      const available = Math.max(0, onHand - reserved);
      inventory.push({
        id: `inv_row_${padZero(invRowId++)}`,
        warehouseId: wh.id,
        productId: prod.id,
        quantityAvailable: available,
        quantityReserved: reserved,
        updatedAt: offsetDate(now, -30),
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 12. Customers (30 customers: Gold, Silver, Bronze + 5 Edge Cases)
  // ---------------------------------------------------------------------------
  const customers: Customer[] = FICTIONAL_COMPANIES.map((comp, idx) => {
    const id = `cus_${padZero(idx + 1)}`;
    let tierId: string | null = comp.tier === 'GOLD' ? 'tier_gold' : comp.tier === 'SILVER' ? 'tier_silver' : comp.tier === 'BRONZE' ? 'tier_bronze' : null;
    let email: string | null = `contact@${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.example.com`;
    let portalUserId: string | null = null;

    if (idx === 0) portalUserId = 'usr_006'; // Rachel Green (Flagship customer Acme Global Ltd)
    if (idx === 1) portalUserId = 'usr_014'; // Lisa Simpson
    if (idx === 2) portalUserId = 'usr_015'; // Peter Gibbons
    if (idx === 3) portalUserId = 'usr_016'; // Claire Redfield

    // Edge Cases (indices 25 to 29):
    if (idx === 25) tierId = null; // No tier
    if (idx === 27) email = null; // No email
    const active = !comp.inactive; // Inactive customers

    return {
      id,
      companyName: comp.name,
      contactName: `Executive Sponsor ${idx + 1}`,
      email,
      tierId,
      currency: 'INR',
      active,
      portalUserId,
      createdAt: offsetDate(now, -365 + idx * 5),
      updatedAt: offsetDate(now, -10),
    };
  });

  // ---------------------------------------------------------------------------
  // 13. Customer Invites (8 invites with pre-rendered tokens)
  // ---------------------------------------------------------------------------
  const customerInvites: CustomerInvite[] = BASE_INVITE_TOKENS.map((token, idx) => {
    const cust = customers[idx % customers.length];
    const statuses: Array<'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'> = [
      'PENDING', 'PENDING', 'ACCEPTED', 'ACCEPTED', 'EXPIRED', 'REVOKED', 'PENDING', 'PENDING'
    ];
    return {
      id: `cinv_${padZero(idx + 1)}`,
      customerId: cust.id,
      email: `partner-invite-${idx + 1}@${cust.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.example.com`,
      token,
      status: statuses[idx],
      invitedById: 'usr_001',
      expiresAt: offsetDate(now, idx === 4 ? -10 : 30),
      acceptedAt: statuses[idx] === 'ACCEPTED' ? offsetDate(now, -5) : null,
      createdAt: offsetDate(now, -20),
    };
  });

  // ---------------------------------------------------------------------------
  // 14. Quotes & QuoteLines (120 quotes, 420+ lines)
  // ---------------------------------------------------------------------------
  const quotes: Quote[] = [];
  const quoteLines: QuoteLine[] = [];
  const approvalRequests: ApprovalRequest[] = [];
  const approvalActions: ApprovalAction[] = [];
  const negotiations: Negotiation[] = [];
  const negotiationMessages: NegotiationMessage[] = [];
  const orders: Order[] = [];
  const fulfillmentAllocations: FulfillmentAllocation[] = [];
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  const creditNotes: CreditNote[] = [];
  const subscriptions: Subscription[] = [];
  const billingSchedules: BillingSchedule[] = [];
  const dealHealthEvents: DealHealthEvent[] = [];
  const alerts: Alert[] = [];
  const auditLogs: AuditLog[] = [];
  const notifications: Notification[] = [];

  let qlineCounter = 1;
  let apprReqCounter = 1;
  let apprActCounter = 1;
  let negCounter = 1;
  let negMsgCounter = 1;
  let allocCounter = 1;
  let payCounter = 1;
  let cnCounter = 1;
  let schedCounter = 1;
  let dheCounter = 1;
  let alertCounter = 1;
  let auditCounter = 1;
  let notifCounter = 1;

  const salesReps = users.filter(u => u.role === 'SALES_REP');

  for (let qIdx = 0; qIdx < 120; qIdx++) {
    const quoteId = BASE_QUOTE_IDS[qIdx];
    const quoteNumber = `QTE-2025-${padZero(qIdx + 1)}`;
    const isScripted = qIdx < 8;

    const daysAgo = isScripted
      ? Math.max(1, 8 - qIdx)
      : Math.floor((120 - qIdx) * 3.2);

    const createdAt = offsetDate(now, -daysAgo, randInt(rng, 0, 8));
    const updatedAt = offsetDate(now, -Math.max(0, daysAgo - randInt(rng, 0, 2)), randInt(rng, 1, 4));

    let customer = customers[qIdx % 25];
    let salesRep = salesReps[qIdx % salesReps.length];

    if (qIdx === 0) { customer = customers[0]; salesRep = users[1]; }
    if (qIdx === 1) { customer = customers[1]; salesRep = users[1]; }
    if (qIdx === 2) { customer = customers[2]; salesRep = users[1]; }
    if (qIdx === 3) { customer = customers[3]; salesRep = users[1]; }
    if (qIdx === 4) { customer = customers[4]; salesRep = users[1]; }
    if (qIdx === 5) { customer = customers[5]; salesRep = users[1]; }
    if (qIdx === 6) { customer = customers[6]; salesRep = users[1]; }
    if (qIdx === 7) { customer = customers[0]; salesRep = users[1]; }

    const linesCount = isScripted && (qIdx === 0 || qIdx === 7) ? 2 : randInt(rng, 2, 5);
    const selectedProducts = randSample(rng, products.slice(0, 50), linesCount);

    if (qIdx === 2) {
      const thinProd = products.find(p => p.sku === 'DEMO-PER-THIN01') || products[39];
      selectedProducts[0] = thinProd;
    }
    if (qIdx === 3) {
      const unfulfillableProd = products.find(p => p.sku === 'DEMO-NB-QDUAL') || products[9];
      const apexProd = products.find(p => p.sku === 'DEMO-NB-APEX16') || products[0];
      selectedProducts[0] = apexProd;
      selectedProducts[1] = unfulfillableProd;
    }

    let requestedDiscountPercent = 5;
    if (qIdx === 0) requestedDiscountPercent = 10;
    else if (qIdx === 1) requestedDiscountPercent = 28;
    else if (qIdx === 2) requestedDiscountPercent = 18;
    else if (qIdx === 3) requestedDiscountPercent = 8;
    else if (qIdx === 4) requestedDiscountPercent = 18;
    else if (qIdx === 5) requestedDiscountPercent = 12;
    else if (qIdx === 6) requestedDiscountPercent = 10;
    else if (qIdx === 7) requestedDiscountPercent = 5;
    else {
      requestedDiscountPercent = randChoice(rng, [0, 5, 8, 10, 12, 15, 18, 22, 25]);
    }

    const quoteLineRecords: QuoteLine[] = [];
    const discountLineInputs: any[] = [];
    const marginLineInputs: any[] = [];

    for (let lIdx = 0; lIdx < selectedProducts.length; lIdx++) {
      const prod = selectedProducts[lIdx];
      const lineId = `qline_${padZero(qlineCounter++)}`;
      let qty = randInt(rng, 1, 8);

      if (qIdx === 3 && lIdx === 0) qty = 45;

      const pricing = resolvePricing({
        basePrice: prod.basePrice,
        costPrice: prod.costPrice,
        quantity: qty,
        taxPercent: prod.taxPercent,
      });

      const tierCeiling = customer.tierId === 'tier_gold' ? 18 : customer.tierId === 'tier_silver' ? 12 : 6;
      const categoryMax = categoryMaxDiscountMap[prod.categoryId || 'cat_001'] || 15;

      discountLineInputs.push({
        lineId,
        categoryId: prod.categoryId,
        requestedDiscountPercent,
        lineRevenue: pricing.subtotal,
        tierCeilingPercent: tierCeiling,
        categoryMaxPercent: categoryMax,
      });

      const discountAmount = round2(pricing.subtotal * (requestedDiscountPercent / 100));
      const lineTotal = round2(pricing.subtotal - discountAmount);
      const lineMarginAmount = round2(lineTotal - (prod.costPrice * qty));

      marginLineInputs.push({
        lineId,
        unitPrice: prod.basePrice,
        quantity: qty,
        discountPercent: requestedDiscountPercent,
        costPrice: prod.costPrice,
      });

      const billingType = prod.type === 'SUBSCRIPTION' ? 'RECURRING' : 'ONE_TIME';
      const subPlanId = prod.type === 'SUBSCRIPTION' ? subscriptionPlans[0].id : null;

      const qlRecord: QuoteLine = {
        id: lineId,
        quoteId,
        productId: prod.id,
        quantity: qty,
        unitPrice: prod.basePrice,
        discountPercent: requestedDiscountPercent,
        discountAmount,
        lineTotal,
        marginAmount: lineMarginAmount,
        billingType,
        subscriptionPlanId: subPlanId,
        createdAt,
      };

      quoteLineRecords.push(qlRecord);
      quoteLines.push(qlRecord);
    }

    const discountOutput = runDiscountEngine({ lines: discountLineInputs });
    const marginOutput = runMarginEngine({ lines: marginLineInputs });

    let warehouseCount = 1;
    let fullyFulfillable = true;
    if (qIdx === 3) {
      warehouseCount = 2;
      fullyFulfillable = false;
    } else if (qIdx % 7 === 0) {
      warehouseCount = 2;
    }

    const riskLines = quoteLineRecords.map(ql => {
      const p = products.find(pr => pr.id === ql.productId)!;
      const c = productCategories.find(cat => cat.id === p.categoryId)!;
      const dRes = discountOutput.lineResults.find(lr => lr.lineId === ql.id);
      return {
        lineId: ql.id,
        lineRevenue: ql.lineTotal,
        overagePercent: dRes ? dRes.overagePercent : 0,
        productName: p.name,
        categoryName: c ? c.name : 'General',
      };
    });

    const riskOutput = runRiskEngine({
      lines: riskLines,
      quoteMarginPercent: marginOutput.quoteMarginPercent,
      inventory: { warehouseCount, fullyFulfillable },
    });

    const lineOverages = discountOutput.lineResults.map(lr => {
      const ql = quoteLineRecords.find(l => l.id === lr.lineId)!;
      const p = products.find(pr => pr.id === ql.productId)!;
      return {
        lineId: lr.lineId,
        overagePercent: lr.overagePercent,
        productName: p.name,
      };
    });

    const approvalOutput = runApprovalEngine({
      riskLevel: riskOutput.level,
      lineOverages,
    });

    let status: QuoteStatus = 'CONFIRMED';
    if (qIdx === 0) status = 'CONFIRMED';
    else if (qIdx === 1) status = 'PENDING_APPROVAL';
    else if (qIdx === 2) status = 'PENDING_APPROVAL';
    else if (qIdx === 3) status = 'CONFIRMED';
    else if (qIdx === 4) status = 'NEGOTIATION';
    else if (qIdx === 5) status = 'DRAFT';
    else if (qIdx === 6) status = 'CONFIRMED';
    else if (qIdx === 7) status = 'DRAFT';
    else {
      if (daysAgo < 14) {
        status = randChoice(rng, ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'NEGOTIATION', 'CONFIRMED']);
      } else if (daysAgo < 45) {
        status = randChoice(rng, ['APPROVED', 'CONFIRMED', 'FULFILLING', 'CANCELLED']);
      } else {
        status = randChoice(rng, ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED']);
      }
    }

    const subtotal = round2(quoteLineRecords.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
    const discountAmount = round2(quoteLineRecords.reduce((sum, l) => sum + l.discountAmount, 0));
    const total = round2(subtotal - discountAmount);

    const quoteRecord: Quote = {
      id: quoteId,
      quoteNumber,
      customerId: customer.id,
      salesRepId: salesRep.id,
      status,
      subtotal,
      discountAmount,
      total,
      marginAmount: marginOutput.quoteMarginAmount,
      marginPercent: marginOutput.quoteMarginPercent,
      riskScore: riskOutput.score,
      riskLevel: riskOutput.level as DealHealthLevel,
      portalToken: `ptok_${quoteId}`,
      createdAt,
      updatedAt,
    };
    quotes.push(quoteRecord);

    // -------------------------------------------------------------------------
    // Deal Health Events (≥3 historical events per quote)
    // -------------------------------------------------------------------------
    const healthOutput = runDealHealthEngine({
      quoteId,
      daysSinceLastActivity: Math.max(0, daysAgo),
      repAvgDiscountPercent: 10,
      quoteDiscountPercent: requestedDiscountPercent,
      pendingApprovalAgeHours: status === 'PENDING_APPROVAL' ? 36 : null,
      warehouseCount,
      deliveryDateSlipped: status === 'CANCELLED',
      negotiationCounterCount: status === 'NEGOTIATION' ? 4 : 1,
    });

    for (let eIdx = 0; eIdx < 3; eIdx++) {
      const eDays = Math.max(0, daysAgo - (2 - eIdx) * 3);
      dealHealthEvents.push({
        id: `dhe_${padZero(dheCounter++)}`,
        quoteId,
        score: Math.min(100, Math.max(0, healthOutput.score + (eIdx - 1) * 4)),
        level: healthOutput.level as DealHealthLevel,
        reasons: JSON.stringify(healthOutput.reasons.map(r => r.message)),
        createdAt: offsetDate(now, -eDays),
      });
    }

    // -------------------------------------------------------------------------
    // Approvals
    // -------------------------------------------------------------------------
    if (approvalOutput.approvalRequired || qIdx === 1 || qIdx === 2) {
      if (qIdx === 1) {
        // Story 2: Two-Step Approval
        const req1: ApprovalRequest = {
          id: `appr_req_${padZero(apprReqCounter++)}`,
          quoteId,
          step: 1,
          role: 'SALES_MANAGER',
          status: 'APPROVED',
          reviewerId: 'usr_003',
          reason: 'Strategic enterprise growth account expansion justified by multi-year commitment.',
          actedAt: offsetDate(now, -daysAgo + 1),
          createdAt,
        };
        const req2: ApprovalRequest = {
          id: `appr_req_${padZero(apprReqCounter++)}`,
          quoteId,
          step: 2,
          role: 'FINANCE',
          status: 'PENDING',
          reviewerId: null,
          reason: null,
          actedAt: null,
          createdAt: offsetDate(now, -daysAgo + 1),
        };
        approvalRequests.push(req1, req2);

        approvalActions.push({
          id: `appr_act_${padZero(apprActCounter++)}`,
          approvalRequestId: req1.id,
          actorId: 'usr_003',
          action: 'APPROVED',
          reason: 'Managerial commercial sign-off complete.',
          createdAt: offsetDate(now, -daysAgo + 1),
        });
      } else if (qIdx === 5) {
        // Story 6: Revision requested
        const req: ApprovalRequest = {
          id: `appr_req_${padZero(apprReqCounter++)}`,
          quoteId,
          step: 1,
          role: 'SALES_MANAGER',
          status: 'REVISION_REQUESTED',
          reviewerId: 'usr_003',
          reason: 'Please reduce software line discount from 20% to 12% and switch payment terms to Net-30.',
          actedAt: offsetDate(now, -daysAgo + 1),
          createdAt,
        };
        approvalRequests.push(req);
        approvalActions.push({
          id: `appr_act_${padZero(apprActCounter++)}`,
          approvalRequestId: req.id,
          actorId: 'usr_003',
          action: 'REVISION_REQUESTED',
          reason: 'Commercial margin floor adjustment required.',
          createdAt: offsetDate(now, -daysAgo + 1),
        });
      } else {
        const reqStatus = status === 'APPROVED' || status === 'CONFIRMED' || status === 'COMPLETED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'PENDING';
        const req: ApprovalRequest = {
          id: `appr_req_${padZero(apprReqCounter++)}`,
          quoteId,
          step: 1,
          role: 'SALES_MANAGER',
          status: reqStatus,
          reviewerId: reqStatus !== 'PENDING' ? 'usr_003' : null,
          reason: reqStatus === 'APPROVED' ? 'Standard threshold compliance approved.' : null,
          actedAt: reqStatus !== 'PENDING' ? updatedAt : null,
          createdAt,
        };
        approvalRequests.push(req);
        if (reqStatus !== 'PENDING') {
          approvalActions.push({
            id: `appr_act_${padZero(apprActCounter++)}`,
            approvalRequestId: req.id,
            actorId: 'usr_003',
            action: reqStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED',
            reason: req.reason,
            createdAt: updatedAt,
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // Negotiations
    // -------------------------------------------------------------------------
    if (status === 'NEGOTIATION' || qIdx === 4) {
      const negId = `neg_${padZero(negCounter++)}`;
      const neg: Negotiation = {
        id: negId,
        quoteId,
        customerId: customer.id,
        status: qIdx === 4 ? 'SUBMITTED' : 'OPEN',
        proposedDiscount: requestedDiscountPercent + 6,
        message: 'We received a competing proposal offering a further 6% discount. Can DealFlow360 match this pricing?',
        createdAt,
      };
      negotiations.push(neg);

      negotiationMessages.push(
        {
          id: `neg_msg_${padZero(negMsgCounter++)}`,
          negotiationId: negId,
          quoteLineId: quoteLineRecords[0]?.id || null,
          authorRole: 'CUSTOMER',
          message: 'We received a competing proposal offering a further 6% discount. Can DealFlow360 match this pricing?',
          createdAt,
        },
        {
          id: `neg_msg_${padZero(negMsgCounter++)}`,
          negotiationId: negId,
          quoteLineId: quoteLineRecords[0]?.id || null,
          authorRole: 'SALES_REP',
          message: 'We can consider an additional discount if we extend the commitment term or bundle premium TAM support.',
          createdAt: offsetDate(now, -daysAgo + 1),
        },
        {
          id: `neg_msg_${padZero(negMsgCounter++)}`,
          negotiationId: negId,
          quoteLineId: quoteLineRecords[0]?.id || null,
          authorRole: 'CUSTOMER',
          message: 'Understood. We are submitting an 18% counter-offer for executive review.',
          createdAt: offsetDate(now, -daysAgo + 2),
        }
      );
    }

    // -------------------------------------------------------------------------
    // Orders, Allocations, Invoices, Payments
    // -------------------------------------------------------------------------
    const shouldCreateOrder = orders.length < 50 && (
      status === 'CONFIRMED' ||
      status === 'COMPLETED' ||
      qIdx === 0 ||
      qIdx === 3 ||
      qIdx === 6 ||
      qIdx >= 65
    );

    if (shouldCreateOrder) {
      const orderIdx = orders.length;
      const orderId = BASE_ORDER_IDS[orderIdx];
      const orderNumber = `ORD-2025-${padZero(orderIdx + 1)}`;
      const orderStatus = qIdx === 3 ? 'PARTIALLY_FULFILLED' : qIdx === 0 ? 'FULFILLED' : daysAgo < 7 ? 'FULFILLING' : 'FULFILLED';

      const ordRecord: Order = {
        id: orderId,
        quoteId,
        orderNumber,
        status: orderStatus,
        createdAt: offsetDate(now, -Math.max(0, daysAgo - 1)),
        updatedAt: offsetDate(now, -Math.max(0, daysAgo - 2)),
      };
      orders.push(ordRecord);

      for (const ql of quoteLineRecords) {
        if (qIdx === 3 && ql.productId === products[0].id) {
          // Story 4: Multi-warehouse split
          fulfillmentAllocations.push(
            {
              id: `alloc_${padZero(allocCounter++)}`,
              orderId,
              productId: ql.productId,
              warehouseId: 'wh_001',
              quantity: 25,
              shippingCost: 1500,
              status: 'DELIVERED',
              createdAt: ordRecord.createdAt,
            },
            {
              id: `alloc_${padZero(allocCounter++)}`,
              orderId,
              productId: ql.productId,
              warehouseId: 'wh_002',
              quantity: 20,
              shippingCost: 1800,
              status: 'DELIVERED',
              createdAt: ordRecord.createdAt,
            }
          );
        } else {
          fulfillmentAllocations.push({
            id: `alloc_${padZero(allocCounter++)}`,
            orderId,
            productId: ql.productId,
            warehouseId: 'wh_001',
            quantity: ql.quantity,
            shippingCost: 1500,
            status: orderStatus === 'FULFILLED' ? 'DELIVERED' : 'ALLOCATED',
            createdAt: ordRecord.createdAt,
          });
        }
      }

      // Order Invoices
      if (invoices.length < 70) {
        const invIdx = invoices.length;
        const invoiceId = BASE_INVOICE_IDS[invIdx];
        const invoiceNumber = `INV-2025-${padZero(invIdx + 1)}`;
        const invStatus = orderStatus === 'FULFILLED' ? 'PAID' : daysAgo > 30 ? 'PAID' : 'ISSUED';
        const dueDate = offsetDate(now, -daysAgo + 30);

        const invRecord: Invoice = {
          id: invoiceId,
          orderId,
          invoiceNumber,
          type: 'ONE_TIME',
          amount: total,
          status: invStatus,
          dueDate,
          createdAt: ordRecord.createdAt,
          updatedAt: ordRecord.updatedAt,
        };
        invoices.push(invRecord);

        if (invStatus === 'PAID' && payments.length < 60) {
          payments.push({
            id: `pay_${padZero(payCounter++)}`,
            invoiceId,
            amount: total,
            method: randChoice(rng, ['BANK_TRANSFER', 'CREDIT_CARD', 'UPI']),
            reference: `REF-PAY-${padZero(payCounter + 1000, 6)}`,
            createdAt: offsetDate(now, -Math.max(0, daysAgo - 15)),
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // Subscriptions & Billing Schedules
    // -------------------------------------------------------------------------
    const recurringLine = quoteLineRecords.find(l => l.billingType === 'RECURRING');
    if (recurringLine && subscriptions.length < 25) {
      const subIdx = subscriptions.length;
      const subId = BASE_SUBSCRIPTION_IDS[subIdx];
      const plan = subscriptionPlans[subIdx % subscriptionPlans.length];
      const isCancelled = qIdx === 6 || qIdx === 14;

      const subRecord: Subscription = {
        id: subId,
        orderId: orders[subIdx] ? orders[subIdx].id : null,
        quoteLineId: recurringLine.id,
        subscriptionPlanId: plan.id,
        quantity: recurringLine.quantity,
        status: isCancelled ? 'CANCELLED' : 'ACTIVE',
        startedAt: createdAt,
        endedAt: isCancelled ? offsetDate(now, -10) : null,
        createdAt,
        updatedAt,
      };
      subscriptions.push(subRecord);

      // Subscription Recurring Invoices to meet >= 70 invoice threshold
      let subInvoiceId: string | null = null;
      if (invoices.length < 70) {
        const invIdx = invoices.length;
        subInvoiceId = BASE_INVOICE_IDS[invIdx];
        const invNumber = `INV-2025-${padZero(invIdx + 1)}`;
        invoices.push({
          id: subInvoiceId,
          orderId: subRecord.orderId,
          invoiceNumber: invNumber,
          type: 'RECURRING',
          amount: plan.price,
          status: 'PAID',
          dueDate: offsetDate(now, -15),
          createdAt,
          updatedAt,
        });

        if (payments.length < 60) {
          payments.push({
            id: `pay_${padZero(payCounter++)}`,
            invoiceId: subInvoiceId,
            amount: plan.price,
            method: 'BANK_TRANSFER',
            reference: `REF-SUB-${padZero(payCounter + 1000, 6)}`,
            createdAt: offsetDate(now, -10),
          });
        }
      }

      for (let sIdx = 0; sIdx < 6; sIdx++) {
        if (billingSchedules.length >= 150) break;
        const bDate = offsetDate(new Date(createdAt), sIdx * 30);
        const isPast = new Date(bDate) < now;
        billingSchedules.push({
          id: `sched_${padZero(schedCounter++)}`,
          subscriptionId: subId,
          invoiceId: isPast ? subInvoiceId : null,
          billingDate: bDate,
          amount: plan.price,
          status: isPast ? 'PAID' : 'PENDING',
          createdAt,
        });
      }

      // Credit Notes (up to 6)
      if (creditNotes.length < 6) {
        creditNotes.push({
          id: `cn_${padZero(cnCounter++)}`,
          invoiceId: subInvoiceId,
          subscriptionId: subId,
          amount: 15000,
          reason: 'Prorated refund for unutilized cloud VPC enterprise subscription balance.',
          createdAt: offsetDate(now, -10),
        });
      }
    }

    // -------------------------------------------------------------------------
    // Audit Logs (up to 650)
    // -------------------------------------------------------------------------
    if (auditLogs.length < 650) {
      auditLogs.push(
        {
          id: `aud_${padZero(auditCounter++)}`,
          entityType: 'Quote',
          entityId: quoteId,
          action: 'CREATE',
          actorId: salesRep.id,
          beforeData: null,
          afterData: JSON.stringify({ quoteNumber, total, status: 'DRAFT' }),
          reason: 'Initial quote draft created.',
          createdAt,
        },
        {
          id: `aud_${padZero(auditCounter++)}`,
          entityType: 'Quote',
          entityId: quoteId,
          action: 'EVALUATE',
          actorId: salesRep.id,
          beforeData: JSON.stringify({ status: 'DRAFT' }),
          afterData: JSON.stringify({ riskScore: riskOutput.score, riskLevel: riskOutput.level }),
          reason: 'Pricing, discount and risk engines evaluated.',
          createdAt: offsetDate(now, -daysAgo, 1),
        },
        {
          id: `aud_${padZero(auditCounter++)}`,
          entityType: 'Quote',
          entityId: quoteId,
          action: 'SUBMIT',
          actorId: salesRep.id,
          beforeData: JSON.stringify({ status: 'DRAFT' }),
          afterData: JSON.stringify({ status: 'PENDING_APPROVAL' }),
          reason: 'Submitted quote for commercial approvals.',
          createdAt: offsetDate(now, -daysAgo, 2),
        },
        {
          id: `aud_${padZero(auditCounter++)}`,
          entityType: 'Quote',
          entityId: quoteId,
          action: 'STATUS_UPDATE',
          actorId: salesRep.id,
          beforeData: JSON.stringify({ status: 'DRAFT' }),
          afterData: JSON.stringify({ status }),
          reason: `Transitioned status to ${status}.`,
          createdAt: updatedAt,
        },
        {
          id: `aud_${padZero(auditCounter++)}`,
          entityType: 'DealHealth',
          entityId: quoteId,
          action: 'HEALTH_INDEXED',
          actorId: 'usr_001',
          beforeData: null,
          afterData: JSON.stringify({ healthLevel: healthOutput.level, score: healthOutput.score }),
          reason: 'Deal health telemetry background scan complete.',
          createdAt: updatedAt,
        }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 15. Product Co-Purchases & Upsell Rules (80 co-purchases, 20 rules)
  // ---------------------------------------------------------------------------
  const productCoPurchases: ProductCoPurchase[] = [];
  let copCounter = 1;
  for (let i = 0; i < 40; i++) {
    const prodA = products[i];
    const prodB = products[(i + 10) % products.length];
    const prodC = products[(i + 20) % products.length];

    productCoPurchases.push(
      {
        id: `cop_${padZero(copCounter++)}`,
        productId: prodA.id,
        coProductId: prodB.id,
        frequency: randInt(rng, 15, 65),
      },
      {
        id: `cop_${padZero(copCounter++)}`,
        productId: prodA.id,
        coProductId: prodC.id,
        frequency: randInt(rng, 10, 45),
      }
    );
  }

  const upsellRules: UpsellRule[] = [];
  let upsellCounter = 1;
  for (let i = 0; i < 20; i++) {
    const mainProd = products[i];
    const upsellProd = products[(i + 15) % products.length];
    upsellRules.push({
      id: `upsell_${padZero(upsellCounter++)}`,
      productId: mainProd.id,
      suggestedProductId: upsellProd.id,
      promotion: i % 2 === 0,
      minMarginPercent: 20,
      active: true,
      createdAt: offsetDate(now, -365),
    });
  }

  // ---------------------------------------------------------------------------
  // 16. Alerts (25 alerts)
  // ---------------------------------------------------------------------------
  const alertMessages = [
    'Margin floor breached on quotation peripheral bundle.',
    'Multi-warehouse split required for volume shipment.',
    'Approval pending exceeding 24 hours on enterprise server deal.',
    'Unfulfillable hardware line detected: Dual-Screen Laptop stock depleted.',
    'Customer counter-offer submitted on portal awaiting review.',
    'Inventory replenishment threshold reached at Bengaluru Central Hub.',
  ];

  for (let aIdx = 0; aIdx < 25; aIdx++) {
    const sev: AlertSeverity = aIdx % 3 === 0 ? 'HIGH' : aIdx % 2 === 0 ? 'MEDIUM' : 'LOW';
    alerts.push({
      id: `alt_${padZero(alertCounter++)}`,
      quoteId: quotes[aIdx % quotes.length].id,
      type: 'QUOTE_RISK',
      severity: sev,
      message: alertMessages[aIdx % alertMessages.length],
      acknowledged: aIdx > 15,
      createdAt: offsetDate(now, -Math.floor(aIdx * 1.5)),
    });
  }

  // ---------------------------------------------------------------------------
  // 17. Notifications (40 notifications across personas)
  // ---------------------------------------------------------------------------
  for (let nIdx = 0; nIdx < 40; nIdx++) {
    const targetUser = users[nIdx % users.length];
    notifications.push({
      id: `notif_${padZero(notifCounter++)}`,
      recipientId: targetUser.id,
      type: nIdx % 2 === 0 ? 'APPROVAL_REQUEST' : 'DEAL_UPDATE',
      message: nIdx % 2 === 0
        ? `Quotation ${quotes[nIdx % quotes.length].quoteNumber} has been assigned for your commercial approval.`
        : `Customer status updated on order ORD-2025-${padZero((nIdx % 30) + 1)}.`,
      read: nIdx > 20,
      createdAt: offsetDate(now, -Math.floor(nIdx * 0.8)),
    });
  }

  const db: DemoDatabaseSchema = {
    User: users,
    CustomerTier: customerTiers,
    Customer: customers,
    CustomerInvite: customerInvites,
    ProductCategory: productCategories,
    Product: products,
    ProductVariant: productVariants,
    PriceList: priceLists,
    PriceListItem: priceListItems,
    DiscountRule: discountRules,
    ApprovalRule: approvalRules,
    SubscriptionPlan: subscriptionPlans,
    Warehouse: warehouses,
    Inventory: inventory,
    Quote: quotes,
    QuoteLine: quoteLines,
    ApprovalRequest: approvalRequests,
    ApprovalAction: approvalActions,
    Order: orders,
    FulfillmentAllocation: fulfillmentAllocations,
    Invoice: invoices,
    Payment: payments,
    CreditNote: creditNotes,
    Subscription: subscriptions,
    BillingSchedule: billingSchedules,
    Negotiation: negotiations,
    NegotiationMessage: negotiationMessages,
    DealHealthEvent: dealHealthEvents,
    Alert: alerts,
    ProductCoPurchase: productCoPurchases,
    UpsellRule: upsellRules,
    AuditLog: auditLogs,
    Notification: notifications,
  };

  const hash = `df360-seed-v1-${quotes.length}-${products.length}-${orders.length}`;
  return { db, hash };
}
