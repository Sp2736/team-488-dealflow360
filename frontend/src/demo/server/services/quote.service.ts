// src/demo/server/services/quote.service.ts
/**
 * Quote Service — browser-side port over store.ts
 * Orchestrates the full evaluate pipeline: Pricing → Discount → Margin → Risk → Approval
 */

import { getStore } from '@/demo/db/store';
import { writeAuditLog } from './audit.service';
import { allocateOrder } from './fulfillment.service';
import { createOrderBilling } from './billing.service';
import { allocatePoolId } from '@/demo/db/seed/ids';
import { ApiError } from '../errors';
import {
  resolvePricing,
  runDiscountEngine,
  runMarginEngine,
  runRiskEngine,
  runApprovalEngine,
  type DiscountLineInput,
  type MarginLineInput,
  type RiskLineInput,
} from '@/lib/engines';
import type {
  Quote,
  QuoteLine,
  Customer,
  CustomerTier,
  Product,
  DiscountRule,
  Inventory,
  ApprovalRequest,
  Order,
  User,
} from '@/demo/db/schema';

export interface QuoteLineInput {
  productId: string;
  quantity: number;
  discountPercent: number;
  billingType?: 'ONE_TIME' | 'RECURRING';
  subscriptionPlanId?: string;
}

export interface CreateQuoteInput {
  customerId: string;
  salesRepId: string;
  lines: QuoteLineInput[];
}

export interface EvaluateQuoteResult {
  quoteId: string;
  pricing: {
    subtotal: number;
    discountAmount: number;
    total: number;
    taxTotal: number;
  };
  discount: {
    hasAnyOverage: boolean;
    lineResults: Array<{
      lineId: string;
      allowedPercent: number;
      overagePercent: number;
      bindingRule: string;
      inViolation: boolean;
    }>;
  };
  margin: {
    quoteMarginAmount: number;
    quoteTotalRevenue: number;
    quoteMarginPercent: number;
  };
  risk: {
    score: number;
    level: string;
    reasons: Array<{ component: string; severity: string; message: string; points: number }>;
  };
  approval: {
    approvalRequired: boolean;
    requiredRoles: string[];
    triggeredByHardViolation: boolean;
  };
}

function generateQuoteNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `Q-${ts}`;
}

