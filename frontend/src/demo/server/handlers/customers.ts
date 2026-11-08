// src/demo/server/handlers/customers.ts
/**
 * Customers mock handlers:
 * GET/POST /api/customers,
 * GET /api/customers/:id/discount-ceiling,
 * POST /api/customers/:id/invite
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { getStore } from '@/demo/db/store';
import { requireRole } from '../session';
import { allocatePoolId } from '@/demo/db/seed/ids';
import { writeAuditLog } from '../services/audit.service';
import { withBasePath } from '@/lib/basePath';
import { ApiError } from '../errors';
import type {
  Customer,
  CustomerTier,
  DiscountRule,
  CustomerInvite,
} from '@/demo/db/schema';

export function registerCustomersHandlers() {
  // GET /api/customers
  router.get('/api/customers', () => {
    requireRole(['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS']);
    const store = getStore();

    const customers = store.all<Customer>('Customer').sort((a, b) =>
      a.companyName.localeCompare(b.companyName)
    );

    const hydrated = customers.map(c => {
      const tier = c.tierId ? store.get<CustomerTier>('CustomerTier', c.tierId) : null;
      return {
        ...c,
        tier,
      };
    });

    return jsonResponse({ success: true, data: hydrated });
  });

  // POST /api/customers
  router.post('/api/customers', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'SALES_REP', 'SALES_MANAGER']);
    const store = getStore();
    const body = ctx.body || {};

    const { companyName, contactName, email, tierId, currency } = body;
    if (!companyName) {
      throw ApiError.badRequest('companyName is required');
    }

    const customer: Customer = {
      id: `cus_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyName,
      contactName: contactName || null,
      email: email || null,
      tierId: tierId || null,
      currency: currency || 'INR',
      active: true,
      portalUserId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.insert('Customer', customer);

    writeAuditLog({
      entityType: 'CUSTOMER',
      entityId: customer.id,
      action: 'CUSTOMER_CREATED',
      actorId: session.user.id,
      after: customer,
    });

    return jsonResponse({ success: true, data: customer }, 201);
  });

  // GET /api/customers/:id/discount-ceiling
  router.get('/api/customers/:id/discount-ceiling', (ctx: DemoRequestContext) => {
    requireRole(['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS']);
    const store = getStore();
    const { id } = ctx.params;

    const customer = store.get<Customer>('Customer', id);
    if (!customer) throw ApiError.notFound('Customer not found');

    const rules = store
      .where<DiscountRule>(
        'DiscountRule',
        r => r.active && (r.customerTierId === customer.tierId || r.customerTierId === null)
      )
      .sort((a, b) => {
        // tier-specific rules before global
        if (a.customerTierId && !b.customerTierId) return -1;
        if (!a.customerTierId && b.customerTierId) return 1;
        // higher priority wins
        return b.priority - a.priority;
      });

    const rule = rules[0];
    const tier = customer.tierId ? store.get<CustomerTier>('CustomerTier', customer.tierId) : null;

    const maxDiscountPercent = rule
      ? Number(rule.maxDiscountPercent)
      : tier
      ? Number(tier.defaultDiscountPercent)
      : 100;

    return jsonResponse({
      success: true,
      data: {
        maxDiscountPercent,
        tierId: customer.tierId,
      },
    });
  });

  // POST /api/customers/:id/invite
  router.post('/api/customers/:id/invite', (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'SALES_REP', 'SALES_MANAGER']);
    const store = getStore();
    const { id } = ctx.params;

    const customer = store.get<Customer>('Customer', id);
    if (!customer) throw ApiError.notFound('Customer not found');

    if (!customer.email) {
      throw ApiError.badRequest('Customer does not have an email address set');
    }

    // Revoke previous pending invites
    const pendingInvites = store.where<CustomerInvite>(
      'CustomerInvite',
      i => i.customerId === customer.id && i.status === 'PENDING'
    );
    for (const inv of pendingInvites) {
      store.update<CustomerInvite>('CustomerInvite', inv.id, { status: 'REVOKED' });
    }

    // Allocate token from pool
    const existingTokens = new Set(store.all<CustomerInvite>('CustomerInvite').map(i => i.token));
    const token = allocatePoolId('invite', existingTokens);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const invite: CustomerInvite = {
      id: `inv_req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerId: customer.id,
      email: customer.email,
      token,
      status: 'PENDING',
      invitedById: session.user.id,
      expiresAt,
      createdAt: new Date().toISOString(),
    };
    store.insert('CustomerInvite', invite);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const inviteUrl = `${origin}${withBasePath(`/onboard/${token}`)}`;

    const inviterName = session.user.name || 'DealFlow360 Team';
    const emailPreview = {
      to: customer.email,
      subject: `Invitation to DealFlow360 Customer Portal for ${customer.companyName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 2px solid #000;">
          <h2>Welcome to DealFlow360 Customer Portal</h2>
          <p>Hi ${customer.contactName || customer.companyName},</p>
          <p>${inviterName} has invited you to access your customer portal to view and negotiate quotations in real time.</p>
          <p><a href="${inviteUrl}" style="display:inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; font-weight: bold;">Accept Invitation & Setup Account</a></p>
          <p><small>Link: ${inviteUrl}</small></p>
        </div>
      `,
    };

    writeAuditLog({
      entityType: 'CUSTOMER_INVITE',
      entityId: invite.id,
      action: 'INVITE_GENERATED',
      actorId: session.user.id,
      after: { customerId: customer.id, token },
    });

    return jsonResponse({
      success: true,
      inviteUrl,
      token,
      emailSent: false,
      emailPreview,
      message: 'Invite generated successfully (simulated email preview)',
    });
  });
}

