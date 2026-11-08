// src/demo/server/handlers/reports.ts
/**
 * Reports mock handlers: GET /api/reports/summary
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireRole } from '../session';
import { getStore } from '@/demo/db/store';
import type {
  Quote,
  QuoteLine,
  ApprovalRequest,
  Product,
} from '@/demo/db/schema';

function periodStartDate(now: Date, period: string): Date {
  const d = new Date(now);
  switch (period) {
    case 'last_month':
      d.setMonth(d.getMonth() - 1);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    case 'last_quarter':
      d.setMonth(d.getMonth() - 3);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    case 'this_year':
      d.setMonth(0);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    default: // this_month
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
  }
}

function periodEndDate(now: Date, period: string): Date {
  if (period === 'last_month') {
    const d = new Date(now);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return now;
}

export function registerReportsHandlers() {
  router.get('/api/reports/summary', (ctx: DemoRequestContext) => {
    requireRole(['ADMIN', 'FINANCE', 'SALES_MANAGER', 'SALES_REP', 'OPERATIONS']);
    const store = getStore();

    const period = ctx.query.get('period') || 'this_month';
    const repId = ctx.query.get('repId') || '';
    const status = ctx.query.get('status') || '';
    const productId = ctx.query.get('productId') || '';

    const now = new Date();
    const startDate = periodStartDate(now, period);
    const endDate = periodEndDate(now, period);

    let quotes = store.where<Quote>('Quote', q => {
      const qDate = new Date(q.createdAt);
      return qDate >= startDate && qDate <= endDate;
    });

    if (repId) quotes = quotes.filter(q => q.salesRepId === repId);
    if (status) quotes = quotes.filter(q => q.status === status);
    if (productId) {
      quotes = quotes.filter(q => {
        const lines = store.where<QuoteLine>(
          'QuoteLine',
          l => l.quoteId === q.id && l.productId === productId
        );
        return lines.length > 0;
      });
    }

    const quotesCreated = quotes.length;
    const quoteIds = new Set(quotes.map(q => q.id));

    // KPI 2: Avg approval time
    const approvals = store.where<ApprovalRequest>('ApprovalRequest', a => {
      if (!a.actedAt) return false;
      const aDate = new Date(a.createdAt);
      if (aDate < startDate || aDate > endDate) return false;
      if (repId) {
        const q = store.get<Quote>('Quote', a.quoteId);
        if (!q || q.salesRepId !== repId) return false;
      }
      return true;
    });

    let avgApprovalHours = 0;
    if (approvals.length > 0) {
      const totalMs = approvals.reduce((sum, a) => {
        return sum + (new Date(a.actedAt!).getTime() - new Date(a.createdAt).getTime());
      }, 0);
      avgApprovalHours = Math.round((totalMs / approvals.length / 3600000) * 10) / 10;
    }

    // KPI 3: Top upsold product
    const recurringLines = store.where<QuoteLine>(
      'QuoteLine',
      l => l.billingType === 'RECURRING' && quoteIds.has(l.quoteId)
    );

    const recCount = new Map<string, number>();
    for (const l of recurringLines) {
      recCount.set(l.productId, (recCount.get(l.productId) || 0) + 1);
    }

    let topUpsoldProduct = 'N/A';
    if (recCount.size > 0) {
      const sorted = Array.from(recCount.entries()).sort((a, b) => b[1] - a[1]);
      const topProd = store.get<Product>('Product', sorted[0][0]);
      topUpsoldProduct = topProd?.name ?? 'N/A';
    }

    // Bottlenecks: per-role avg wait + pending count
    const roles = ['SALES_MANAGER', 'FINANCE'];
    const bottlenecks = roles.map(role => {
      const pending = store.count(
        'ApprovalRequest',
        (a: any) => a.role === role && a.status === 'PENDING'
      );
      const acted = store.where<ApprovalRequest>(
        'ApprovalRequest',
        a => a.role === role && Boolean(a.actedAt) && new Date(a.createdAt) >= startDate
      );

      const avgWait =
        acted.length > 0
          ? Math.round(
              (acted.reduce(
                (s, a) => s + (new Date(a.actedAt!).getTime() - new Date(a.createdAt).getTime()),
                0
              ) /
                acted.length /
                3600000) *
                10
            ) / 10
          : 0;

      return { role, pendingNow: pending, avgWaitHours: avgWait };
    });

    return jsonResponse({
      success: true,
      data: {
        quotesCreated,
        avgApprovalHours,
        topUpsoldProduct,
        bottlenecks,
      },
    });
  });
}

