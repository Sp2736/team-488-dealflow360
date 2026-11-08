// src/demo/ui/useDemoSession.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSessionOrNull, setSession, clearSession, type DemoSession } from '../server/session';
import { getStore } from '../db/store';
import type { User, UserRole } from '@/lib/types';

export function useDemoSession() {
  const [session, setSessionState] = useState<DemoSession | null>(() => {
    if (typeof window === 'undefined') return null;
    return getSessionOrNull();
  });

  const refreshSession = useCallback(() => {
    const s = getSessionOrNull();
    setSessionState(s);
  }, []);

  useEffect(() => {
    refreshSession();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'df360.demo.session') {
        refreshSession();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('df360:session-changed', refreshSession);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('df360:session-changed', refreshSession);
    };
  }, [refreshSession]);

  const switchPersona = useCallback((role: UserRole) => {
    const store = getStore();
    const users = store.where<User>('User', u => u.role === role && u.active);
    const targetUser = users[0];
    if (targetUser) {
      const newSession = setSession(targetUser);
      setSessionState(newSession);
      window.dispatchEvent(new CustomEvent('df360:session-changed'));
      return newSession;
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
    window.dispatchEvent(new CustomEvent('df360:session-changed'));
  }, []);

  return {
    session,
    user: session?.user || null,
    role: session?.user?.role || null,
    isAuthenticated: !!session,
    switchPersona,
    logout,
    refreshSession,
  };
}

