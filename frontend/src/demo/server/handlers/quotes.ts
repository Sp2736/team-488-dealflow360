// src/demo/server/handlers/quotes.ts
/**
 * Quotes mock handlers:
 * GET/POST /api/quotes,
 * GET/PUT/PATCH/DELETE /api/quotes/:id,
 * POST /api/quotes/:id/evaluate,
 * POST /api/quotes/:id/submit,
 * POST /api/quotes/:id/confirm,
 * GET /api/quotes/:id/upsell,
 * POST /api/quotes/:id/negotiate,
 * GET /api/quotes/:id/audit
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireAuth, requireRole } from '../session';
import {
  createQuote,
  updateQuote,
  evaluateQuote,
  submitQuote,
  confirmQuote,
  deleteQuote,
  getQuote,
  listQuotes,
} from '../services/quote.service';
import { getUpsellSuggestions } from '../services/upsell.service';
import { submitNegotiation } from '../services/negotiation.service';
import { getAuditLogs } from '../services/audit.service';
import { ApiError } from '../errors';

export function registerQuotesHandlers() {
  // GET /api/quotes
  router.get('/api/quotes', async (ctx: DemoRequestContext) => {
    const session = requireAuth();

    const page = parseInt(ctx.query.get('page') ?? '1', 10);
    const limit = parseInt(ctx.query.get('limit') ?? '20', 10);
    const rawStatus = ctx.query.get('status') ?? undefined;
    const status = rawStatus
      ? rawStatus.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;
    const customerId = ctx.query.get('customerId') ?? undefined;
    const search = ctx.query.get('search') ?? undefined;

    // Sales reps only see their own quotes unless admin/manager/finance/ops
    const salesRepId = ['ADMIN', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS'].includes(
      session.user.role
    )
      ? ctx.query.get('salesRepId') ?? undefined
      : session.user.id;

    const result = await listQuotes({ salesRepId, customerId, status, search, page, limit });
    return jsonResponse(result);
  });

  // POST /api/quotes
  router.post('/api/quotes', async (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'SALES_REP', 'SALES_MANAGER']);
    const body = ctx.body || {};
    const { customerId, lines } = body;

    if (!customerId || !lines?.length) {
      throw ApiError.badRequest('customerId and lines are required');
    }

    const quote = await createQuote(
      {
        customerId,
        salesRepId: (body.salesRepId as string | undefined) ?? session.user.id,
        lines,
      },
      session.user.id
    );

    return jsonResponse(quote, 201);
  });

  // GET /api/quotes/:id
  router.get('/api/quotes/:id', async (ctx: DemoRequestContext) => {
    const session = requireAuth();
    const { id } = ctx.params;

    const quote = await getQuote(id);
    if (!quote) throw ApiError.notFound('Quote not found');

    if (session.user.role === 'SALES_REP' && quote.salesRepId !== session.user.id) {
      throw ApiError.forbidden('Forbidden: you can only view your own quotes');
    }

    return jsonResponse(quote);
  });

  // PUT /api/quotes/:id & PATCH /api/quotes/:id
  const handleUpdate = async (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'SALES_REP', 'SALES_MANAGER']);
    const { id } = ctx.params;
    const body = ctx.body || {};
    const { lines } = body;

    if (!lines?.length) {
      throw ApiError.badRequest('lines is required');
    }

    const updated = await updateQuote(id, lines, session.user.id);
    return jsonResponse(updated);
  };

  router.put('/api/quotes/:id', handleUpdate);
  router.patch('/api/quotes/:id', handleUpdate);

  // DELETE /api/quotes/:id
  router.delete('/api/quotes/:id', async (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'SALES_MANAGER']);
    const { id } = ctx.params;

    await deleteQuote(id, session.user.id);
    return jsonResponse({ success: true, message: 'Quote deleted' });
  });

  // POST /api/quotes/:id/evaluate
  router.post('/api/quotes/:id/evaluate', async (ctx: DemoRequestContext) => {
    const session = requireAuth();
    const { id } = ctx.params;

    const result = await evaluateQuote(id, session.user.id);
    return jsonResponse(result);
  });

  // POST /api/quotes/:id/submit
  router.post('/api/quotes/:id/submit', async (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'SALES_REP', 'SALES_MANAGER']);
    const { id } = ctx.params;

    const result = await submitQuote(id, session.user.id);
    return jsonResponse(result);
  });

  // POST /api/quotes/:id/confirm
  router.post('/api/quotes/:id/confirm', async (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE']);
    const { id } = ctx.params;

    const result = await confirmQuote(id, session.user.id);
    return jsonResponse(result);
  });

  // GET /api/quotes/:id/upsell
  router.get('/api/quotes/:id/upsell', async (ctx: DemoRequestContext) => {
    requireAuth();
    const { id } = ctx.params;

    const result = await getUpsellSuggestions(id);
    return jsonResponse(result);
  });

  // POST /api/quotes/:id/negotiate
  router.post('/api/quotes/:id/negotiate', async (ctx: DemoRequestContext) => {
    const { id } = ctx.params;
    const body = ctx.body || {};
    const { portalToken, proposedTerms, message } = body;

    if (!portalToken) {
      throw ApiError.unauthorized('Portal token required');
    }
    if (!proposedTerms?.length) {
      throw ApiError.badRequest('proposedTerms are required');
    }

    const result = await submitNegotiation(id, portalToken, proposedTerms, message);
    return jsonResponse({
      negotiationId: result.negotiationId,
      status: result.decision.newQuoteStatus,
      message: result.decision.requiresNewApproval
        ? 'Your counter-offer has been received and is under internal review.'
        : 'Your counter-offer has been noted.',
      quote: result.portalResponse,
    });
  });

  // GET /api/quotes/:id/audit
  router.get('/api/quotes/:id/audit', async (ctx: DemoRequestContext) => {
    requireAuth();
    const { id } = ctx.params;

    const logs = await getAuditLogs('QUOTE', id);
    return jsonResponse({ logs });
  });
}

