// src/demo/server/handlers/ai.ts
/**
 * AI Explanation mock handler: POST /api/ai/explain
 * Strictly deterministic using pure buildDeterministicExplanation engine.
 * Never makes external API calls.
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireAuth } from '../session';
import { getStore } from '@/demo/db/store';
import { buildDeterministicExplanation } from '@/lib/engines/ai-explanation.engine';
import { ApiError } from '../errors';
import type { RiskReason, RiskLevel } from '@/lib/engines/risk.engine';
import type { HealthSignalReason, HealthLevel } from '@/lib/engines/deal-health.engine';
import type { Quote, Customer, ApprovalRequest, DealHealthEvent } from '@/demo/db/schema';

export function registerAiHandlers() {
  router.post('/api/ai/explain', (ctx: DemoRequestContext) => {
    requireAuth();
    const store = getStore();
    const body = ctx.body || {};

    let input: {
      riskScore: number;
      riskLevel: RiskLevel;
      riskReasons: RiskReason[];
      approvalRequired: boolean;
      requiredRoles: string[];
      dealHealthLevel?: HealthLevel;
      dealHealthReasons?: HealthSignalReason[];
      customerName?: string;
      quoteNumber?: string;
      total?: number;
    };

    if (body.quoteId) {
      const quote = store.get<Quote>('Quote', body.quoteId);
      if (!quote) throw ApiError.notFound('Quote not found');

      const customer = store.get<Customer>('Customer', quote.customerId);
      const approvals = store.where<ApprovalRequest>(
        'ApprovalRequest',
        a => a.quoteId === quote.id && a.status === 'PENDING'
      );
      const healthEvents = store
        .where<DealHealthEvent>('DealHealthEvent', e => e.quoteId === quote.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const latestHealth = healthEvents[0];

      const riskReasons: RiskReason[] = [];
      if (Number(quote.discountAmount) > 0) {
        const discountPct = Math.round(
          (Number(quote.discountAmount) / (Number(quote.subtotal) || 1)) * 100
        );
        riskReasons.push({
          component: 'DISCOUNT',
          severity: discountPct > 20 ? 'HIGH' : 'MEDIUM',
          points: discountPct > 20 ? 15 : 8,
          message: `High requested discount of ${discountPct}% across line items`,
        });
      }
      if (Number(quote.marginPercent ?? 25) < 15) {
        riskReasons.push({
          component: 'MARGIN',
          severity: 'HIGH',
          points: 15,
          message: `Gross margin at ${quote.marginPercent}%, below preferred threshold`,
        });
      }

      let dealHealthReasons: HealthSignalReason[] = [];
      if (latestHealth?.reasons) {
        try {
          const parsed = JSON.parse(latestHealth.reasons);
          if (Array.isArray(parsed)) {
            dealHealthReasons = parsed.map((r: any) =>
              typeof r === 'string'
                ? { signal: 'STALL', severity: 'MEDIUM', points: 5, message: r }
                : (r as HealthSignalReason)
            );
          }
        } catch {
          // Ignore
        }
      }

      input = {
        riskScore: Number(quote.riskScore ?? 0),
        riskLevel: (quote.riskLevel as RiskLevel) || 'LOW',
        riskReasons:
          riskReasons.length > 0
            ? riskReasons
            : [{ component: 'DISCOUNT', severity: 'LOW', points: 0, message: 'Pricing within standard guidelines' }],
        approvalRequired: quote.status === 'PENDING_APPROVAL' || approvals.length > 0,
        requiredRoles: approvals.map(a => a.role),
        dealHealthLevel: (latestHealth?.level as HealthLevel) || undefined,
        dealHealthReasons,
        customerName: customer?.companyName,
        quoteNumber: quote.quoteNumber,
        total: Number(quote.total),
      };
    } else {
      input = {
        riskScore: Number(body.riskScore ?? 0),
        riskLevel: (body.riskLevel as RiskLevel) || 'LOW',
        riskReasons: body.riskReasons ?? [],
        approvalRequired: Boolean(body.approvalRequired),
        requiredRoles: body.requiredRoles ?? [],
        dealHealthLevel: body.dealHealthLevel,
        dealHealthReasons: body.dealHealthReasons,
        customerName: body.customerName,
        quoteNumber: body.quoteNumber,
        total: body.total !== undefined ? Number(body.total) : undefined,
      };
    }

    const fallback = buildDeterministicExplanation(input);
    const formatted = `${fallback.summary}\n\n${fallback.riskExplanation}${
      fallback.approvalExplanation ? `\n\n${fallback.approvalExplanation}` : ''
    }`;

    return jsonResponse({
      explanation: formatted,
      structuredExplanation: fallback,
      usedFallback: true,
      note: 'Demo: deterministic explanation. Production calls an LLM and falls back to this.',
    });
  });
}

