// src/demo/server/session.ts
/**
 * Mock session management for the browser-side simulated backend.
 * Stored in sessionStorage['df360.demo.session'].
 * Visibly fake unsigned JWT format; never imports jose.
 */

import { DEMO_USERS, type User, type UserRole } from '@/lib/types';
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/rbac.shared';

export interface DemoSessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface DemoSession {
  token: string;
  user: DemoSessionUser;
  issuedAt: number;
  expiresAt: number;
}

const SESSION_KEY = 'df360.demo.session';

function base64UrlEncode(str: string): string {
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  return Buffer.from(str, 'utf8').toString('base64url');
}

/**
 * Creates a visibly fake JWT-shaped string without cryptographic signing.
 */
export function createFakeJwt(user: DemoSessionUser): string {
  const header = JSON.stringify({ alg: 'none', typ: 'JWT', demo: true });
  const payload = JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  });

  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.demo-signature-not-verified`;
}

/**
 * Retrieves the current mock session from sessionStorage or null if absent/invalid.
 */
export function getSessionOrNull(): DemoSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: DemoSession = JSON.parse(raw);
    if (!session || !session.user || !session.token) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    // Check expiry
    if (session.expiresAt && Date.now() > session.expiresAt) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/**
 * Enforces authentication; throws UnauthorizedError (401) if not logged in.
 */
export function requireAuth(): DemoSession {
  const session = getSessionOrNull();
  if (!session) {
    throw new UnauthorizedError('Not authenticated');
  }
  return session;
}

/**
 * Enforces role authorization; throws UnauthorizedError (401) or ForbiddenError (403).
 */
export function requireRole(allowedRoles: UserRole[]): DemoSession {
  const session = requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError(`Forbidden: role ${session.user.role} is not permitted for this action`);
  }
  return session;
}

/**
 * Sets a new mock session for the given user.
 */
export function setSession(user: User | DemoSessionUser): DemoSession {
  const sessionUser: DemoSessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    active: user.active,
    createdAt: user.createdAt,
  };

  const now = Date.now();
  const session: DemoSession = {
    token: createFakeJwt(sessionUser),
    user: sessionUser,
    issuedAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000,
  };

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

/**
 * Clears the mock session.
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Switches current persona by role using DEMO_USERS.
 */
export function switchPersona(role: UserRole): DemoSession {
  const user = DEMO_USERS[role];
  if (!user) {
    throw new Error(`Unknown demo user role: ${role}`);
  }
  return setSession(user);
}

