// src/demo/server/handlers/approvals.ts
/**
 * Approvals mock handlers:
 * GET /api/approvals, GET/POST /api/approvals/:id
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { requireRole } from '../session';
import {
  listPendingApprovals,
  getApprovalRequest,
  actionApprovalRequest,
  type ApprovalActionType,
} from '../services/approval.service';
import { ApiError } from '../errors';

export function registerApprovalsHandlers() {
  // GET /api/approvals
  router.get('/api/approvals', async () => {
    const session = requireRole(['ADMIN', 'SALES_MANAGER', 'FINANCE']);

    const approvals = await listPendingApprovals(session.user.role, session.user.id);

    return jsonResponse({
      success: true,
      data: {
        pendingApprovalsCount: approvals.length,
        approvals,
      },
    });
  });

  // GET /api/approvals/:id
  router.get('/api/approvals/:id', async (ctx: DemoRequestContext) => {
    requireRole(['ADMIN', 'SALES_MANAGER', 'FINANCE']);
    const { id } = ctx.params;

    const approval = await getApprovalRequest(id);
    return jsonResponse(approval);
  });

  // POST /api/approvals/:id
  router.post('/api/approvals/:id', async (ctx: DemoRequestContext) => {
    const session = requireRole(['ADMIN', 'SALES_MANAGER', 'FINANCE']);
    const { id } = ctx.params;
    const body = ctx.body || {};
    const { action, reason } = body;

    if (!['APPROVE', 'REJECT', 'REQUEST_REVISION'].includes(action)) {
      throw ApiError.badRequest('Invalid action');
    }

    const result = await actionApprovalRequest(
      id,
      session.user.id,
      action as ApprovalActionType,
      reason
    );

    return jsonResponse(result);
  });
}

