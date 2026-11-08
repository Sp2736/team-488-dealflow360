// src/demo/server/services/fulfillment.service.ts
/**
 * Fulfillment Service — browser-side port over store.ts
 * Calls pure Fulfillment Engine and manages warehouse allocations.
 */

import { getStore } from '@/demo/db/store';
import { writeAuditLog } from './audit.service';
import { ApiError } from '../errors';
import { runFulfillmentEngine, validateManualOverride } from '@/lib/engines/fulfillment.engine';
import type {
  Inventory,
  Warehouse,
  FulfillmentAllocation,
  Product,
} from '@/demo/db/schema';

export async function allocateOrder(
  orderId: string,
  productId: string,
  requestedQuantity: number,
  actorId: string,
  manualOverride?: Array<{ warehouseId: string; allocated: number }>,
  overrideReason?: string
) {
  const store = getStore();

  const inventories = store.where<Inventory>('Inventory', inv => inv.productId === productId);
  const warehouses = inventories.map(inv => {
    const w = store.get<Warehouse>('Warehouse', inv.warehouseId);
    return {
      warehouseId: inv.warehouseId,
      warehouseName: w?.name ?? '',
      available: Number(inv.quantityAvailable),
      shippingCost: Number(w?.shippingBaseCost ?? 0),
    };
  });

  let allocation;

  if (manualOverride) {
    const error = validateManualOverride(requestedQuantity, manualOverride, warehouses);
    if (error) {
      throw ApiError.badRequest(`Manual override rejected: ${error}`);
    }

    allocation = {
      allocations: manualOverride.map(o => ({
        warehouseId: o.warehouseId,
        warehouseName: warehouses.find(w => w.warehouseId === o.warehouseId)?.warehouseName ?? '',
        allocated: o.allocated,
        shippingCost: warehouses.find(w => w.warehouseId === o.warehouseId)?.shippingCost ?? 0,
      })),
      shipmentCount: manualOverride.filter(o => o.allocated > 0).length,
      totalShippingCost: manualOverride.reduce(
        (s, o) => s + (warehouses.find(w => w.warehouseId === o.warehouseId)?.shippingCost ?? 0),
        0
      ),
      backorderQuantity: Math.max(
        0,
        requestedQuantity - manualOverride.reduce((s, o) => s + o.allocated, 0)
      ),
      fullyFulfillable: manualOverride.reduce((s, o) => s + o.allocated, 0) >= requestedQuantity,
    };

    await writeAuditLog({
      entityType: 'ORDER',
      entityId: orderId,
      action: 'FULFILLMENT_MANUAL_OVERRIDE',
      actorId,
      after: { allocations: allocation.allocations, overrideReason },
      reason: overrideReason,
    });
  } else {
    allocation = runFulfillmentEngine({ requestedQuantity, warehouses });
  }

  // Remove previous allocations for this product+order
  const oldAllocs = store.where<FulfillmentAllocation>(
    'FulfillmentAllocation',
    a => a.orderId === orderId && a.productId === productId
  );
  for (const old of oldAllocs) {
    store.remove('FulfillmentAllocation', old.id);
  }

  // Persist new allocations
  if (allocation.allocations.length > 0) {
    for (const a of allocation.allocations) {
      const row: FulfillmentAllocation = {
        id: `fa_${orderId}_${a.warehouseId}_${productId}`,
        orderId,
        warehouseId: a.warehouseId,
        productId,
        quantity: a.allocated,
        shippingCost: a.shippingCost,
        status: 'ALLOCATED',
        createdAt: new Date().toISOString(),
      };
      store.insert('FulfillmentAllocation', row);
    }
  }

  if (!manualOverride) {
    await writeAuditLog({
      entityType: 'ORDER',
      entityId: orderId,
      action: 'FULFILLMENT_ALLOCATED',
      actorId,
      after: {
        productId,
        shipmentCount: allocation.shipmentCount,
        backorderQuantity: allocation.backorderQuantity,
        fullyFulfillable: allocation.fullyFulfillable,
      },
    });
  }

  return allocation;
}

export async function getOrderAllocations(orderId: string) {
  const store = getStore();
  const allocations = store.where<FulfillmentAllocation>(
    'FulfillmentAllocation',
    a => a.orderId === orderId
  );

  return allocations.map(a => {
    const warehouse = store.get<Warehouse>('Warehouse', a.warehouseId);
    const product = store.get<Product>('Product', a.productId);
    return {
      ...a,
      warehouse: warehouse ? { id: warehouse.id, name: warehouse.name, code: warehouse.code } : null,
      product: product ? { id: product.id, name: product.name, sku: product.sku } : null,
    };
  });
}

