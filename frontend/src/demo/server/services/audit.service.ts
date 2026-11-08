// src/demo/server/services/audit.service.ts
/**
 * Audit Service — browser-side port over store.ts
 */

import { getStore } from '@/demo/db/store';
import type { AuditLog, User } from '@/demo/db/schema';

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  before?: any;
  after?: any;
  reason?: string | null;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<AuditLog> {
  const store = getStore();
  const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const log: AuditLog = {
    id,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    actorId: entry.actorId ?? null,
    beforeData: entry.before ? JSON.stringify(entry.before) : null,
    afterData: entry.after ? JSON.stringify(entry.after) : null,
    reason: entry.reason ?? null,
    createdAt: new Date().toISOString(),
  };

  return store.insert('AuditLog', log);
}

export async function getAuditLogs(entityType: string, entityId: string) {
  const store = getStore();
  const logs = store.where<AuditLog>(
    'AuditLog',
    l => l.entityType === entityType && l.entityId === entityId
  );

  // Sort newest first
  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Attach actor details
  return logs.map(log => {
    const actor = log.actorId ? store.get<User>('User', log.actorId) : null;
    return {
      ...log,
      actor: actor ? { id: actor.id, name: actor.name, role: actor.role } : null,
    };
  });
}
