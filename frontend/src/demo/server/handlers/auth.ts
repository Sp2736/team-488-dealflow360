// src/demo/server/handlers/auth.ts
/**
 * Auth mock handlers: /api/auth/login, /api/auth/register, /api/auth/logout, /api/auth/me
 */

import { router, jsonResponse, type DemoRequestContext } from '../router';
import { getStore } from '@/demo/db/store';
import { setSession, clearSession, getSessionOrNull } from '../session';
import { DEMO_USERS, type User, type UserRole } from '@/lib/types';
import { ApiError } from '../errors';

export function registerAuthHandlers() {
  router.post('/api/auth/login', async (ctx: DemoRequestContext) => {
    const body = ctx.body || {};
    const store = getStore();

    // Support both persona login payload { persona: 'ADMIN' } or { role: 'ADMIN' } and { email, password }
    const roleKey = (body.persona || body.role) as UserRole | undefined;

    let targetUser: User | null = null;

    if (roleKey && DEMO_USERS[roleKey]) {
      // Find matching user in store or fallback to DEMO_USERS
      const storeUsers = store.where<User>('User', u => u.role === roleKey && u.active);
      targetUser = storeUsers[0] || (DEMO_USERS[roleKey] as unknown as User);
    } else if (body.email) {
      const email = String(body.email).toLowerCase();
      const storeUsers = store.where<User>('User', u => u.email.toLowerCase() === email && u.active);
      targetUser = storeUsers[0] || null;

      if (!targetUser) {
        // Check DEMO_USERS by email
        const demoUser = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email);
        if (demoUser) {
          targetUser = demoUser as unknown as User;
        }
      }
    }

    if (!targetUser) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const session = setSession(targetUser);

    return jsonResponse({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
      token: session.token,
      message: 'Logged in successfully',
    });
  });

  router.post('/api/auth/register', () => {
    return jsonResponse(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Registration is disabled in the demo, pick a persona on the login screen',
        },
      },
      403
    );
  });

  router.post('/api/auth/logout', () => {
    clearSession();
    return jsonResponse({
      success: true,
      message: 'Logged out successfully',
    });
  });

  router.get('/api/auth/me', () => {
    const session = getSessionOrNull();
    if (!session || !session.user) {
      return jsonResponse(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
          user: null,
          data: null,
        },
        401
      );
    }

    const user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      active: session.user.active,
      createdAt: session.user.createdAt,
    };

    return jsonResponse({
      success: true,
      data: { user },
      user,
    });
  });
}

