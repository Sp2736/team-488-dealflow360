// src/demo/db/seed/index.ts
/**
 * Entry point for Deterministic Relational Seed Data Flood.
 * Exports buildSeed, runs self-check validation, and registers
 * the generator with store.ts.
 */

import { type DemoDatabaseSchema, TABLE_NAMES } from '../schema';
import { registerSeedGenerator } from '../store';
import { generateSeedDatabase } from './builder';

export * from './ids';
export * from './prng';
export * from './stories';

export interface SeedSelfCheckResult {
  passed: boolean;
  durationMs: number;
  tableCounts: Record<string, number>;
  errors: string[];
}

/**
 * Builds the deterministic seed database anchored to `now`.
 */
export function buildSeed(now: Date = new Date()): { db: DemoDatabaseSchema; hash: string } {
  return generateSeedDatabase(now);
}

/**
 * Validates referential integrity, volume thresholds, and business engine invariants.
 */
export function runSeedSelfCheck(db: DemoDatabaseSchema): SeedSelfCheckResult {
  const start = Date.now();
  const errors: string[] = [];
  const tableCounts: Record<string, number> = {};

  // 1. Table existence and counts
  for (const table of TABLE_NAMES) {
    const rows = db[table] || [];
    tableCounts[table] = rows.length;
    if (rows.length === 0) {
      errors.push(`Table ${table} is completely empty.`);
    }
  }

  // 2. Minimum Volume Checks per Phase 3.3 Specs
  const minThresholds: Record<string, number> = {
    CustomerTier: 3,
    ProductCategory: 6,
    Product: 60,
    ProductVariant: 40,
    PriceList: 3,
    DiscountRule: 12,
    ApprovalRule: 4,
    SubscriptionPlan: 8,
    Customer: 30,
    CustomerInvite: 8,
    Warehouse: 5,
    Quote: 120,
    QuoteLine: 400,
    Order: 50,
    Invoice: 70,
    Payment: 60,
    CreditNote: 6,
    Subscription: 25,
    BillingSchedule: 150,
    DealHealthEvent: 300,
    Alert: 25,
    ProductCoPurchase: 80,
    UpsellRule: 20,
    AuditLog: 600,
    Notification: 40,
  };

  for (const [table, min] of Object.entries(minThresholds)) {
    const count = tableCounts[table] || 0;
    if (count < min) {
      errors.push(`Volume check failed for ${table}: expected >= ${min}, found ${count}`);
    }
  }

  // 3. Referential Integrity Checks
  const userIds = new Set(db.User.map(u => u.id));
  const customerIds = new Set(db.Customer.map(c => c.id));
  const productIds = new Set(db.Product.map(p => p.id));
  const quoteIds = new Set(db.Quote.map(q => q.id));
  const orderIds = new Set(db.Order.map(o => o.id));
  const invoiceIds = new Set(db.Invoice.map(i => i.id));
  const warehouseIds = new Set(db.Warehouse.map(w => w.id));

  // Quotes FKs
  for (const q of db.Quote) {
    if (!customerIds.has(q.customerId)) {
      errors.push(`Quote ${q.id} references missing customer ${q.customerId}`);
    }
    if (!userIds.has(q.salesRepId)) {
      errors.push(`Quote ${q.id} references missing sales rep ${q.salesRepId}`);
    }
  }

  // QuoteLines FKs & Line Sum Invariants
  const linesByQuote = new Map<string, typeof db.QuoteLine>();
  for (const ql of db.QuoteLine) {
    if (!quoteIds.has(ql.quoteId)) {
      errors.push(`QuoteLine ${ql.id} references missing quote ${ql.quoteId}`);
    }
    if (!productIds.has(ql.productId)) {
      errors.push(`QuoteLine ${ql.id} references missing product ${ql.productId}`);
    }
    const arr = linesByQuote.get(ql.quoteId) || [];
    arr.push(ql);
    linesByQuote.set(ql.quoteId, arr);
  }

  for (const q of db.Quote) {
    const lines = linesByQuote.get(q.id) || [];
    if (lines.length === 0) {
      errors.push(`Quote ${q.id} has no lines.`);
      continue;
    }
    const computedSubtotal = Math.round(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) * 100) / 100;
    const computedDiscount = Math.round(lines.reduce((sum, l) => sum + l.discountAmount, 0) * 100) / 100;
    const computedTotal = Math.round((computedSubtotal - computedDiscount) * 100) / 100;

    if (Math.abs(computedSubtotal - q.subtotal) > 0.05) {
      errors.push(`Quote ${q.id} subtotal mismatch: lines=${computedSubtotal}, quote=${q.subtotal}`);
    }
    if (Math.abs(computedTotal - q.total) > 0.05) {
      errors.push(`Quote ${q.id} total mismatch: lines=${computedTotal}, quote=${q.total}`);
    }
  }

  // Orders FKs
  for (const o of db.Order) {
    if (!quoteIds.has(o.quoteId)) {
      errors.push(`Order ${o.id} references missing quote ${o.quoteId}`);
    }
  }

  // Invoices & Payments FKs
  for (const inv of db.Invoice) {
    if (inv.orderId && !orderIds.has(inv.orderId)) {
      errors.push(`Invoice ${inv.id} references missing order ${inv.orderId}`);
    }
  }

  for (const p of db.Payment) {
    if (!invoiceIds.has(p.invoiceId)) {
      errors.push(`Payment ${p.id} references missing invoice ${p.invoiceId}`);
    }
  }

  // FulfillmentAllocations FKs
  for (const a of db.FulfillmentAllocation) {
    if (!orderIds.has(a.orderId)) {
      errors.push(`Allocation ${a.id} references missing order ${a.orderId}`);
    }
    if (!productIds.has(a.productId)) {
      errors.push(`Allocation ${a.id} references missing product ${a.productId}`);
    }
    if (!warehouseIds.has(a.warehouseId)) {
      errors.push(`Allocation ${a.id} references missing warehouse ${a.warehouseId}`);
    }
  }

  const durationMs = Date.now() - start;
  if (durationMs > 400) {
    errors.push(`Seed self-check exceeded 400 ms performance budget (took ${durationMs} ms).`);
  }

  return {
    passed: errors.length === 0,
    durationMs,
    tableCounts,
    errors,
  };
}

// Auto-register seed generator with store
registerSeedGenerator(() => buildSeed());

// Self-check verification
const { db: testDb } = buildSeed();
const testResult = runSeedSelfCheck(testDb);
if (!testResult.passed) {
  console.error('[DealFlow360 Demo] Seed self check FAILED with errors:', testResult.errors);
} else {
  console.log(`[DealFlow360 Demo] Seed self-check PASSED in ${testResult.durationMs}ms across ${Object.keys(testResult.tableCounts).length} tables (${testResult.tableCounts.Quote} quotes, ${testResult.tableCounts.Product} products, ${testResult.tableCounts.Order} orders, ${testResult.tableCounts.Invoice} invoices).`);
}

