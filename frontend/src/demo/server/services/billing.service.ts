// src/demo/server/services/billing.service.ts
/**
 * Billing Service — browser-side port over store.ts
 * Generates invoices, manages subscriptions and billing schedules with proration.
 */

import { getStore } from '@/demo/db/store';
import { writeAuditLog } from './audit.service';
import { allocatePoolId } from '@/demo/db/seed/ids';
import { ApiError } from '../errors';
import { runBillingEngine, calculateProration } from '@/lib/engines/billing.engine';
import type {
  Order,
  Quote,
  QuoteLine,
  SubscriptionPlan,
  Invoice,
  Payment,
  CreditNote,
  Subscription,
  BillingSchedule,
} from '@/demo/db/schema';

function generateInvoiceNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `INV-${ts}`;
}

export async function createOrderBilling(orderId: string, actorId: string) {
  const store = getStore();

  const order = store.get<Order>('Order', orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const quote = store.get<Quote>('Quote', order.quoteId);
  if (!quote) throw ApiError.notFound('Quote not found');

  const quoteLines = store.where<QuoteLine>('QuoteLine', l => l.quoteId === quote.id);

  const billingInput = {
    orderId,
    confirmationDate: new Date(order.createdAt),
    lines: quoteLines.map(line => {
      const plan = line.subscriptionPlanId
        ? store.get<SubscriptionPlan>('SubscriptionPlan', line.subscriptionPlanId)
        : null;
      return {
        lineId: line.id,
        billingType: line.billingType,
        lineTotal: Number(line.lineTotal),
        taxAmount: 0,
        subscriptionPlanId: line.subscriptionPlanId ?? undefined,
        planPrice: plan ? Number(plan.price) : undefined,
        planFrequency: plan?.frequency,
        quantity: Number(line.quantity),
      };
    }),
  };

  const billingResult = runBillingEngine(billingInput);

  let invoice: Invoice | null = null;
  if (billingResult.invoice) {
    const existingInvoices = new Set(store.all<Invoice>('Invoice').map(i => i.id));
    const invoiceId = allocatePoolId('invoice', existingInvoices);

    invoice = {
      id: invoiceId,
      orderId,
      invoiceNumber: generateInvoiceNumber(),
      type: 'ONE_TIME',
      amount: billingResult.invoice.invoiceTotal,
      status: 'DRAFT',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.insert('Invoice', invoice);
  }

  const subscriptions: Subscription[] = [];
  for (const schedule of billingResult.subscriptionSchedules) {
    const existingSubs = new Set(store.all<Subscription>('Subscription').map(s => s.id));
    const subId = allocatePoolId('subscription', existingSubs);

    const subscription: Subscription = {
      id: subId,
      quoteLineId: schedule.lineId,
      orderId,
      subscriptionPlanId: schedule.subscriptionPlanId,
      quantity: schedule.quantity,
      status: 'ACTIVE',
      startedAt: order.createdAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.insert('Subscription', subscription);

    const billingScheduleRow: BillingSchedule = {
      id: `sch_${subId}_1`,
      subscriptionId: subId,
      billingDate: schedule.billingDate.toISOString(),
      amount: schedule.amount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    store.insert('BillingSchedule', billingScheduleRow);

    subscriptions.push(subscription);
  }

  await writeAuditLog({
    entityType: 'ORDER',
    entityId: orderId,
    action: 'BILLING_CREATED',
    actorId,
    after: {
      invoiceId: invoice?.id,
      invoiceTotal: billingResult.invoice?.invoiceTotal,
      subscriptionCount: subscriptions.length,
    },
  });

  return { invoice, subscriptions, billingResult };
}

export async function recordPayment(invoiceId: string, amount: number, method: string, actorId: string) {
  const store = getStore();

  const invoice = store.get<Invoice>('Invoice', invoiceId);
  if (!invoice) throw ApiError.notFound('Invoice not found');

  if (invoice.status === 'PAID') {
    throw ApiError.badRequest('Invoice is already paid');
  }
  if (invoice.status === 'CANCELLED') {
    throw ApiError.badRequest('Cannot pay a cancelled invoice');
  }

  const payment: Payment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    invoiceId,
    amount,
    method,
    createdAt: new Date().toISOString(),
  };
  store.insert('Payment', payment);

  const payments = store.where<Payment>('Payment', p => p.invoiceId === invoiceId);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const newStatus = totalPaid >= Number(invoice.amount) ? 'PAID' : 'ISSUED';

  store.update<Invoice>('Invoice', invoiceId, { status: newStatus });

  await writeAuditLog({
    entityType: 'INVOICE',
    entityId: invoiceId,
    action: 'PAYMENT_RECORDED',
    actorId,
    before: { status: invoice.status },
    after: { status: newStatus, paymentAmount: amount },
  });

  return { payment, newStatus };
}

export async function prorateSubscription(
  subscriptionId: string,
  newQuantity: number,
  changeDate: Date,
  actorId: string
) {
  const store = getStore();

  const subscription = store.get<Subscription>('Subscription', subscriptionId);
  if (!subscription) throw ApiError.notFound('Subscription not found');

  const plan = store.get<SubscriptionPlan>('SubscriptionPlan', subscription.subscriptionPlanId);
  if (!plan) throw ApiError.notFound('Subscription plan not found');

  const pendingSchedules = store
    .where<BillingSchedule>('BillingSchedule', s => s.subscriptionId === subscriptionId && s.status === 'PENDING')
    .sort((a, b) => new Date(a.billingDate).getTime() - new Date(b.billingDate).getTime());

  const oldQuantity = Number(subscription.quantity);
  const quantityDelta = newQuantity - oldQuantity;

  if (quantityDelta === 0) return null;

  const nextBillingDate = pendingSchedules[0]?.billingDate;
  if (!nextBillingDate) throw ApiError.badRequest('No pending billing schedule found');

  const proration = calculateProration({
    planPricePerPeriod: Number(plan.price),
    periodStartDate: new Date(subscription.startedAt),
    periodEndDate: new Date(nextBillingDate),
    changeDate,
    quantityDelta,
  });

  if (Math.abs(proration.proratedAmount) > 0) {
    const invoices = store.where<Invoice>('Invoice', i => i.orderId === subscription.orderId);
    invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latestInvoice = invoices[0];

    if (latestInvoice && proration.proratedAmount < 0 && plan.refundEnabled) {
      const creditNote: CreditNote = {
        id: `cn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        invoiceId: latestInvoice.id,
        subscriptionId,
        amount: Math.abs(proration.proratedAmount),
        reason: `Proration credit for quantity change ${oldQuantity} -> ${newQuantity}`,
        createdAt: new Date().toISOString(),
      };
      store.insert('CreditNote', creditNote);
    }
  }

  store.update<Subscription>('Subscription', subscriptionId, { quantity: newQuantity });

  await writeAuditLog({
    entityType: 'INVOICE',
    entityId: subscriptionId,
    action: 'SUBSCRIPTION_PRORATED',
    actorId,
    before: { quantity: oldQuantity },
    after: { quantity: newQuantity, proratedAmount: proration.proratedAmount },
    reason: `Quantity changed from ${oldQuantity} to ${newQuantity}`,
  });

  return proration;
}

