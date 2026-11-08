// src/demo/server/handlers/onboard.ts
/**
 * Customer Onboarding mock handlers:
 * GET /api/onboard/:token, POST /api/onboard/:token
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { getStore } from '@/demo/db/store';
import { setSession } from '../session';
import { writeAuditLog } from '../services/audit.service';
import { ApiError } from '../errors';
import type { CustomerInvite, Customer, User } from '@/demo/db/schema';

export function registerOnboardHandlers() {
  // GET /api/onboard/:token
  router.get('/api/onboard/:token', (ctx: DemoRequestContext) => {
    const store = getStore();
    const { token } = ctx.params;

    const invites = store.where<CustomerInvite>('CustomerInvite', i => i.token === token);
    const invite = invites[0];

    if (!invite) {
      throw ApiError.notFound('Invalid invite link');
    }

    if (invite.status !== 'PENDING') {
      throw ApiError.badRequest(`Invite is ${invite.status.toLowerCase()}`);
    }

    if (new Date() > new Date(invite.expiresAt)) {
      store.update<CustomerInvite>('CustomerInvite', invite.id, { status: 'EXPIRED' });
      throw ApiError.badRequest('Invite has expired');
    }

    const customer = store.get<Customer>('Customer', invite.customerId);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    return jsonResponse({
      success: true,
      data: {
        email: invite.email,
        companyName: customer.companyName,
        contactName: customer.contactName,
      },
    });
  });

  // POST /api/onboard/:token
  router.post('/api/onboard/:token', (ctx: DemoRequestContext) => {
    const store = getStore();
    const { token } = ctx.params;
    const body = ctx.body || {};

    const invites = store.where<CustomerInvite>('CustomerInvite', i => i.token === token);
    const invite = invites[0];

    if (!invite || invite.status !== 'PENDING' || new Date() > new Date(invite.expiresAt)) {
      throw ApiError.badRequest('Invalid or expired invite');
    }

    const { name, password } = body;
    if (!name || !password || password.length < 6) {
      throw ApiError.badRequest('Name and password (min 6 chars) are required');
    }

    // Check existing email
    const existingUser = store.where<User>('User', u => u.email.toLowerCase() === invite.email.toLowerCase())[0];
    if (existingUser) {
      throw ApiError.conflict('A user with this email already exists');
    }

    // Create User, update Customer, update Invite
    const user: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: invite.email,
      name,
      role: 'CUSTOMER',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.insert('User', user);
    store.update<Customer>('Customer', invite.customerId, { portalUserId: user.id });
    store.update<CustomerInvite>('CustomerInvite', invite.id, {
      status: 'ACCEPTED',
      acceptedAt: new Date().toISOString(),
    });

    writeAuditLog({
      entityType: 'CUSTOMER_ONBOARDING',
      entityId: invite.customerId,
      action: 'CUSTOMER_REGISTERED',
      actorId: user.id,
      after: { email: user.email, name: user.name },
    });

    // Auto-login new user
    setSession(user);

    return jsonResponse({ success: true, message: 'Onboarding complete', user });
  });
}

