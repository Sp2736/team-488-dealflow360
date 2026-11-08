// src/demo/server/handlers/users.ts
/**
 * Users mock handler: GET /api/users
 */

import { router, jsonResponse } from '../router';
import { getStore } from '@/demo/db/store';
import { requireRole } from '../session';
import type { User } from '@/demo/db/schema';

export function registerUsersHandlers() {
  router.get('/api/users', () => {
    requireRole(['ADMIN', 'SALES_MANAGER', 'FINANCE', 'SALES_REP']);
    const store = getStore();

    const users = store
      .where<User>('User', u => u.active && ['SALES_REP', 'SALES_MANAGER'].includes(u.role))
      .map(u => ({ id: u.id, name: u.name, role: u.role }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return jsonResponse({ success: true, data: users });
  });
}

