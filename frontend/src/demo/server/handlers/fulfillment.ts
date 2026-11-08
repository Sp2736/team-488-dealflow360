// src/demo/server/handlers/fulfillment.ts
/**
 * Fulfillment mock handlers:
 * GET /api/fulfillment, POST /api/fulfillment/bulk-allocate
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireRole } from '../session';
import { getStore } from '@/demo/db/store';
import { writeAuditLog } from '../services/audit.service';
import { ApiError } from '../errors';
import type {
  Inventory,
  Warehouse,
  Product,
  Order,
  Quote,
  Customer,
  QuoteLine,
  FulfillmentAllocation,
} from '@/demo/db/schema';

export function registerFulfillmentHandlers() {
  // GET /api/fulfillment
  router.get('/api/fulfillment', () => {
    requireRole(['ADMIN', 'OPERATIONS', 'SALES_MANAGER']);
    const store = getStore();

    // Inventory per warehouse per product
    const rawInventory = store.all<Inventory>('Inventory');
    const inventory = rawInventory.map(inv => {
      const warehouse = store.get<Warehouse>('Warehouse', inv.warehouseId);
      const product = store.get<Product>('Product', inv.productId);
      return {
        ...inv,
        warehouse: warehouse ? { id: warehouse.id, name: warehouse.name, code: warehouse.code } : null,
        product: product ? { id: product.id, name: product.name, sku: product.sku } : null,
      };
    });

    inventory.sort((a, b) => {
      const wCompare = (a.warehouse?.name ?? '').localeCompare(b.warehouse?.name ?? '');
      if (wCompare !== 0) return wCompare;
      return (a.product?.name ?? '').localeCompare(b.product?.name ?? '');
    });

    // Orders awaiting or undergoing fulfillment
    const orders = store
      .where<Order>('Order', o =>
        ['CONFIRMED', 'FULFILLING', 'PARTIALLY_FULFILLED'].includes(o.status)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(o => {
        const quote = store.get<Quote>('Quote', o.quoteId);
        const customer = quote ? store.get<Customer>('Customer', quote.customerId) : null;
        const lines = quote ? store.where<QuoteLine>('QuoteLine', l => l.quoteId === quote.id) : [];

        const hydratedLines = lines.map(line => {
          const product = store.get<Product>('Product', line.productId);
          return {
            ...line,
            product: product ? { select: { name: product.name } } : null,
          };
        });

        const allocs = store.where<FulfillmentAllocation>(
          'FulfillmentAllocation',
          a => a.orderId === o.id
        );
        const hydratedAllocs = allocs.map(a => {
          const w = store.get<Warehouse>('Warehouse', a.warehouseId);
          const p = store.get<Product>('Product', a.productId);
          return {
            ...a,
            warehouse: w ? { select: { name: w.name } } : null,
            product: p ? { select: { name: p.name } } : null,
          };
        });

        return {
          ...o,
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

    return jsonResponse({ inventory, orders });
  });

  // POST /api/fulfillment/bulk-allocate
  router.post('/api/fulfillment/bulk-allocate', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'OPERATIONS', 'SALES_MANAGER']);
    const store = getStore();
    const body = ctx.body || {};
    const { ids, action } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw ApiError.badRequest('Invalid request payload');
    }

    if (action !== 'MARK_FULFILLING' && action !== 'MARK_FULFILLED') {
      throw ApiError.badRequest(`Unsupported action: ${action}`);
    }

    const targetStatus = action === 'MARK_FULFILLING' ? 'FULFILLING' : 'FULFILLED';

    let count = 0;
    for (const orderId of ids) {
      const order = store.get<Order>('Order', orderId);
      if (!order) continue;

      store.update<Order>('Order', orderId, {
        status: targetStatus,
        updatedAt: new Date().toISOString(),
      });
      count++;

      writeAuditLog({
        entityType: 'ORDER',
        entityId: orderId,
        action: `ORDER_${action}`,
        actorId: session.user.id,
        before: { status: order.status },
        after: { status: targetStatus },
      });
    }

    return jsonResponse({
      success: true,
      message: `Orders marked as ${targetStatus.toLowerCase()}`,
      count,
    });
  });
}

