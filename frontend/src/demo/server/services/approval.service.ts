// src/demo/server/services/approval.service.ts
/**
 * Approval Service — browser-side port over store.ts
 * Manages approval requests and sequential action steps with audit logging.
 */

import { getStore } from '@/demo/db/store';
import { writeAuditLog } from './audit.service';
import { ApiError } from '../errors';
import type {
  ApprovalRequest,
  ApprovalAction,
  Quote,
  Customer,
  User,
  QuoteLine,
  Product,
} from '@/demo/db/schema';

export type ApprovalActionType = 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';

export async function listPendingApprovals(reviewerRole: string, _reviewerId: string, status?: string) {
  const store = getStore();

  let requests = store.all<ApprovalRequest>('ApprovalRequest');

  if (reviewerRole !== 'ADMIN') {
    requests = requests.filter(r => r.role === reviewerRole);
  }
  if (status) {
    requests = requests.filter(r => r.status === status);
  }

  // Sort by createdAt desc
  requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return requests.map(req => {
    const quote = store.get<Quote>('Quote', req.quoteId);
    const customer = quote ? store.get<Customer>('Customer', quote.customerId) : null;
    const salesRep = quote ? store.get<User>('User', quote.salesRepId) : null;
    const lines = quote ? store.where<QuoteLine>('QuoteLine', l => l.quoteId === quote.id) : [];

    const hydratedLines = lines.map(line => {
      const prod = store.get<Product>('Product', line.productId);
      return {
        ...line,
        product: prod ? { id: prod.id, name: prod.name } : null,
      };
    });

    const reviewer = req.reviewerId ? store.get<User>('User', req.reviewerId) : null;
    const actions = store
      .where<ApprovalAction>('ApprovalAction', a => a.approvalRequestId === req.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      ...req,
      quote: quote
        ? {
            ...quote,
            customer: customer ? { id: customer.id, companyName: customer.companyName } : null,
            salesRep: salesRep ? { id: salesRep.id, name: salesRep.name } : null,
            quoteLines: hydratedLines,
          }
        : null,
      reviewer: reviewer ? { id: reviewer.id, name: reviewer.name, role: reviewer.role } : null,
      actions: actions.slice(0, 1),
    };
  });
}

export async function getApprovalRequest(approvalRequestId: string) {
  const store = getStore();
  const req = store.get<ApprovalRequest>('ApprovalRequest', approvalRequestId);
  if (!req) throw ApiError.notFound('Approval request not found');

  const quote = store.get<Quote>('Quote', req.quoteId);
  if (!quote) throw ApiError.notFound('Associated quote not found');

  const customer = store.get<Customer>('Customer', quote.customerId);
  const salesRep = store.get<User>('User', quote.salesRepId);
  const lines = store.where<QuoteLine>('QuoteLine', l => l.quoteId === quote.id);
  const allRequests = store
    .where<ApprovalRequest>('ApprovalRequest', r => r.quoteId === quote.id)
    .sort((a, b) => a.step - b.step);

  const reviewer = req.reviewerId ? store.get<User>('User', req.reviewerId) : null;
  const actions = store
    .where<ApprovalAction>('ApprovalAction', a => a.approvalRequestId === req.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    ...req,
    quote: {
      ...quote,
      customer,
      salesRep: salesRep ? { id: salesRep.id, name: salesRep.name } : null,
      quoteLines: lines.map(l => {
        const product = store.get<Product>('Product', l.productId);
        const category = product?.categoryId ? store.get('ProductCategory', product.categoryId) : null;
        return {
          ...l,
          product: product ? { ...product, category } : null,
        };
      }),
      approvalRequests: allRequests,
    },
    reviewer: reviewer ? { id: reviewer.id, name: reviewer.name, role: reviewer.role } : null,
    actions,
  };
}

export async function actionApprovalRequest(
  approvalRequestId: string,
  actorId: string,
  action: ApprovalActionType,
  reason?: string
) {
  const store = getStore();
  const approvalRequest = store.get<ApprovalRequest>('ApprovalRequest', approvalRequestId);
  if (!approvalRequest) throw ApiError.notFound('Approval request not found');

  if (approvalRequest.status !== 'PENDING') {
    throw ApiError.badRequest(`Approval request is already ${approvalRequest.status}`);
  }

  const quote = store.get<Quote>('Quote', approvalRequest.quoteId);
  if (!quote) throw ApiError.notFound('Associated quote not found');

  const newStatus =
    action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'REVISION_REQUESTED';

  const before = { status: approvalRequest.status };

  // Update approval request
  store.update<ApprovalRequest>('ApprovalRequest', approvalRequestId, {
    status: newStatus,
    reviewerId: actorId,
    reason: reason ?? null,
    actedAt: new Date().toISOString(),
  });

  // Create action record
  const actionRecord: ApprovalAction = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    approvalRequestId,
    actorId,
    action: newStatus,
    reason: reason ?? null,
    createdAt: new Date().toISOString(),
  };
  store.insert('ApprovalAction', actionRecord);

  let newQuoteStatus = quote.status;

  if (action === 'REJECT') {
    newQuoteStatus = 'REJECTED';
    store.update<Quote>('Quote', quote.id, { status: 'REJECTED' });
  } else if (action === 'APPROVE') {
    const allRequests = store.where<ApprovalRequest>(
      'ApprovalRequest',
      r => r.quoteId === quote.id
    );
    const nextStep = allRequests.find(
      r => r.step === approvalRequest.step + 1 && r.status === 'WAITING'
    );

    if (nextStep) {
      store.update<ApprovalRequest>('ApprovalRequest', nextStep.id, { status: 'PENDING' });
      newQuoteStatus = 'PENDING_APPROVAL';
    } else {
      newQuoteStatus = 'APPROVED';
      store.update<Quote>('Quote', quote.id, { status: 'APPROVED' });
    }
  } else if (action === 'REQUEST_REVISION') {
    newQuoteStatus = 'DRAFT';
    store.update<Quote>('Quote', quote.id, { status: 'DRAFT' });
  }

  await writeAuditLog({
    entityType: 'APPROVAL_REQUEST',
    entityId: approvalRequestId,
    action: `APPROVAL_${newStatus}`,
    actorId,
    before,
    after: { status: newStatus, quoteStatus: newQuoteStatus },
    reason,
  });

  return { approvalRequestId, newStatus, newQuoteStatus };
}

