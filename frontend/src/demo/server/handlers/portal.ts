// src/demo/server/handlers/portal.ts
/**
 * Customer Portal mock handlers:
 * GET /api/portal/quote?token=
 * POST /api/portal/quotes/:token/confirm
 * GET/PUT/PATCH /api/portal/profile
 * POST /api/portal/profile/password
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireAuth } from '../session';
import { getStore } from '@/demo/db/store';
import { confirmQuote } from '../services/quote.service';
import { ApiError } from '../errors';
import type { Quote, Customer, QuoteLine, Product } from '@/demo/db/schema';

export function registerPortalHandlers() {
  // GET /api/portal/quote?token=XXX
  router.get('/api/portal/quote', (ctx: DemoRequestContext) => {
    let token = ctx.query.get('token');
    const store = getStore();

    if (!token) {
      // Fallback to flagship seeded portal token for seamless demo experience
      token = 'ptok_qte_0001';
    }

    const quotes = store.where<Quote>('Quote', q => q.portalToken === token);
    const quote = quotes[0];

    if (!quote) throw ApiError.notFound('Invalid token');

    const customer = store.get<Customer>('Customer', quote.customerId);
    const lines = store.where<QuoteLine>('QuoteLine', l => l.quoteId === quote.id);

    // Return RESTRICTED portal response (no internal margin or risk scores)
    return jsonResponse({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      customer: customer?.companyName,
      total: Number(quote.total),
      lines: lines.map(l => {
        const prod = store.get<Product>('Product', l.productId);
        return {
          id: l.id,
          productId: l.productId,
          productName: prod?.name,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discountPercent: Number(l.discountPercent),
          lineTotal: Number(l.lineTotal),
        };
      }),
    });
  });

  // POST /api/portal/quotes/:token/confirm
  router.post('/api/portal/quotes/:token/confirm', async (ctx: DemoRequestContext) => {
    const { token } = ctx.params;
    const store = getStore();

    const quotes = store.where<Quote>('Quote', q => q.portalToken === token);
    const quote = quotes[0];

    if (!quote) throw ApiError.notFound('Quote not found or invalid token');

    if (quote.status !== 'APPROVED' && quote.status !== 'DRAFT') {
      throw ApiError.badRequest('Only APPROVED quotes can be confirmed.');
    }

    const updated = await confirmQuote(quote.id, quote.customerId);
    return jsonResponse(updated);
  });

  // GET /api/portal/profile
  router.get('/api/portal/profile', () => {
    const session = requireAuth();
    const store = getStore();

    // Look up customer linked to portalUserId or email
    let customer = store.where<Customer>('Customer', c => c.portalUserId === session.user.id)[0];
    if (!customer) {
      customer = store.where<Customer>('Customer', c => c.email?.toLowerCase() === session.user.email.toLowerCase())[0];
    }
    if (!customer) {
      // Return first customer or fallback
      customer = store.all<Customer>('Customer')[0];
    }

    if (!customer) throw ApiError.notFound('Customer not found');

    return jsonResponse({ success: true, customer });
  });

  // PUT /api/portal/profile & PATCH /api/portal/profile
  const handleProfileUpdate = (ctx: DemoRequestContext) => {
    const session = requireAuth();
    const store = getStore();
    const body = ctx.body || {};

    let customer = store.where<Customer>('Customer', c => c.portalUserId === session.user.id)[0];
    if (!customer) {
      customer = store.where<Customer>('Customer', c => c.email?.toLowerCase() === session.user.email.toLowerCase())[0];
    }
    if (!customer) throw ApiError.notFound('Customer not found');

    const updated = store.update<Customer>('Customer', customer.id, {
      ...(body.contactName !== undefined && { contactName: body.contactName }),
      ...(body.email !== undefined && { email: body.email }),
      updatedAt: new Date().toISOString(),
    });

    return jsonResponse({ success: true, customer: updated });
  };

  router.put('/api/portal/profile', handleProfileUpdate);
  router.patch('/api/portal/profile', handleProfileUpdate);

  // POST /api/portal/profile/password
  router.post('/api/portal/profile/password', (ctx: DemoRequestContext) => {
    requireAuth();
    const body = ctx.body || {};
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Missing required fields');
    }

    if (String(newPassword).length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters');
    }

    // Password change succeeds in demo without storing any real password hash
    return jsonResponse({ success: true, message: 'Password updated successfully' });
  });
}

