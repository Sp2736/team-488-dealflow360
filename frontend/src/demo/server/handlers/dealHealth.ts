// src/demo/server/handlers/dealHealth.ts
/**
 * Deal Health mock handlers: GET /api/deal-health, POST /api/deal-health
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireAuth } from '../session';
import { getDealHealthDashboard, computeDealHealth } from '../services/deal-health.service';
import { ApiError } from '../errors';

export function registerDealHealthHandlers() {
  router.get('/api/deal-health', async (ctx: DemoRequestContext) => {
    const session = requireAuth();
    const salesRepId =
      session.user.role === 'SALES_REP'
        ? session.user.id
        : ctx.query.get('salesRepId') ?? undefined;

    const results = await getDealHealthDashboard(salesRepId);
    return jsonResponse({ results, total: results.length });
  });

  router.post('/api/deal-health', async (ctx: DemoRequestContext) => {
    requireAuth();
    const body = ctx.body || {};
    if (!body.quoteId) {
      throw ApiError.badRequest('quoteId required');
    }

    const result = await computeDealHealth(body.quoteId);
    return jsonResponse(result);
  });
}

