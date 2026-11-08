// src/demo/server/handlers/admin.ts
/**
 * Admin mock handlers:
 * CRUD for discount-rules, approval-rules, upsell-rules
 * plus gap fills: GET /api/customer-tiers, GET /api/product-categories
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireRole } from '../session';
import { getStore } from '@/demo/db/store';
import { writeAuditLog } from '../services/audit.service';
import { ApiError } from '../errors';
import type {
  DiscountRule,
  ApprovalRule,
  UpsellRule,
  CustomerTier,
  ProductCategory,
  Product,
} from '@/demo/db/schema';

export function registerAdminHandlers() {
  // ── Discount Rules ─────────────────────────────────────────────────────────

  router.get('/api/admin/discount-rules', () => {
    requireRole(['ADMIN']);
    const store = getStore();

    const rules = store
      .all<DiscountRule>('DiscountRule')
      .sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt));

    const hydrated = rules.map(r => {
      const tier = r.customerTierId
        ? store.get<CustomerTier>('CustomerTier', r.customerTierId)
        : null;
      const category = r.categoryId
        ? store.get<ProductCategory>('ProductCategory', r.categoryId)
        : null;
      return {
        ...r,
        customerTier: tier,
        category,
      };
    });

    return jsonResponse({ success: true, data: hydrated });
  });

  router.post('/api/admin/discount-rules', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN']);
    const store = getStore();
    const body = ctx.body || {};

    const { name, customerTierId, categoryId, maxDiscountPercent, priority, active } = body;
    if (maxDiscountPercent == null) {
      throw ApiError.badRequest('maxDiscountPercent is required');
    }

    const rule: DiscountRule = {
      id: `dr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name || 'Discount Rule',
      customerTierId: customerTierId || null,
      categoryId: categoryId || null,
      maxDiscountPercent: Number(maxDiscountPercent),
      priority: Number(priority || 0),
      active: active !== undefined ? Boolean(active) : true,
      createdAt: new Date().toISOString(),
    };

    store.insert('DiscountRule', rule);

    writeAuditLog({
      entityType: 'DISCOUNT_RULE',
      entityId: rule.id,
      action: 'DISCOUNT_RULE_CREATED',
      actorId: session.user.id,
      after: rule,
    });

    return jsonResponse({ success: true, data: rule }, 201);
  });

  const handleDiscountRuleUpdate = (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN']);
    const store = getStore();
    const { id } = ctx.params;
    const body = ctx.body || {};

    const existing = store.get<DiscountRule>('DiscountRule', id);
    if (!existing) throw ApiError.notFound('Discount rule not found');

    const updated = store.update<DiscountRule>('DiscountRule', id, body);

    writeAuditLog({
      entityType: 'DISCOUNT_RULE',
      entityId: id,
      action: 'DISCOUNT_RULE_UPDATED',
      actorId: session.user.id,
      before: existing,
      after: updated,
    });

    return jsonResponse({ success: true, data: updated });
  };

  router.put('/api/admin/discount-rules/:id', handleDiscountRuleUpdate);
  router.patch('/api/admin/discount-rules/:id', handleDiscountRuleUpdate);

  router.delete('/api/admin/discount-rules/:id', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN']);
    const store = getStore();
    const { id } = ctx.params;

    const existing = store.get<DiscountRule>('DiscountRule', id);
    if (!existing) throw ApiError.notFound('Discount rule not found');

    store.remove('DiscountRule', id);

    writeAuditLog({
      entityType: 'DISCOUNT_RULE',
      entityId: id,
      action: 'DISCOUNT_RULE_DELETED',
      actorId: session.user.id,
      before: existing,
    });

    return jsonResponse({ success: true, message: 'Discount rule deleted' });
  });

  // ── Approval Rules ─────────────────────────────────────────────────────────

  router.get('/api/admin/approval-rules', () => {
    requireRole(['ADMIN']);
    const store = getStore();

    const rules = store
      .all<ApprovalRule>('ApprovalRule')
      .sort((a, b) => a.minRiskScore - b.minRiskScore);

    return jsonResponse({ success: true, data: rules });
  });

  router.post('/api/admin/approval-rules', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN']);
    const store = getStore();
    const body = ctx.body || {};

    const { name, minRiskScore, maxRiskScore, requiredRoles, active } = body;
    if (minRiskScore == null || !requiredRoles) {
      throw ApiError.badRequest('minRiskScore and requiredRoles are required');
    }

    const rule: ApprovalRule = {
      id: `ar_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name || 'Approval Rule',
      minRiskScore: Number(minRiskScore),
      maxRiskScore: Number(maxRiskScore ?? 100),
      requiredRoles: typeof requiredRoles === 'string' ? requiredRoles : JSON.stringify(requiredRoles),
      active: active !== undefined ? Boolean(active) : true,
      createdAt: new Date().toISOString(),
    };

    store.insert('ApprovalRule', rule);

    writeAuditLog({
      entityType: 'APPROVAL_RULE',
      entityId: rule.id,
      action: 'APPROVAL_RULE_CREATED',
      actorId: session.user.id,
      after: rule,
    });

    return jsonResponse({ success: true, data: rule }, 201);
  });

  const handleApprovalRuleUpdate = (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN']);
    const store = getStore();
    const { id } = ctx.params;
    const body = ctx.body || {};

    const existing = store.get<ApprovalRule>('ApprovalRule', id);
    if (!existing) throw ApiError.notFound('Approval rule not found');

    const updated = store.update<ApprovalRule>('ApprovalRule', id, body);

    writeAuditLog({
      entityType: 'APPROVAL_RULE',
      entityId: id,
      action: 'APPROVAL_RULE_UPDATED',
      actorId: session.user.id,
      before: existing,
      after: updated,
    });

    return jsonResponse({ success: true, data: updated });
  };

  router.put('/api/admin/approval-rules/:id', handleApprovalRuleUpdate);
  router.patch('/api/admin/approval-rules/:id', handleApprovalRuleUpdate);

  router.delete('/api/admin/approval-rules/:id', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN']);
    const store = getStore();
    const { id } = ctx.params;

    const existing = store.get<ApprovalRule>('ApprovalRule', id);
    if (!existing) throw ApiError.notFound('Approval rule not found');

    store.remove('ApprovalRule', id);

    writeAuditLog({
      entityType: 'APPROVAL_RULE',
      entityId: id,
      action: 'APPROVAL_RULE_DELETED',
      actorId: session.user.id,
      before: existing,
    });

    return jsonResponse({ success: true, message: 'Approval rule deleted' });
  });

  // ── Upsell Rules ───────────────────────────────────────────────────────────

  router.get('/api/admin/upsell-rules', () => {
    requireRole(['ADMIN']);
    const store = getStore();

    const rules = store
      .all<UpsellRule>('UpsellRule')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const hydrated = rules.map(r => {
      const prod = store.get<Product>('Product', r.productId);
      const suggested = store.get<Product>('Product', r.suggestedProductId);
      return {
        ...r,
        product: prod ? { id: prod.id, name: prod.name, sku: prod.sku } : null,
        suggestedProduct: suggested
          ? { id: suggested.id, name: suggested.name, sku: suggested.sku }
          : null,
      };
    });

    return jsonResponse({ success: true, data: hydrated });
  });

  router.post('/api/admin/upsell-rules', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN']);
    const store = getStore();
    const body = ctx.body || {};

    const { productId, suggestedProductId, promotion, minMarginPercent, active } = body;
    if (!productId || !suggestedProductId) {
      throw ApiError.badRequest('productId and suggestedProductId are required');
    }

    const rule: UpsellRule = {
      id: `ur_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId,
      suggestedProductId,
      promotion: Boolean(promotion),
      minMarginPercent: Number(minMarginPercent || 0),
      active: active !== undefined ? Boolean(active) : true,
      createdAt: new Date().toISOString(),
    };

    store.insert('UpsellRule', rule);

    writeAuditLog({
      entityType: 'UPSELL_RULE',
      entityId: rule.id,
      action: 'UPSELL_RULE_CREATED',
      actorId: session.user.id,
      after: rule,
    });

    return jsonResponse({ success: true, data: rule }, 201);
  });

  const handleUpsellRuleUpdate = (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN']);
    const store = getStore();
    const { id } = ctx.params;
    const body = ctx.body || {};

    const existing = store.get<UpsellRule>('UpsellRule', id);
    if (!existing) throw ApiError.notFound('Upsell rule not found');

    const updated = store.update<UpsellRule>('UpsellRule', id, body);

    writeAuditLog({
      entityType: 'UPSELL_RULE',
      entityId: id,
      action: 'UPSELL_RULE_UPDATED',
      actorId: session.user.id,
      before: existing,
      after: updated,
    });

    return jsonResponse({ success: true, data: updated });
  };

  router.put('/api/admin/upsell-rules/:id', handleUpsellRuleUpdate);
  router.patch('/api/admin/upsell-rules/:id', handleUpsellRuleUpdate);

  router.delete('/api/admin/upsell-rules/:id', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN']);
    const store = getStore();
    const { id } = ctx.params;

    const existing = store.get<UpsellRule>('UpsellRule', id);
    if (!existing) throw ApiError.notFound('Upsell rule not found');

    store.remove('UpsellRule', id);

    writeAuditLog({
      entityType: 'UPSELL_RULE',
      entityId: id,
      action: 'UPSELL_RULE_DELETED',
      actorId: session.user.id,
      before: existing,
    });

    return jsonResponse({ success: true, message: 'Upsell rule deleted' });
  });

  // ── Gap fills: Customer Tiers & Product Categories ─────────────────────────

  router.get('/api/customer-tiers', () => {
    const store = getStore();
    const tiers = store.all<CustomerTier>('CustomerTier');
    return jsonResponse({ success: true, data: tiers });
  });

  router.get('/api/product-categories', () => {
    const store = getStore();
    const categories = store.all<ProductCategory>('ProductCategory');
    return jsonResponse({ success: true, data: categories });
  });
}

