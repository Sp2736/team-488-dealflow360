// src/demo/server/handlers/warehouses.ts
/**
 * Warehouses mock handlers:
 * GET/POST /api/warehouses,
 * PUT/PATCH/DELETE /api/warehouses/:id,
 * GET/POST/PUT /api/warehouses/:id/inventory
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireRole } from '../session';
import { getStore } from '@/demo/db/store';
import { writeAuditLog } from '../services/audit.service';
import { ApiError } from '../errors';
import type { Warehouse, Inventory, Product } from '@/demo/db/schema';

export function registerWarehousesHandlers() {
  // GET /api/warehouses
  router.get('/api/warehouses', () => {
    requireRole(['ADMIN', 'OPERATIONS', 'SALES_MANAGER']);
    const store = getStore();

    const warehouses = store.all<Warehouse>('Warehouse').sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const hydrated = warehouses.map(w => {
      const inventories = store
        .where<Inventory>('Inventory', inv => inv.warehouseId === w.id)
        .map(inv => {
          const product = store.get<Product>('Product', inv.productId);
          return {
            ...inv,
            product: product ? { id: product.id, name: product.name, sku: product.sku } : null,
          };
        });

      return {
        ...w,
        inventories,
      };
    });

    return jsonResponse({ success: true, data: hydrated });
  });

  // POST /api/warehouses
  router.post('/api/warehouses', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'OPERATIONS']);
    const store = getStore();
    const body = ctx.body || {};

    const { name, code, shippingBaseCost, active } = body;
    if (!name || !code) {
      throw ApiError.badRequest('name and code are required');
    }

    const warehouse: Warehouse = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      code: String(code).toUpperCase(),
      shippingBaseCost: Number(shippingBaseCost || 0),
      active: active !== undefined ? Boolean(active) : true,
      createdAt: new Date().toISOString(),
    };

    store.insert('Warehouse', warehouse);

    writeAuditLog({
      entityType: 'WAREHOUSE',
      entityId: warehouse.id,
      action: 'WAREHOUSE_CREATED',
      actorId: session.user.id,
      after: warehouse,
    });

    return jsonResponse({ success: true, data: warehouse }, 201);
  });

  // PUT /api/warehouses/:id & PATCH /api/warehouses/:id
  const handleWarehouseUpdate = (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'OPERATIONS']);
    const store = getStore();
    const { id } = ctx.params;
    const body = ctx.body || {};

    const existing = store.get<Warehouse>('Warehouse', id);
    if (!existing) throw ApiError.notFound('Warehouse not found');

    const updated = store.update<Warehouse>('Warehouse', id, body);

    writeAuditLog({
      entityType: 'WAREHOUSE',
      entityId: id,
      action: 'WAREHOUSE_UPDATED',
      actorId: session.user.id,
      before: existing,
      after: updated,
    });

    return jsonResponse({ success: true, data: updated });
  };

  router.put('/api/warehouses/:id', handleWarehouseUpdate);
  router.patch('/api/warehouses/:id', handleWarehouseUpdate);

  // DELETE /api/warehouses/:id
  router.delete('/api/warehouses/:id', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN']);
    const store = getStore();
    const { id } = ctx.params;

    const warehouse = store.get<Warehouse>('Warehouse', id);
    if (!warehouse) throw ApiError.notFound('Warehouse not found');

    store.remove('Warehouse', id);

    writeAuditLog({
      entityType: 'WAREHOUSE',
      entityId: id,
      action: 'WAREHOUSE_DELETED',
      actorId: session.user.id,
      before: warehouse,
    });

    return jsonResponse({ success: true, message: 'Warehouse deleted' });
  });

  // GET /api/warehouses/:id/inventory
  router.get('/api/warehouses/:id/inventory', (ctx: DemoRequestContext) => {
    requireRole(['ADMIN', 'OPERATIONS', 'SALES_MANAGER']);
    const store = getStore();
    const { id } = ctx.params;

    const inventories = store
      .where<Inventory>('Inventory', inv => inv.warehouseId === id)
      .map(inv => {
        const product = store.get<Product>('Product', inv.productId);
        return { ...inv, product };
      });

    return jsonResponse({ success: true, data: inventories });
  });

  // POST & PUT /api/warehouses/:id/inventory
  const handleInventoryAdjust = (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'OPERATIONS']);
    const store = getStore();
    const { id: warehouseId } = ctx.params;
    const body = ctx.body || {};
    const { productId, quantity, reason } = body;

    if (!productId || quantity === undefined) {
      throw ApiError.badRequest('productId and quantity are required');
    }

    const existing = store.where<Inventory>(
      'Inventory',
      inv => inv.warehouseId === warehouseId && inv.productId === productId
    )[0];

    let inventory: Inventory;
    if (existing) {
      inventory = store.update<Inventory>('Inventory', existing.id, {
        quantityAvailable: Number(quantity),
        updatedAt: new Date().toISOString(),
      });
    } else {
      inventory = {
        id: `inv_${warehouseId}_${productId}`,
        warehouseId,
        productId,
        quantityAvailable: Number(quantity),
        quantityReserved: 0,
        updatedAt: new Date().toISOString(),
      };
      store.insert('Inventory', inventory);
    }

    writeAuditLog({
      entityType: 'INVENTORY',
      entityId: inventory.id,
      action: 'STOCK_ADJUSTED',
      actorId: session.user.id,
      before: { quantity: existing ? existing.quantityAvailable : null },
      after: { quantity: inventory.quantityAvailable, warehouseId, productId },
      reason: reason || 'Manual stock adjustment',
    });

    return jsonResponse({ success: true, data: inventory });
  };

  router.post('/api/warehouses/:id/inventory', handleInventoryAdjust);
  router.put('/api/warehouses/:id/inventory', handleInventoryAdjust);
}

