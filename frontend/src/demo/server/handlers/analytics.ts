// src/demo/server/handlers/analytics.ts
/**
 * Analytics mock handler: GET /api/analytics
 * Computes business aggregations directly from the store at request time.
 */

import { router, jsonResponse } from '../router';
import { requireRole } from '../session';
import { getStore } from '@/demo/db/store';
import type {
  Quote,
  Customer,
  ApprovalRequest,
  QuoteLine,
  Product,
  ProductCategory,
} from '@/demo/db/schema';

export function registerAnalyticsHandlers() {
  router.get('/api/analytics', () => {
    requireRole(['ADMIN', 'SALES_MANAGER', 'FINANCE', 'SALES_REP', 'OPERATIONS']);
    const store = getStore();

    const quotes = store.all<Quote>('Quote');
    const quoteLines = store.all<QuoteLine>('QuoteLine');
    const approvalRequests = store.all<ApprovalRequest>('ApprovalRequest');

    const totalQuotesCount = quotes.length;
    const totalRevenue = quotes.reduce((sum, q) => sum + Number(q.total), 0);
    const avgDealSize = totalQuotesCount > 0 ? totalRevenue / totalQuotesCount : 0;

    // Quotes grouped by status
    const statusMap = new Map<string, { count: number; sum: number }>();
    for (const q of quotes) {
      const entry = statusMap.get(q.status) || { count: 0, sum: 0 };
      entry.count += 1;
      entry.sum += Number(q.total);
      statusMap.set(q.status, entry);
    }

    const quotesByStatus = Array.from(statusMap.entries()).map(([status, val]) => ({
      status,
      _count: { id: val.count },
      _sum: { total: Math.round(val.sum * 100) / 100 },
    }));

    // Approval stats
    const approvalMap = new Map<string, number>();
    for (const a of approvalRequests) {
      approvalMap.set(a.status, (approvalMap.get(a.status) || 0) + 1);
    }

    const approvalStats = Array.from(approvalMap.entries()).map(([status, count]) => ({
      status,
      _count: { id: count },
    }));

    // Top customers by revenue (from confirmed/approved/completed quotes)
    const validQuotes = quotes.filter(q =>
      ['APPROVED', 'CONFIRMED', 'COMPLETED', 'FULFILLING'].includes(q.status)
    );
    const customerRevMap = new Map<string, { revenue: number; quoteCount: number }>();
    for (const q of validQuotes) {
      const entry = customerRevMap.get(q.customerId) || { revenue: 0, quoteCount: 0 };
      entry.revenue += Number(q.total);
      entry.quoteCount += 1;
      customerRevMap.set(q.customerId, entry);
    }

    const topCustomers = Array.from(customerRevMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([customerId, val]) => {
        const customer = store.get<Customer>('Customer', customerId);
        return {
          companyName: customer?.companyName || 'Unknown',
          revenue: Math.round(val.revenue * 100) / 100,
          quoteCount: val.quoteCount,
        };
      });

    // Revenue by product
    const productRevMap = new Map<string, { revenue: number; lineCount: number }>();
    for (const line of quoteLines) {
      const entry = productRevMap.get(line.productId) || { revenue: 0, lineCount: 0 };
      entry.revenue += Number(line.lineTotal);
      entry.lineCount += 1;
      productRevMap.set(line.productId, entry);
    }

    const revenueByProduct = Array.from(productRevMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 8)
      .map(([productId, val]) => {
        const product = store.get<Product>('Product', productId);
        const category = product?.categoryId
          ? store.get<ProductCategory>('ProductCategory', product.categoryId)
          : null;
        return {
          productName: product?.name || 'Unknown',
          category: category?.name || 'Unknown',
          revenue: Math.round(val.revenue * 100) / 100,
          lineCount: val.lineCount,
        };
      });

    return jsonResponse({
      totalQuotes: totalQuotesCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgDealSize: Math.round(avgDealSize * 100) / 100,
      quotesByStatus,
      approvalStats,
      topCustomers,
      revenueByProduct,
    });
  });
}