export async function createQuote(input: CreateQuoteInput, actorId: string): Promise<any> {
  const store = getStore();

  const customer = store.get<Customer>('Customer', input.customerId);
  if (!customer) {
    throw ApiError.notFound(`Customer ${input.customerId} not found`);
  }

  const existingQuotes = new Set(store.all<Quote>('Quote').map(q => q.id));
  const quoteId = allocatePoolId('quote', existingQuotes);

  // Build quote lines with server-side pricing
  const lineData: QuoteLine[] = input.lines.map((line, idx) => {
    const product = store.get<Product>('Product', line.productId);
    if (!product || !product.active) {
      throw ApiError.badRequest(`Product ${line.productId} not found or inactive`);
    }

    const pricing = resolvePricing({
      basePrice: Number(product.basePrice),
      costPrice: Number(product.costPrice),
      quantity: line.quantity,
      taxPercent: Number(product.taxPercent),
    });

    const discountAmount = Math.round(((pricing.subtotal * line.discountPercent) / 100) * 100) / 100;
    const lineTotal = Math.round((pricing.subtotal - discountAmount) * 100) / 100;

    return {
      id: `${quoteId}_line_${idx + 1}`,
      quoteId,
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: pricing.unitPrice,
      discountPercent: line.discountPercent,
      discountAmount,
      lineTotal,
      marginAmount:
        Math.round(
          (lineTotal - pricing.unitPrice * line.quantity * (Number(product.costPrice) / Number(product.basePrice))) *
            100
        ) / 100,
      billingType: line.billingType ?? 'ONE_TIME',
      subscriptionPlanId: line.subscriptionPlanId ?? null,
      createdAt: new Date().toISOString(),
    };
  });

  const subtotal = Math.round(lineData.reduce((s, l) => s + Number(l.unitPrice) * Number(l.quantity), 0) * 100) / 100;
  const discountAmount = Math.round(lineData.reduce((s, l) => s + Number(l.discountAmount), 0) * 100) / 100;
  const total = Math.round(lineData.reduce((s, l) => s + Number(l.lineTotal), 0) * 100) / 100;

  const quote: Quote = {
    id: quoteId,
    quoteNumber: generateQuoteNumber(),
    customerId: input.customerId,
    salesRepId: input.salesRepId,
    status: 'DRAFT',
    subtotal,
    discountAmount,
    total,
    marginAmount: null,
    marginPercent: null,
    riskScore: null,
    riskLevel: null,
    portalToken: `portal_tok_${quoteId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.insert('Quote', quote);
  for (const line of lineData) {
    store.insert('QuoteLine', line);
  }

  await writeAuditLog({
    entityType: 'QUOTE',
    entityId: quote.id,
    action: 'QUOTE_CREATED',
    actorId,
    after: { quoteNumber: quote.quoteNumber, status: 'DRAFT', total },
  });

  return getQuote(quoteId);
}

export async function updateQuote(quoteId: string, lines: QuoteLineInput[], actorId: string): Promise<any> {
  const store = getStore();

  const quote = store.get<Quote>('Quote', quoteId);
  if (!quote) throw ApiError.notFound('Quote not found');

  if (quote.status !== 'DRAFT' && quote.status !== 'NEGOTIATION') {
    throw ApiError.badRequest('Can only update quotes in DRAFT or NEGOTIATION status');
  }

  // Remove existing lines
  const existingLines = store.where<QuoteLine>('QuoteLine', l => l.quoteId === quoteId);
  for (const l of existingLines) {
    store.remove('QuoteLine', l.id);
  }

  // Build new lines
  const lineData: QuoteLine[] = lines.map((line, idx) => {
    const product = store.get<Product>('Product', line.productId);
    if (!product || !product.active) {
      throw ApiError.badRequest(`Product ${line.productId} not found or inactive`);
    }

    const pricing = resolvePricing({
      basePrice: Number(product.basePrice),
      costPrice: Number(product.costPrice),
      quantity: line.quantity,
      taxPercent: Number(product.taxPercent),
    });

    const discountAmount = Math.round(((pricing.subtotal * line.discountPercent) / 100) * 100) / 100;
    const lineTotal = Math.round((pricing.subtotal - discountAmount) * 100) / 100;

    return {
      id: `${quoteId}_line_${idx + 1}_${Date.now()}`,
      quoteId,
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: pricing.unitPrice,
      discountPercent: line.discountPercent,
      discountAmount,
      lineTotal,
      marginAmount:
        Math.round(
          (lineTotal - pricing.unitPrice * line.quantity * (Number(product.costPrice) / Number(product.basePrice))) *
            100
        ) / 100,
      billingType: line.billingType ?? 'ONE_TIME',
      subscriptionPlanId: line.subscriptionPlanId ?? null,
      createdAt: new Date().toISOString(),
    };
  });

  const subtotal = Math.round(lineData.reduce((s, l) => s + Number(l.unitPrice) * Number(l.quantity), 0) * 100) / 100;
  const discountAmount = Math.round(lineData.reduce((s, l) => s + Number(l.discountAmount), 0) * 100) / 100;
  const total = Math.round(lineData.reduce((s, l) => s + Number(l.lineTotal), 0) * 100) / 100;

  for (const line of lineData) {
    store.insert('QuoteLine', line);
  }

  store.update<Quote>('Quote', quoteId, {
    subtotal,
    discountAmount,
    total,
    updatedAt: new Date().toISOString(),
  });

  await writeAuditLog({
    entityType: 'QUOTE',
    entityId: quoteId,
    action: 'QUOTE_UPDATED',
    actorId,
    after: { status: quote.status, total },
  });

  return getQuote(quoteId);
}

export async function evaluateQuote(quoteId: string, actorId: string): Promise<EvaluateQuoteResult> {
  const store = getStore();

  const quote = store.get<Quote>('Quote', quoteId);
  if (!quote) throw ApiError.notFound('Quote not found');

  const customer = store.get<Customer>('Customer', quote.customerId);
  const tier = customer?.tierId ? store.get<CustomerTier>('CustomerTier', customer.tierId) : null;
  const lines = store.where<QuoteLine>('QuoteLine', l => l.quoteId === quoteId);

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
        (r.customerTierId && r.customerTierId === customer?.tierId) ||
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
        if (!tierCeilingMap.has(cid)) {
          tierCeilingMap.set(cid, Number(rule.maxDiscountPercent));
        }
      }
    } else if (!rule.customerTierId && rule.categoryId) {
      catCeilingMap.set(rule.categoryId, Number(rule.maxDiscountPercent));
    }
  }

  const DEFAULT_CEILING = tier?.defaultDiscountPercent ?? 100;

  let pricingSubtotal = 0;
  let pricingTaxTotal = 0;

  const discountInputLines: DiscountLineInput[] = [];
  const marginInputLines: MarginLineInput[] = [];
  const riskInputLines: RiskLineInput[] = [];

  for (const line of lines) {
    const product = productMap.get(line.productId);
    if (!product) continue;
    const categoryId = product.categoryId ?? '';

    const pricing = resolvePricing({
      basePrice: Number(product.basePrice),
      costPrice: Number(product.costPrice),
      quantity: Number(line.quantity),
      taxPercent: Number(product.taxPercent),
    });

    pricingSubtotal += pricing.subtotal;
    pricingTaxTotal += pricing.taxAmount;

    const discountPercent = Number(line.discountPercent);
    const lineRevenue = Math.round(pricing.subtotal * (1 - discountPercent / 100) * 100) / 100;

    discountInputLines.push({
      lineId: line.id,
      categoryId,
      requestedDiscountPercent: discountPercent,
      lineRevenue,
      tierCeilingPercent: tierCeilingMap.get(categoryId) ?? DEFAULT_CEILING,
      categoryMaxPercent: catCeilingMap.get(categoryId) ?? DEFAULT_CEILING,
    });

    marginInputLines.push({
      lineId: line.id,
      unitPrice: Number(product.basePrice),
      quantity: Number(line.quantity),
      discountPercent,
      costPrice: Number(product.costPrice),
    });
  }

  // Run Discount Engine
  const discountResult = runDiscountEngine({ lines: discountInputLines });

  // Build risk line inputs
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const product = productMap.get(line.productId);
    const discLine = discountResult.lineResults[i];
    riskInputLines.push({
      lineId: line.id,
      lineRevenue: discountInputLines[i].lineRevenue,
      overagePercent: discLine.overagePercent,
      productName: product?.name ?? 'Unknown',
      categoryName: product?.categoryId ?? 'Unknown',
    });
  }

  // Run Margin Engine
  const marginResult = runMarginEngine({ lines: marginInputLines });

  // Inventory check
  const inventoryData = store.where<Inventory>(
    'Inventory',
    inv => productMap.has(inv.productId)
  );

  const invByProduct = new Map<string, { total: number; warehouseCount: number }>();
  for (const inv of inventoryData) {
    const qty = Number(inv.quantityAvailable);
    if (qty <= 0) continue;
    const existing = invByProduct.get(inv.productId) ?? { total: 0, warehouseCount: 0 };
    invByProduct.set(inv.productId, {
      total: existing.total + qty,
      warehouseCount: existing.warehouseCount + 1,
    });
  }

  let maxWarehouseCount = 1;
  let allFulfillable = true;
  for (const line of lines) {
    const inv = invByProduct.get(line.productId);
    if (!inv || inv.total < Number(line.quantity)) {
      allFulfillable = false;
    }
    if (inv && inv.warehouseCount > maxWarehouseCount) {
      maxWarehouseCount = inv.warehouseCount;
    }
  }

  // Run Risk Engine
  const riskResult = runRiskEngine({
    lines: riskInputLines,
    quoteMarginPercent: marginResult.quoteMarginPercent,
    inventory: {
      warehouseCount: maxWarehouseCount,
      fullyFulfillable: allFulfillable,
    },
  });

  // Run Approval Engine
  const approvalResult = runApprovalEngine({
    riskLevel: riskResult.level,
    lineOverages: discountResult.lineResults.map((r, i) => ({
      lineId: r.lineId,
      overagePercent: r.overagePercent,
      productName: productMap.get(lines[i].productId)?.name ?? 'Unknown',
    })),
  });

  const pricingSubtotalRounded = Math.round(pricingSubtotal * 100) / 100;
  const discountAmount = Math.round(lines.reduce((s, l) => s + Number(l.discountAmount), 0) * 100) / 100;
  const total = Math.round((pricingSubtotalRounded - discountAmount) * 100) / 100;

  // Persist evaluation back to quote
  store.update<Quote>('Quote', quoteId, {
    subtotal: pricingSubtotalRounded,
    discountAmount,
    total,
    marginAmount: marginResult.quoteMarginAmount,
    marginPercent: marginResult.quoteMarginPercent,
    riskScore: Math.round(riskResult.score),
    riskLevel: riskResult.level as any,
    updatedAt: new Date().toISOString(),
  });

  await writeAuditLog({
    entityType: 'QUOTE',
    entityId: quoteId,
    action: 'QUOTE_EVALUATED',
    actorId,
    after: {
      riskScore: riskResult.score,
      riskLevel: riskResult.level,
      marginPercent: marginResult.quoteMarginPercent,
      approvalRequired: approvalResult.approvalRequired,
    },
  });

  return {
    quoteId,
    pricing: {
      subtotal: pricingSubtotalRounded,
      discountAmount,
      total,
      taxTotal: Math.round(pricingTaxTotal * 100) / 100,
    },
    discount: {
      hasAnyOverage: discountResult.hasAnyOverage,
      lineResults: discountResult.lineResults,
    },
    margin: {
      quoteMarginAmount: marginResult.quoteMarginAmount,
      quoteTotalRevenue: marginResult.quoteTotalRevenue,
      quoteMarginPercent: marginResult.quoteMarginPercent,
    },
    risk: riskResult,
    approval: approvalResult,
  };
}

export async function submitQuote(quoteId: string, actorId: string) {
  const store = getStore();
  const quote = store.get<Quote>('Quote', quoteId);
  if (!quote) throw ApiError.notFound('Quote not found');

  if (quote.status !== 'DRAFT' && quote.status !== 'NEGOTIATION') {
    throw ApiError.badRequest(`Cannot submit quote in ${quote.status} status`);
  }

  const evalResult = await evaluateQuote(quoteId, actorId);

  const newStatus = evalResult.approval.approvalRequired ? 'PENDING_APPROVAL' : 'APPROVED';

  store.update<Quote>('Quote', quoteId, { status: newStatus });

  // Create approval requests if needed
  if (evalResult.approval.approvalRequired) {
    // Delete any old pending approval requests
    const oldRequests = store.where<ApprovalRequest>('ApprovalRequest', r => r.quoteId === quoteId);
    for (const r of oldRequests) {
      store.remove('ApprovalRequest', r.id);
    }

    evalResult.approval.requiredRoles.forEach((role, idx) => {
      const req: ApprovalRequest = {
        id: `app_${quoteId}_step_${idx + 1}`,
        quoteId,
        step: idx + 1,
        role,
        status: idx === 0 ? 'PENDING' : 'WAITING',
        createdAt: new Date().toISOString(),
      };
      store.insert('ApprovalRequest', req);
    });
  }

  await writeAuditLog({
    entityType: 'QUOTE',
    entityId: quoteId,
    action: 'QUOTE_SUBMITTED',
    actorId,
    after: {
      status: newStatus,
      approvalRequired: evalResult.approval.approvalRequired,
      requiredRoles: evalResult.approval.requiredRoles,
    },
  });

  return { ...evalResult, newStatus };
}

export async function confirmQuote(quoteId: string, actorId: string) {
  const store = getStore();
  const quote = store.get<Quote>('Quote', quoteId);
  if (!quote) throw ApiError.notFound('Quote not found');

  if (quote.status !== 'APPROVED') {
    throw ApiError.badRequest('Only APPROVED quotes can be confirmed.');
  }

  const existingOrders = new Set(store.all<Order>('Order').map(o => o.id));
  const orderId = allocatePoolId('order', existingOrders);

  const order: Order = {
    id: orderId,
    quoteId: quote.id,
    orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}`,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.update<Quote>('Quote', quote.id, { status: 'CONFIRMED' });
  store.insert('Order', order);

  await writeAuditLog({
    entityType: 'QUOTE',
    entityId: quote.id,
    action: 'QUOTE_CONFIRMED_INTERNAL',
    actorId,
    after: { status: 'CONFIRMED', orderId: order.id },
  });

  // Auto-trigger fulfillment allocation for each product line
  const lines = store.where<QuoteLine>('QuoteLine', l => l.quoteId === quoteId);
  for (const line of lines) {
    try {
      await allocateOrder(order.id, line.productId, Number(line.quantity), actorId);
    } catch (err) {
      console.error(`Failed to allocate line ${line.id}:`, err);
    }
  }

  // Auto-trigger billing
  try {
    await createOrderBilling(order.id, actorId);
  } catch (err) {
    console.error(`Failed to create billing for order ${order.id}:`, err);
  }

  return store.get<Quote>('Quote', quoteId);
}

export async function deleteQuote(quoteId: string, actorId: string): Promise<boolean> {
  const store = getStore();
  const quote = store.get<Quote>('Quote', quoteId);
  if (!quote) throw ApiError.notFound('Quote not found');

  if (quote.status !== 'DRAFT' && quote.status !== 'CANCELLED') {
    throw ApiError.badRequest(`Cannot delete quote in ${quote.status} status`);
  }

  store.remove('Quote', quoteId);

  await writeAuditLog({
    entityType: 'QUOTE',
    entityId: quoteId,
    action: 'QUOTE_DELETED',
    actorId,
    before: { quoteNumber: quote.quoteNumber, status: quote.status },
  });

  return true;
}

export async function getQuote(quoteId: string): Promise<any> {
  const store = getStore();
  const quote = store.get<Quote>('Quote', quoteId);
  if (!quote) throw ApiError.notFound(`Quote ${quoteId} not found`);

  const customer = store.get<Customer>('Customer', quote.customerId);
  const tier = customer?.tierId ? store.get<CustomerTier>('CustomerTier', customer.tierId) : null;
  const salesRep = store.get<User>('User', quote.salesRepId);

  const lines = store.where<QuoteLine>('QuoteLine', l => l.quoteId === quoteId);
  const hydratedLines = lines.map(line => {
    const product = store.get<Product>('Product', line.productId);
    const category = product?.categoryId ? store.get('ProductCategory', product.categoryId) : null;
    const plan = line.subscriptionPlanId ? store.get('SubscriptionPlan', line.subscriptionPlanId) : null;
    return {
      ...line,
      product: product ? { ...product, category } : null,
      subscriptionPlan: plan,
    };
  });

  const approvalRequests = store
    .where<ApprovalRequest>('ApprovalRequest', r => r.quoteId === quoteId)
    .sort((a, b) => a.step - b.step)
    .map(r => {
      const reviewer = r.reviewerId ? store.get<User>('User', r.reviewerId) : null;
      const actions = store
        .where('ApprovalAction', (a: any) => a.approvalRequestId === r.id)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return {
        ...r,
        reviewer: reviewer ? { id: reviewer.id, name: reviewer.name, role: reviewer.role } : null,
        actions,
      };
    });

  const negotiations = store
    .where('Negotiation', (n: any) => n.quoteId === quoteId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((n: any) => {
      const messages = store
        .where('NegotiationMessage', (m: any) => m.negotiationId === n.id)
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return { ...n, messages };
    });

  return {
    ...quote,
    customer: customer ? { ...customer, tier } : null,
    salesRep: salesRep ? { id: salesRep.id, name: salesRep.name, role: salesRep.role, email: salesRep.email } : null,
    quoteLines: hydratedLines,
    approvalRequests,
    negotiations,
  };
}

export async function listQuotes(filters: {
  salesRepId?: string;
  customerId?: string;
  status?: string | string[];
  search?: string;
  page?: number;
  limit?: number;
}) {
  const store = getStore();
  const { salesRepId, customerId, status, search, page = 1, limit = 20 } = filters;

  const statusList = status
    ? Array.isArray(status)
      ? status
      : status.includes(',')
      ? status.split(',')
      : [status]
    : undefined;

  let quotes = store.all<Quote>('Quote');

  if (salesRepId) {
    quotes = quotes.filter(q => q.salesRepId === salesRepId);
  }
  if (customerId) {
    quotes = quotes.filter(q => q.customerId === customerId);
  }
  if (statusList && statusList.length > 0) {
    quotes = quotes.filter(q => statusList.includes(q.status));
  }
  if (search) {
    const qLower = search.toLowerCase();
    quotes = quotes.filter(q => {
      const customer = store.get<Customer>('Customer', q.customerId);
      return (
        q.quoteNumber.toLowerCase().includes(qLower) ||
        (customer && customer.companyName.toLowerCase().includes(qLower))
      );
    });
  }

  // Sort by createdAt descending
  quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = quotes.length;
  const paginated = quotes.slice((page - 1) * limit, page * limit);

  const hydrated = paginated.map(q => {
    const customer = store.get<Customer>('Customer', q.customerId);
    const tier = customer?.tierId ? store.get<CustomerTier>('CustomerTier', customer.tierId) : null;
    const salesRep = store.get<User>('User', q.salesRepId);
    const lineCount = store.count('QuoteLine', (l: any) => l.quoteId === q.id);
    const approvalCount = store.count('ApprovalRequest', (a: any) => a.quoteId === q.id);

    return {
      ...q,
      customer: customer ? { id: customer.id, companyName: customer.companyName, tier: tier ? { name: tier.name } : null } : null,
      salesRep: salesRep ? { id: salesRep.id, name: salesRep.name } : null,
      _count: {
        quoteLines: lineCount,
        approvalRequests: approvalCount,
      },
    };
  });

  return { quotes: hydrated, total, page, limit };
}

