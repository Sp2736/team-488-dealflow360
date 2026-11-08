// src/demo/server/handlers/billing.ts
/**
 * Billing mock handler: POST /api/billing, GET /api/billing
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireRole } from '../session';
import { createOrderBilling, recordPayment } from '../services/billing.service';
import { getStore } from '@/demo/db/store';
import { ApiError } from '../errors';
import type { Invoice, Payment, Subscription, BillingSchedule } from '@/demo/db/schema';

export function registerBillingHandlers() {
  // GET /api/billing — summary of invoices and schedules
  router.get('/api/billing', () => {
    requireRole(['ADMIN', 'FINANCE', 'SALES_MANAGER']);
    const store = getStore();

    const invoices = store.all<Invoice>('Invoice');
    const payments = store.all<Payment>('Payment');
    const subscriptions = store.all<Subscription>('Subscription');
    const schedules = store.all<BillingSchedule>('BillingSchedule');

    const totalBilled = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalOutstanding = Math.max(0, totalBilled - totalCollected);

    return jsonResponse({
      success: true,
      data: {
        totalBilled,
        totalCollected,
        totalOutstanding,
        activeSubscriptionsCount: subscriptions.filter(s => s.status === 'ACTIVE').length,
        pendingSchedulesCount: schedules.filter(s => s.status === 'PENDING').length,
      },
    });
  });

  // POST /api/billing
  router.post('/api/billing', async (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'FINANCE', 'OPERATIONS']);
    const body = ctx.body || {};
    const { action, orderId, invoiceId, amount, method } = body;

    if (action === 'create_billing') {
      if (!orderId) throw ApiError.badRequest('orderId required');
      const result = await createOrderBilling(orderId, session.user.id);
      return jsonResponse(result, 201);
    }

    if (action === 'record_payment') {
      if (!invoiceId || amount == null || !method) {
        throw ApiError.badRequest('invoiceId, amount, method required');
      }
      const result = await recordPayment(invoiceId, Number(amount), method, session.user.id);
      return jsonResponse(result);
    }

    throw ApiError.badRequest('Invalid action');
  });
}

