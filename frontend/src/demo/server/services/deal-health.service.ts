// src/demo/server/services/deal-health.service.ts
/**
 * Deal Health Service — browser-side port over store.ts
 * Computes deal health signals, trend events and dashboard KPIs.
 */

import { getStore } from '@/demo/db/store';
import { ApiError } from '../errors';
import { runDealHealthEngine } from '@/lib/engines/deal-health.engine';
import type {
  Quote,
  ApprovalRequest,
  Negotiation,
  DealHealthEvent,
  Customer,
  User,
} from '@/demo/db/schema';

export async function getRepAverageDiscount(salesRepId: string): Promise<number> {
  const store = getStore();
  const repQuotes = store.where<Quote>(
    'Quote',
    q => q.salesRepId === salesRepId && q.status !== 'DRAFT'
  );

  if (repQuotes.length === 0) return 10; // default baseline

  const totalDiscount = repQuotes.reduce((sum, q) => {
    const subtotal = Number(q.subtotal) || 1;
    const disc = (Number(q.discountAmount) / subtotal) * 100;
    return sum + disc;
  }, 0);

  return Math.round((totalDiscount / repQuotes.length) * 100) / 100;
}

export async function computeDealHealth(quoteId: string) {
  const store = getStore();

  const quote = store.get<Quote>('Quote', quoteId);
  if (!quote) throw ApiError.notFound('Quote not found');

  const now = new Date();
  const lastActivity = new Date(quote.updatedAt);
  const daysSinceLastActivity = Math.floor(
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  const repAvgDiscount = await getRepAverageDiscount(quote.salesRepId);
  const quoteDiscountPercent =
    ((Number(quote.discountAmount) || 0) / (Number(quote.subtotal) || 1)) * 100;

  const pendingApprovals = store
    .where<ApprovalRequest>(
      'ApprovalRequest',
      r => r.quoteId === quoteId && r.status === 'PENDING'
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let pendingApprovalAgeHours: number | null = null;
  if (pendingApprovals.length > 0) {
    const oldestPending = pendingApprovals[0];
    pendingApprovalAgeHours =
      (now.getTime() - new Date(oldestPending.createdAt).getTime()) / (1000 * 60 * 60);
  }

  const warehouseCount = (quote.riskScore ?? 0) > 15 ? 2 : 1;
  const deliveryDateSlipped = false;

  const negotiations = store.where<Negotiation>('Negotiation', n => n.quoteId === quoteId);
  const negotiationCounterCount = negotiations.length;

  const healthResult = runDealHealthEngine({
    quoteId: quote.id,
    daysSinceLastActivity,
    repAvgDiscountPercent: repAvgDiscount,
    quoteDiscountPercent,
    pendingApprovalAgeHours,
    warehouseCount,
    deliveryDateSlipped,
    negotiationCounterCount,
  });

  const event: DealHealthEvent = {
    id: `dhe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    quoteId: quote.id,
    score: healthResult.score,
    level: healthResult.level,
    reasons: JSON.stringify(healthResult.reasons),
    createdAt: new Date().toISOString(),
  };
  store.insert('DealHealthEvent', event);

  return healthResult;
}

export async function getDealHealthDashboard(salesRepId?: string) {
  const store = getStore();

  let quotes = store.where<Quote>(
    'Quote',
    q => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(q.status)
  );

  if (salesRepId) {
    quotes = quotes.filter(q => q.salesRepId === salesRepId);
  }

  quotes.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

  const results = [];
  for (const quote of quotes) {
    const customer = store.get<Customer>('Customer', quote.customerId);
    const salesRep = store.get<User>('User', quote.salesRepId);

    const events = store
      .where<DealHealthEvent>('DealHealthEvent', e => e.quoteId === quote.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let latestEvent = events[0];
    if (!latestEvent) {
      await computeDealHealth(quote.id);
      const rechecked = store.where<DealHealthEvent>('DealHealthEvent', e => e.quoteId === quote.id);
      rechecked.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      latestEvent = rechecked[0];
    }

    results.push({
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        status: quote.status,
        total: Number(quote.total),
        updatedAt: quote.updatedAt,
        customer: customer ? { id: customer.id, companyName: customer.companyName } : null,
        salesRep: salesRep ? { id: salesRep.id, name: salesRep.name } : null,
      },
      health: latestEvent
        ? {
            score: latestEvent.score,
            level: latestEvent.level,
            reasons: JSON.parse(latestEvent.reasons || '[]'),
            computedAt: latestEvent.createdAt,
          }
        : null,
      history: events.slice(0, 5).map(e => ({
        score: e.score,
        level: e.level,
        createdAt: e.createdAt,
      })),
    });
  }

  return results;
}

