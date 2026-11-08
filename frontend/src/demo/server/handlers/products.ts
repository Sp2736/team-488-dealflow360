// src/demo/server/handlers/products.ts
/**
 * Products mock handlers:
 * GET/POST /api/products, POST/PATCH /api/products/bulk,
 * GET/PUT/PATCH/DELETE /api/products/:id,
 * GET/POST /api/products/:id/variants,
 * PUT/PATCH/DELETE /api/products/:id/variants/:variantId
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { getStore } from '@/demo/db/store';
import { requireRole } from '../session';
import { generateSKU } from '@/lib/sku';
import { allocatePoolId } from '@/demo/db/seed/ids';
import { writeAuditLog } from '../services/audit.service';
import { ApiError } from '../errors';
import type {
  Product,
  ProductCategory,
  ProductVariant,
  Inventory,
  Warehouse,
} from '@/demo/db/schema';

export function registerProductsHandlers() {
  // GET /api/products
  router.get('/api/products', (ctx: DemoRequestContext) => {
    requireRole(['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS']);
    const store = getStore();

    const categoryFilter = ctx.query.get('categoryId');
    const searchFilter = ctx.query.get('search');

    let products = store.all<Product>('Product');

    if (categoryFilter) {
      products = products.filter(p => p.categoryId === categoryFilter);
    }
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      products = products.filter(
        p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    products.sort((a, b) => a.name.localeCompare(b.name));

    const hydrated = products.map(p => {
      const category = p.categoryId ? store.get<ProductCategory>('ProductCategory', p.categoryId) : null;
      const inventories = store
        .where<Inventory>('Inventory', inv => inv.productId === p.id)
        .map(inv => {
          const warehouse = store.get<Warehouse>('Warehouse', inv.warehouseId);
          return { ...inv, warehouse };
        });

      return {
        ...p,
        category,
        inventories,
      };
    });

    return jsonResponse({ success: true, data: hydrated });
  });

  // POST /api/products
  router.post('/api/products', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'OPERATIONS']);
    const store = getStore();
    const body = ctx.body || {};

    const { name, categoryId, type, unit, basePrice, costPrice, taxPercent, description } = body;
    let { sku } = body;

    if (!name || !categoryId || !type || basePrice == null) {
      throw ApiError.badRequest('Missing required fields');
    }

    if (!sku) {
      const category = store.get<ProductCategory>('ProductCategory', categoryId);
      const catName = category ? category.name : 'GEN';

      let counter = 1;
      let uniqueSkuFound = false;
      const allSkus = new Set(store.all<Product>('Product').map(p => p.sku));

      while (!uniqueSkuFound) {
        sku = generateSKU(catName, type, name, counter);
        if (!allSkus.has(sku)) {
          uniqueSkuFound = true;
        } else {
          counter++;
        }
      }
    }

    const existingIds = new Set(store.all<Product>('Product').map(p => p.id));
    const productId = allocatePoolId('product', existingIds);

    const product: Product = {
      id: productId,
      name,
      sku,
      categoryId,
      type,
      unit: unit || 'unit',
      basePrice: Number(basePrice),
      costPrice: Number(costPrice || 0),
      taxPercent: Number(taxPercent || 0),
      description: description || null,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.insert('Product', product);

    writeAuditLog({
      entityType: 'PRODUCT',
      entityId: productId,
      action: 'PRODUCT_CREATED',
      actorId: session.user.id,
      after: { name, sku, basePrice },
    });

    return jsonResponse({ success: true, data: product }, 201);
  });

  // POST & PATCH /api/products/bulk
  const handleBulk = (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'OPERATIONS']);
    const store = getStore();
    const { ids, action, patch } = ctx.body || {};

    if (!Array.isArray(ids) || !action) {
      throw ApiError.badRequest('Invalid payload');
    }

    if (ids.length === 0) {
      return jsonResponse({ success: true, count: 0 });
    }

    let count = 0;
    for (const id of ids) {
      const prod = store.get<Product>('Product', id);
      if (!prod) continue;

      if (action === 'archive' || action === 'delete') {
        store.update<Product>('Product', id, { active: false });
        count++;
      } else if (action === 'activate') {
        store.update<Product>('Product', id, { active: true });
        count++;
      } else if (action === 'update' && patch) {
        const cleanPatch = { ...patch };
        delete cleanPatch.id;
        delete cleanPatch.sku;
        store.update<Product>('Product', id, cleanPatch);
        count++;
      }

      writeAuditLog({
        entityType: 'PRODUCT',
        entityId: id,
        action: `PRODUCT_BULK_${action.toUpperCase()}`,
        actorId: session.user.id,
      });
    }

    return jsonResponse({ success: true, count });
  };

  router.post('/api/products/bulk', handleBulk);
  router.patch('/api/products/bulk', handleBulk);

  // GET /api/products/:id
  router.get('/api/products/:id', (ctx: DemoRequestContext) => {
    const store = getStore();
    const { id } = ctx.params;

    const product = store.get<Product>('Product', id);
    if (!product) throw ApiError.notFound('Product not found');

    const category = product.categoryId
      ? store.get<ProductCategory>('ProductCategory', product.categoryId)
      : null;
    const variants = store.where<ProductVariant>('ProductVariant', v => v.productId === id);

    return jsonResponse({
      success: true,
      data: {
        ...product,
        category,
        variants,
      },
    });
  });

  // PUT /api/products/:id & PATCH /api/products/:id
  const handleProductUpdate = (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'OPERATIONS']);
    const store = getStore();
    const { id } = ctx.params;
    const body = ctx.body || {};

    const existing = store.get<Product>('Product', id);
    if (!existing) throw ApiError.notFound('Product not found');

    const updated = store.update<Product>('Product', id, body);

    writeAuditLog({
      entityType: 'PRODUCT',
      entityId: id,
      action: 'PRODUCT_UPDATED',
      actorId: session.user.id,
      before: existing,
      after: updated,
    });

    return jsonResponse({ success: true, data: updated });
  };

  router.put('/api/products/:id', handleProductUpdate);
  router.patch('/api/products/:id', handleProductUpdate);

  // DELETE /api/products/:id
  router.delete('/api/products/:id', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN']);
    const store = getStore();
    const { id } = ctx.params;

    const product = store.get<Product>('Product', id);
    if (!product) throw ApiError.notFound('Product not found');

    store.remove('Product', id);

    writeAuditLog({
      entityType: 'PRODUCT',
      entityId: id,
      action: 'PRODUCT_DELETED',
      actorId: session.user.id,
      before: product,
    });

    return jsonResponse({ success: true, message: 'Product deleted' });
  });

  // GET /api/products/:id/variants
  router.get('/api/products/:id/variants', (ctx: DemoRequestContext) => {
    requireRole(['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS']);
    const store = getStore();
    const { id } = ctx.params;

    const variants = store.where<ProductVariant>('ProductVariant', v => v.productId === id);
    return jsonResponse({ success: true, data: variants });
  });

  // POST /api/products/:id/variants
  router.post('/api/products/:id/variants', (ctx: DemoRequestContext) => {
    requireRole(['ADMIN']);
    const store = getStore();
    const { id: productId } = ctx.params;
    const body = ctx.body || {};

    const name = body.name || (body.attributeName && body.value ? `${body.attributeName}: ${body.value}` : 'Default');
    const sku = body.sku || `${productId}-var-${Date.now().toString(36).substring(2, 6)}`;
    const extraPrice = Number(body.extraPrice || 0);

    const variant: ProductVariant = {
      id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId,
      sku,
      name,
      extraPrice,
      active: true,
      createdAt: new Date().toISOString(),
    };

    store.insert('ProductVariant', variant);
    return jsonResponse({ success: true, data: variant }, 201);
  });

  // PUT /api/products/:id/variants/:variantId & PATCH /api/products/:id/variants/:variantId
  const handleVariantUpdate = (ctx: DemoRequestContext) => {
    requireRole(['ADMIN']);
    const store = getStore();
    const { variantId } = ctx.params;
    const body = ctx.body || {};

    const updated = store.update<ProductVariant>('ProductVariant', variantId, body);
    return jsonResponse({ success: true, data: updated });
  };

  router.put('/api/products/:id/variants/:variantId', handleVariantUpdate);
  router.patch('/api/products/:id/variants/:variantId', handleVariantUpdate);

  // DELETE /api/products/:id/variants/:variantId
  router.delete('/api/products/:id/variants/:variantId', (ctx: DemoRequestContext) => {
    requireRole(['ADMIN']);
    const store = getStore();
    const { variantId } = ctx.params;

    store.remove('ProductVariant', variantId);
    return jsonResponse({ success: true });
  });
}

