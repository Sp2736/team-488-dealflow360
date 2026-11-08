// src/demo/server/handlers/subscriptions.ts
/**
 * Subscriptions mock handlers:
 * GET/POST /api/subscriptions,
 * GET/POST /api/subscriptions/plans,
 * GET/PATCH /api/subscriptions/:id,
 * POST /api/subscriptions/:id/cancel
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireAuth, requireRole } from '../session';
import { getStore } from '@/demo/db/store';
import { calculateProration } from '@/lib/engines/billing.engine';
import { writeAuditLog } from '../services/audit.service';
import { allocatePoolId } from '@/demo/db/seed/ids';
import { ApiError } from '../errors';
import type {
  Subscription,
  SubscriptionPlan,
  Order,
  Quote,
  Customer,
  BillingSchedule,
  Invoice,
  CreditNote,
  QuoteLine,
  Product,
} from '@/demo/db/schema';

export function registerSubscriptionsHandlers() {
  // GET /api/subscriptions
  router.get('/api/subscriptions', () => {
    requireAuth();
    const store = getStore();

    const subscriptions = store
      .all<Subscription>('Subscription')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const hydrated = subscriptions.map(sub => {
      const plan = store.get<SubscriptionPlan>('SubscriptionPlan', sub.subscriptionPlanId);
      const order = sub.orderId ? store.get<Order>('Order', sub.orderId) : null;
      const quote = order ? store.get<Quote>('Quote', order.quoteId) : null;
      const customer = quote ? store.get<Customer>('Customer', quote.customerId) : null;

      return {
        ...sub,
        subscriptionPlan: plan,
        order: order
          ? {
              ...order,
              quote: quote
                ? {
                    ...quote,
                    customer,
                  }
                : null,
            }
          : null,
      };
    });

    return jsonResponse({ success: true, data: hydrated });
  });

  // POST /api/subscriptions
  router.post('/api/subscriptions', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'FINANCE', 'SALES_MANAGER']);
    const store = getStore();
    const body = ctx.body || {};

    const { subscriptionPlanId, quantity, orderId, quoteLineId } = body;
    if (!subscriptionPlanId) {
      throw ApiError.badRequest('subscriptionPlanId is required');
    }

    const existingSubs = new Set(store.all<Subscription>('Subscription').map(s => s.id));
    const subId = allocatePoolId('subscription', existingSubs);

    const subscription: Subscription = {
      id: subId,
      subscriptionPlanId,
      quantity: Number(quantity || 1),
      orderId: orderId || null,
      quoteLineId: quoteLineId || null,
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.insert('Subscription', subscription);

    writeAuditLog({
      entityType: 'SUBSCRIPTION',
      entityId: subscription.id,
      action: 'SUBSCRIPTION_CREATED',
      actorId: session.user.id,
      after: subscription,
    });

    return jsonResponse({ success: true, data: subscription }, 201);
  });

  // GET /api/subscriptions/plans
  router.get('/api/subscriptions/plans', () => {
    requireAuth();
    const store = getStore();
    const plans = store.all<SubscriptionPlan>('SubscriptionPlan');
    return jsonResponse({ success: true, data: plans });
  });

  // POST /api/subscriptions/plans
  router.post('/api/subscriptions/plans', (ctx: DemoRequestContext) => {
    requireRole(['ADMIN', 'SALES_MANAGER']);
    const store = getStore();
    const body = ctx.body || {};
    const { name, frequency, price, prorationEnabled, refundEnabled, cancellationRefundEnabled } = body;

    if (!name || price == null) {
      throw ApiError.badRequest('Name and price are required');
    }

    const plan: SubscriptionPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      frequency: frequency || 'MONTHLY',
      price: Number(price),
      prorationEnabled: Boolean(prorationEnabled),
      refundEnabled: Boolean(refundEnabled ?? cancellationRefundEnabled),
      active: true,
      createdAt: new Date().toISOString(),
    };

    store.insert('SubscriptionPlan', plan);
    return jsonResponse({ success: true, data: plan }, 201);
  });

  // GET /api/subscriptions/:id
  router.get('/api/subscriptions/:id', (ctx: DemoRequestContext) => {
    requireAuth();
    const store = getStore();
    const { id } = ctx.params;

    const subscription = store.get<Subscription>('Subscription', id);
    if (!subscription) throw ApiError.notFound('Subscription not found');

    const plan = store.get<SubscriptionPlan>('SubscriptionPlan', subscription.subscriptionPlanId);
    const line = subscription.quoteLineId
      ? store.get<QuoteLine>('QuoteLine', subscription.quoteLineId)
      : null;
    const prod = line ? store.get<Product>('Product', line.productId) : null;
    const order = subscription.orderId ? store.get<Order>('Order', subscription.orderId) : null;
    const quote = order ? store.get<Quote>('Quote', order.quoteId) : null;
    const customer = quote ? store.get<Customer>('Customer', quote.customerId) : null;
    const invoices = order ? store.where<Invoice>('Invoice', i => i.orderId === order.id) : [];
    const schedules = store
      .where<BillingSchedule>('BillingSchedule', s => s.subscriptionId === id)
      .sort((a, b) => new Date(a.billingDate).getTime() - new Date(b.billingDate).getTime());

    return jsonResponse({
      success: true,
      data: {
        ...subscription,
        subscriptionPlan: plan,
        quoteLine: line ? { ...line, product: prod } : null,
        order: order
          ? {
              ...order,
              invoices,
              quote: quote ? { ...quote, customer } : null,
            }
          : null,
        billingSchedules: schedules,
      },
    });
  });

  // PATCH /api/subscriptions/:id
  router.patch('/api/subscriptions/:id', (ctx: DemoRequestContext) => {
    requireRole(['ADMIN', 'FINANCE']);
    const store = getStore();
    const { id } = ctx.params;
    const body = ctx.body || {};

    const existing = store.get<Subscription>('Subscription', id);
    if (!existing) throw ApiError.notFound('Subscription not found');

    const updated = store.update<Subscription>('Subscription', id, body);
    return jsonResponse({ success: true, data: updated });
  });

  // POST /api/subscriptions/:id/cancel
  router.post('/api/subscriptions/:id/cancel', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'FINANCE', 'SALES_MANAGER']);
    const store = getStore();
    const { id } = ctx.params;

    const subscription = store.get<Subscription>('Subscription', id);
    if (!subscription) throw ApiError.notFound('Subscription not found');

    if (subscription.status === 'CANCELLED') {
      throw ApiError.badRequest('Subscription is already cancelled');
    }

    const plan = store.get<SubscriptionPlan>('SubscriptionPlan', subscription.subscriptionPlanId);
    if (!plan) throw ApiError.notFound('Subscription plan not found');

    const pendingSchedules = store
      .where<BillingSchedule>('BillingSchedule', s => s.subscriptionId === id && s.status === 'PENDING')
      .sort((a, b) => new Date(a.billingDate).getTime() - new Date(b.billingDate).getTime());

    const now = new Date();
    const startedAt = new Date(subscription.startedAt);

    const nextBillingSchedule = pendingSchedules[0];
    const periodEnd = nextBillingSchedule
      ? new Date(nextBillingSchedule.billingDate)
      : (() => {
          const d = new Date(startedAt);
          if (plan.frequency === 'MONTHLY') d.setMonth(d.getMonth() + 1);
          else if (plan.frequency === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
          else d.setFullYear(d.getFullYear() + 1);
          return d;
        })();

    let creditNote: CreditNote | null = null;
    let prorationResult = null;

    if (plan.prorationEnabled) {
      prorationResult = calculateProration({
        planPricePerPeriod: Number(plan.price),
        periodStartDate: startedAt,
        periodEndDate: periodEnd,
        changeDate: now,
        quantityDelta: -Number(subscription.quantity),
      });

      const creditAmount = Math.abs(prorationResult.proratedAmount);
      if (creditAmount > 0 && plan.refundEnabled && subscription.orderId) {
        const invoices = store.where<Invoice>('Invoice', i => i.orderId === subscription.orderId);
        invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latestInvoice = invoices[0];

        if (latestInvoice) {
          creditNote = {
            id: `cn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            invoiceId: latestInvoice.id,
            subscriptionId: id,
            amount: creditAmount,
            reason: `Prorated refund for cancellation on ${now.toISOString().split('T')[0]} (${prorationResult.daysRemaining} days remaining in cycle)`,
            createdAt: new Date().toISOString(),
          };
          store.insert('CreditNote', creditNote);
        }
      }
    }

    // Cancel subscription
    store.update<Subscription>('Subscription', id, {
      status: 'CANCELLED',
      endedAt: now.toISOString(),
    });

    // Cancel pending schedules
    for (const s of pendingSchedules) {
      store.update<BillingSchedule>('BillingSchedule', s.id, { status: 'BILLED' });
    }

    writeAuditLog({
      entityType: 'SUBSCRIPTION',
      entityId: id,
      action: 'SUBSCRIPTION_CANCELLED',
      actorId: session.user.id,
      after: {
        status: 'CANCELLED',
        proratedAmount: prorationResult?.proratedAmount,
        creditNoteId: creditNote?.id,
      },
    });

    return jsonResponse({
      success: true,
      message: 'Subscription cancelled successfully',
      proration: prorationResult,
      creditNote,
    });
  });
}

