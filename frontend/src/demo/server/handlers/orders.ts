// src/demo/server/handlers/orders.ts
/**
 * Orders mock handlers:
 * GET /api/orders, GET /api/orders/:id, POST /api/orders/:id/fulfillment/override
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireAuth, requireRole } from '../session';
import { getStore } from '@/demo/db/store';
import { allocateOrder } from '../services/fulfillment.service';
import { ApiError } from '../errors';
import type {
  Order,
  Quote,
  Customer,
  QuoteLine,
  Product,
  FulfillmentAllocation,
  Warehouse,
} from '@/demo/db/schema';

export function registerOrdersHandlers() {
  // GET /api/orders
  router.get('/api/orders', (ctx: DemoRequestContext) => {
    requireRole(['ADMIN', 'OPERATIONS', 'SALES_MANAGER', 'SALES_REP', 'FINANCE']);
    const store = getStore();

    const status = ctx.query.get('status');
    const warehouseId = ctx.query.get('warehouseId');
    const page = parseInt(ctx.query.get('page') || '1', 10);
    const limit = parseInt(ctx.query.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    let orders = store.all<Order>('Order');

    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    if (warehouseId) {
      orders = orders.filter(o => {
        const allocs = store.where<FulfillmentAllocation>(
          'FulfillmentAllocation',
          a => a.orderId === o.id && a.warehouseId === warehouseId
        );
        return allocs.length > 0;
      });
    }

    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = orders.length;
    const paginated = orders.slice(skip, skip + limit);

    const data = paginated.map(order => {
      const quote = store.get<Quote>('Quote', order.quoteId);
      const customer = quote ? store.get<Customer>('Customer', quote.customerId) : null;
      const lines = quote ? store.where<QuoteLine>('QuoteLine', l => l.quoteId === quote.id) : [];

      const hydratedLines = lines.map(line => {
        const prod = store.get<Product>('Product', line.productId);
        return {
          ...line,
          product: prod ? { name: prod.name } : null,
        };
      });

      const allocs = store.where<FulfillmentAllocation>(
        'FulfillmentAllocation',
        a => a.orderId === order.id
      );

      const hydratedAllocs = allocs.map(a => {
        const w = store.get<Warehouse>('Warehouse', a.warehouseId);
        const p = store.get<Product>('Product', a.productId);
        return {
          ...a,
          warehouse: w ? { name: w.name } : null,
          product: p ? { name: p.name } : null,
        };
      });

      return {
        ...order,
        quote: quote
          ? {
              ...quote,
              customer: customer ? { companyName: customer.companyName } : null,
              quoteLines: hydratedLines,
            }
          : null,
        fulfillmentAllocations: hydratedAllocs,
      };
    });

    const warehouses = store
      .all<Warehouse>('Warehouse')
      .map(w => ({ id: w.id, name: w.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return jsonResponse({
      success: true,
      data,
      meta: { total, page, limit },
      warehouses,
    });
  });

  // GET /api/orders/:id
  router.get('/api/orders/:id', (ctx: DemoRequestContext) => {
    requireAuth();
    const store = getStore();
    const { id } = ctx.params;

    const order = store.get<Order>('Order', id);
    if (!order) throw ApiError.notFound('Order not found');

    const quote = store.get<Quote>('Quote', order.quoteId);
    const customer = quote ? store.get<Customer>('Customer', quote.customerId) : null;
    const lines = quote ? store.where<QuoteLine>('QuoteLine', l => l.quoteId === quote.id) : [];

    const hydratedLines = lines.map(line => {
      const prod = store.get<Product>('Product', line.productId);
      return {
        ...line,
        product: prod,
      };
    });

    const allocs = store.where<FulfillmentAllocation>(
      'FulfillmentAllocation',
      a => a.orderId === order.id
    );

    const hydratedAllocs = allocs.map(a => {
      const w = store.get<Warehouse>('Warehouse', a.warehouseId);
      const p = store.get<Product>('Product', a.productId);
      return {
        ...a,
        warehouse: w,
        product: p,
      };
    });

    return jsonResponse({
      ...order,
      quote: quote
        ? {
            ...quote,
            customer,
            quoteLines: hydratedLines,
          }
        : null,
      fulfillmentAllocations: hydratedAllocs,
    });
  });

  // POST /api/orders/:id/fulfillment/override
  router.post('/api/orders/:id/fulfillment/override', async (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'OPERATIONS']);
    const { id: orderId } = ctx.params;
    const body = ctx.body || {};
    const { productId, requestedQuantity, manualOverride, overrideReason } = body;

    if (!productId || !requestedQuantity || !manualOverride) {
      throw ApiError.badRequest('Missing required fields');
    }

    const allocation = await allocateOrder(
      orderId,
      productId,
      requestedQuantity,
      session.user.id,
      manualOverride,
      overrideReason
    );

    return jsonResponse(allocation);
  });
}

