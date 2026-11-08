// src/demo/server/handlers/invoices.ts
/**
 * Invoices mock handlers:
 * GET/POST /api/invoices,
 * GET/POST/PATCH /api/invoices/:invoiceId,
 * POST/PATCH /api/invoices/bulk,
 * POST /api/invoices/generate (Gap fill)
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireAuth, requireRole } from '../session';
import { getStore } from '@/demo/db/store';
import { allocatePoolId } from '@/demo/db/seed/ids';
import { recordPayment } from '../services/billing.service';
import { writeAuditLog } from '../services/audit.service';
import { ApiError } from '../errors';
import type {
  Invoice,
  Order,
  Quote,
  Customer,
  Payment,
  CreditNote,
  QuoteLine,
  Product,
} from '@/demo/db/schema';

function generateInvoiceNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `INV-${ts}`;
}

export function registerInvoicesHandlers() {
  // GET /api/invoices
  router.get('/api/invoices', () => {
    requireAuth();
    const store = getStore();

    const invoices = store
      .all<Invoice>('Invoice')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const hydrated = invoices.map(inv => {
      const order = inv.orderId ? store.get<Order>('Order', inv.orderId) : null;
      const quote = order ? store.get<Quote>('Quote', order.quoteId) : null;
      const customer = quote ? store.get<Customer>('Customer', quote.customerId) : null;

      return {
        ...inv,
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

  // POST /api/invoices
  router.post('/api/invoices', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'FINANCE']);
    const store = getStore();
    const body = ctx.body || {};

    const { orderId, amount, type, dueDate } = body;
    if (amount === undefined) {
      throw ApiError.badRequest('amount is required');
    }

    const existingInvoices = new Set(store.all<Invoice>('Invoice').map(i => i.id));
    const invoiceId = allocatePoolId('invoice', existingInvoices);

    const invoice: Invoice = {
      id: invoiceId,
      orderId: orderId || null,
      invoiceNumber: generateInvoiceNumber(),
      type: type || 'ONE_TIME',
      amount: Number(amount),
      status: 'DRAFT',
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.insert('Invoice', invoice);

    writeAuditLog({
      entityType: 'INVOICE',
      entityId: invoice.id,
      action: 'INVOICE_CREATED',
      actorId: session.user.id,
      after: invoice,
    });

    return jsonResponse({ success: true, data: invoice }, 201);
  });

  // POST /api/invoices/generate (Gap fill for bulk quotation invoice creation)
  router.post('/api/invoices/generate', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'FINANCE', 'SALES_MANAGER', 'SALES_REP']);
    const store = getStore();
    const body = ctx.body || {};

    const quoteIds: string[] = body.quoteIds || (body.quoteId ? [body.quoteId] : []);
    const orderIds: string[] = body.orderIds || (body.orderId ? [body.orderId] : []);

    const generatedInvoices: Invoice[] = [];

    // From quote IDs
    for (const qId of quoteIds) {
      const quote = store.get<Quote>('Quote', qId);
      if (!quote) continue;

      let order = store.where<Order>('Order', o => o.quoteId === qId)[0];
      if (!order) {
        const existingOrders = new Set(store.all<Order>('Order').map(o => o.id));
        const orderId = allocatePoolId('order', existingOrders);
        order = {
          id: orderId,
          quoteId: qId,
          orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}`,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.insert('Order', order);
      }

      // Check if invoice already exists
      const existingInv = store.where<Invoice>('Invoice', i => i.orderId === order.id)[0];
      if (existingInv) {
        generatedInvoices.push(existingInv);
        continue;
      }

      const existingInvoices = new Set(store.all<Invoice>('Invoice').map(i => i.id));
      const invoiceId = allocatePoolId('invoice', existingInvoices);

      const invoice: Invoice = {
        id: invoiceId,
        orderId: order.id,
        invoiceNumber: generateInvoiceNumber(),
        type: 'ONE_TIME',
        amount: Number(quote.total),
        status: 'ISSUED',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.insert('Invoice', invoice);
      generatedInvoices.push(invoice);

      writeAuditLog({
        entityType: 'INVOICE',
        entityId: invoice.id,
        action: 'INVOICE_GENERATED',
        actorId: session.user.id,
        after: invoice,
      });
    }

    // From order IDs
    for (const oId of orderIds) {
      const order = store.get<Order>('Order', oId);
      if (!order) continue;

      const quote = store.get<Quote>('Quote', order.quoteId);
      const existingInv = store.where<Invoice>('Invoice', i => i.orderId === oId)[0];
      if (existingInv) {
        generatedInvoices.push(existingInv);
        continue;
      }

      const existingInvoices = new Set(store.all<Invoice>('Invoice').map(i => i.id));
      const invoiceId = allocatePoolId('invoice', existingInvoices);

      const invoice: Invoice = {
        id: invoiceId,
        orderId: oId,
        invoiceNumber: generateInvoiceNumber(),
        type: 'ONE_TIME',
        amount: Number(quote?.total ?? 1000),
        status: 'ISSUED',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.insert('Invoice', invoice);
      generatedInvoices.push(invoice);
    }

    return jsonResponse({
      success: true,
      message: 'Invoices generated successfully.',
      count: generatedInvoices.length,
      invoices: generatedInvoices,
    });
  });

  // GET /api/invoices/:invoiceId
  router.get('/api/invoices/:invoiceId', (ctx: DemoRequestContext) => {
    requireAuth();
    const store = getStore();
    const { invoiceId } = ctx.params;

    const invoice = store.get<Invoice>('Invoice', invoiceId);
    if (!invoice) throw ApiError.notFound('Invoice not found');

    const order = invoice.orderId ? store.get<Order>('Order', invoice.orderId) : null;
    const quote = order ? store.get<Quote>('Quote', order.quoteId) : null;
    const customer = quote ? store.get<Customer>('Customer', quote.customerId) : null;
    const lines = quote ? store.where<QuoteLine>('QuoteLine', l => l.quoteId === quote.id) : [];

    const hydratedLines = lines.map(line => {
      const product = store.get<Product>('Product', line.productId);
      return {
        ...line,
        product,
      };
    });

    const payments = store
      .where<Payment>('Payment', p => p.invoiceId === invoice.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const creditNotes = store
      .where<CreditNote>('CreditNote', cn => cn.invoiceId === invoice.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return jsonResponse({
      success: true,
      data: {
        ...invoice,
        order: order
          ? {
              ...order,
              quote: quote
                ? {
                    ...quote,
                    customer,
                    quoteLines: hydratedLines,
                  }
                : null,
            }
          : null,
        payments,
        creditNotes,
      },
    });
  });

  // POST /api/invoices/:invoiceId (Pay / Mark Paid)
  router.post('/api/invoices/:invoiceId', async (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'FINANCE', 'SALES_MANAGER']);
    const { invoiceId } = ctx.params;
    const body = ctx.body || {};
    const action = body.action || 'MARK_PAID';
    const method = body.method || 'BANK_TRANSFER';
    const amount = body.amount !== undefined ? Number(body.amount) : undefined;

    const store = getStore();
    const invoice = store.get<Invoice>('Invoice', invoiceId);
    if (!invoice) throw ApiError.notFound('Invoice not found');

    if (action === 'MARK_PAID') {
      const payAmount = amount ?? Number(invoice.amount);
      const result = await recordPayment(invoice.id, payAmount, method, session.user.id);
      return jsonResponse({
        success: true,
        message: 'Payment recorded successfully',
        payment: result.payment,
        newStatus: result.newStatus,
      });
    }

    throw ApiError.badRequest('Unsupported action');
  });

  // PATCH /api/invoices/:invoiceId
  router.patch('/api/invoices/:invoiceId', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'FINANCE']);
    const store = getStore();
    const { invoiceId } = ctx.params;
    const body = ctx.body || {};

    const existing = store.get<Invoice>('Invoice', invoiceId);
    if (!existing) throw ApiError.notFound('Invoice not found');

    const updated = store.update<Invoice>('Invoice', invoiceId, body);

    writeAuditLog({
      entityType: 'INVOICE',
      entityId: invoiceId,
      action: 'INVOICE_STATUS_UPDATED',
      actorId: session.user.id,
      before: existing,
      after: updated,
    });

    return jsonResponse({ success: true, data: updated });
  });

  // POST & PATCH /api/invoices/bulk
  const handleBulkInvoice = async (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'FINANCE']);
    const store = getStore();
    const body = ctx.body || {};
    const { ids, action } = body;

    if (!Array.isArray(ids) || ids.length === 0 || action !== 'MARK_PAID') {
      throw ApiError.badRequest('Invalid request payload');
    }

    for (const invId of ids) {
      const inv = store.get<Invoice>('Invoice', invId);
      if (inv && inv.status !== 'PAID') {
        await recordPayment(inv.id, Number(inv.amount), 'BULK_UPDATE', session.user.id);
      }
    }

    return jsonResponse({ success: true, message: 'Invoices marked as paid' });
  };

  router.post('/api/invoices/bulk', handleBulkInvoice);
  router.patch('/api/invoices/bulk', handleBulkInvoice);
}

