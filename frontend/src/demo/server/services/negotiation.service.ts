// src/demo/server/services/negotiation.service.ts
/**
 * Negotiation Service — browser-side port over store.ts
 * Handles customer counter-offers from the portal and enforces re-approval invariants.
 */

import { getStore } from '@/demo/db/store';
import { writeAuditLog } from './audit.service';
import { ApiError } from '../errors';
import {
  runNegotiationDecision,
  buildPortalResponse,
  isNegotiable,
} from '@/lib/engines/negotiation.engine';
import { runApprovalEngine } from '@/lib/engines/approval.engine';
import { runDiscountEngine } from '@/lib/engines/discount.engine';
import { runRiskEngine } from '@/lib/engines/risk.engine';
import { runMarginEngine } from '@/lib/engines/margin.engine';
import { resolvePricing } from '@/lib/engines/pricing.engine';
import type {
  Quote,
  Customer,
  QuoteLine,
  Product,
  DiscountRule,
  ApprovalRequest,
  Negotiation,
  NegotiationMessage,
} from '@/demo/db/schema';

export async function submitNegotiation(
  quoteId: string,
  portalToken: string,
  proposedTerms: Array<{ lineId: string; proposedDiscountPercent: number }>,
  message?: string
) {
  const store = getStore();

  const quotes = store.where<Quote>('Quote', q => q.portalToken === portalToken);
  const quote = quotes[0];

  if (!quote || quote.id !== quoteId) {
    throw ApiError.badRequest('Invalid portal token or quote ID');
  }

  const POST_CONFIRMATION_STATUSES = ['CONFIRMED', 'FULFILLING', 'COMPLETED', 'CANCELLED'];
  if (POST_CONFIRMATION_STATUSES.includes(quote.status)) {
    throw ApiError.badRequest(
      `Renegotiation is not permitted — this quote has status "${quote.status}". An order has already been created.`
    );
  }

  if (!isNegotiable(quote.status)) {
    throw ApiError.badRequest(`Quote status "${quote.status}" does not permit negotiation`);
  }

  const customer = store.get<Customer>('Customer', quote.customerId);
  const lines = store.where<QuoteLine>('QuoteLine', l => l.quoteId === quote.id);
  const existingApprovals = store.where<ApprovalRequest>('ApprovalRequest', r => r.quoteId === quote.id);

  // Create negotiation record
  const negotiationId = `neg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const maxProposed = proposedTerms.reduce((max, t) => Math.max(max, t.proposedDiscountPercent), 0);

  const negotiation: Negotiation = {
    id: negotiationId,
    quoteId: quote.id,
    customerId: quote.customerId,
    status: 'SUBMITTED',
    proposedDiscount: maxProposed,
    message: message ?? null,
    createdAt: new Date().toISOString(),
  };
  store.insert('Negotiation', negotiation);

  for (const t of proposedTerms) {
    const msg: NegotiationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      negotiationId,
      quoteLineId: t.lineId,
      authorRole: 'CUSTOMER',
      message: `Proposed discount: ${t.proposedDiscountPercent}%`,
      createdAt: new Date().toISOString(),
    };
    store.insert('NegotiationMessage', msg);
  }

  // Evaluation with proposed terms
  const tierId = customer?.tierId;
  const productMap = new Map<string, Product>();
  for (const line of lines) {
    const p = store.get<Product>('Product', line.productId);
    if (p) productMap.set(line.productId, p);
  }

  const categoryIds = [...new Set(Array.from(productMap.values()).map(p => p.categoryId).filter(Boolean))] as string[];

  const discountRules = store.where<DiscountRule>(
    'DiscountRule',
    r =>
      r.active &&
      Boolean(
        (r.customerTierId && r.customerTierId === tierId) ||
          (r.categoryId && categoryIds.includes(r.categoryId))
      )
  );

  const tierCeilingMap = new Map<string, number>();
  const catCeilingMap = new Map<string, number>();

  for (const rule of discountRules) {
    if (rule.customerTierId && rule.categoryId) {
      tierCeilingMap.set(rule.categoryId, Number(rule.maxDiscountPercent));
    } else if (rule.customerTierId && !rule.categoryId) {
      for (const cid of categoryIds) {
        if (!tierCeilingMap.has(cid)) tierCeilingMap.set(cid, Number(rule.maxDiscountPercent));
      }
    } else if (!rule.customerTierId && rule.categoryId) {
      catCeilingMap.set(rule.categoryId, Number(rule.maxDiscountPercent));
    }
  }

  const proposedDiscountMap = new Map(proposedTerms.map(t => [t.lineId, t.proposedDiscountPercent]));

  const discountInputLines = lines.map(line => {
    const product = productMap.get(line.productId);
    const categoryId = product?.categoryId ?? '';
    const pricing = resolvePricing({
      basePrice: Number(product?.basePrice ?? 0),
      costPrice: Number(product?.costPrice ?? 0),
      quantity: Number(line.quantity),
    });
    const discountPercent = proposedDiscountMap.get(line.id) ?? Number(line.discountPercent);
    const lineRevenue = Math.round(pricing.subtotal * (1 - discountPercent / 100) * 100) / 100;
    return {
      lineId: line.id,
      categoryId,
      requestedDiscountPercent: discountPercent,
      lineRevenue,
      tierCeilingPercent: tierCeilingMap.get(categoryId) ?? 100,
      categoryMaxPercent: catCeilingMap.get(categoryId) ?? 100,
    };
  });

  const discountResult = runDiscountEngine({ lines: discountInputLines });

  const marginResult = runMarginEngine({
    lines: lines.map(line => {
      const product = productMap.get(line.productId);
      return {
        lineId: line.id,
        unitPrice: Number(product?.basePrice ?? 0),
        quantity: Number(line.quantity),
        discountPercent: proposedDiscountMap.get(line.id) ?? Number(line.discountPercent),
        costPrice: Number(product?.costPrice ?? 0),
      };
    }),
  });

  const riskResult = runRiskEngine({
    lines: lines.map((line, i) => ({
      lineId: line.id,
      lineRevenue: discountInputLines[i].lineRevenue,
      overagePercent: discountResult.lineResults[i].overagePercent,
      productName: productMap.get(line.productId)?.name ?? 'Unknown',
      categoryName: productMap.get(line.productId)?.categoryId ?? 'Unknown',
    })),
    quoteMarginPercent: marginResult.quoteMarginPercent,
    inventory: { warehouseCount: 1, fullyFulfillable: true },
  });

  const approvalResult = runApprovalEngine({
    riskLevel: riskResult.level,
    lineOverages: discountResult.lineResults.map((r, i) => ({
      lineId: r.lineId,
      overagePercent: r.overagePercent,
      productName: productMap.get(lines[i].productId)?.name ?? 'Unknown',
    })),
  });

  const lastApprovedRoles = existingApprovals
    .filter(r => r.status === 'APPROVED')
    .map(r => r.role as 'SALES_MANAGER' | 'FINANCE');

  const decision = runNegotiationDecision({
    quoteId: quote.id,
    quoteStatus: quote.status,
    proposedTerms,
    currentApprovalState: { lastApprovedRoles },
    newRiskLevel: riskResult.level,
    newRiskScore: riskResult.score,
    newRequiredRoles: approvalResult.requiredRoles,
    newApprovalRequired: approvalResult.approvalRequired,
  });

  if (decision.requiresNewApproval) {
    approvalResult.requiredRoles.forEach((role, idx) => {
      const req: ApprovalRequest = {
        id: `app_${quote.id}_neg_${idx + 1}_${Date.now()}`,
        quoteId: quote.id,
        step: idx + 1,
        role,
        status: idx === 0 ? 'PENDING' : 'WAITING',
        createdAt: new Date().toISOString(),
      };
      store.insert('ApprovalRequest', req);
    });
  }

  // Update quote status and risk
  store.update<Quote>('Quote', quote.id, {
    status: decision.newQuoteStatus as any,
    riskScore: Math.round(riskResult.score),
    riskLevel: riskResult.level as any,
  });

  const beforeDiscounts = Object.fromEntries(lines.map(l => [l.id, Number(l.discountPercent)]));
  const afterDiscounts = Object.fromEntries(proposedTerms.map(t => [t.lineId, t.proposedDiscountPercent]));

  await writeAuditLog({
    entityType: 'QUOTE',
    entityId: quote.id,
    action: 'NEGOTIATION_COUNTER_OFFER',
    actorId: customer?.id ?? 'CUSTOMER',
    before: { discounts: beforeDiscounts, riskLevel: quote.riskLevel },
    after: {
      discounts: afterDiscounts,
      riskLevel: riskResult.level,
      requiresNewApproval: decision.requiresNewApproval,
    },
    reason: 'Customer counter-offer',
  });

  const updatedQuote = store.get<Quote>('Quote', quote.id)!;
  const updatedLines = store.where<QuoteLine>('QuoteLine', l => l.quoteId === quote.id);

  return {
    negotiationId: negotiation.id,
    decision: {
      isNegotiable: decision.isNegotiable,
      requiresNewApproval: decision.requiresNewApproval,
      newQuoteStatus: decision.newQuoteStatus,
    },
    portalResponse: buildPortalResponse(
      {
        id: updatedQuote.id,
        quoteNumber: updatedQuote.quoteNumber,
        status: updatedQuote.status,
        total: Number(updatedQuote.total),
        quoteLines: updatedLines.map(l => ({
          id: l.id,
          product: { name: productMap.get(l.productId)?.name ?? '' },
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discountPercent: Number(l.discountPercent),
          lineTotal: Number(l.lineTotal),
        })),
      },
      decision.requiresNewApproval
        ? 'Your counter-offer has been received and is under internal review.'
        : 'Your counter-offer has been noted.'
    ),
  };
}
