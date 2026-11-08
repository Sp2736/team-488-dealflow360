// src/demo/ui/NotificationDropdown.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getStore } from '../db/store';
import { useDemoSession } from './useDemoSession';
import type { Alert, Notification } from '../db/schema';

export function NotificationDropdown() {
  const { user } = useDemoSession();
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const store = getStore();

    // Fetch active unacknowledged alerts
    const activeAlerts = store.where<Alert>('Alert', a => !a.acknowledged);
    setAlerts(activeAlerts.slice(0, 5));

    // Fetch notifications for user
    const userNotifs = store.where<Notification>(
      'Notification',
      n => n.recipientId === user.id || n.recipientId === null
    );
    setNotifications(userNotifs.slice(0, 5));
  }, [user, isOpen]);

  if (!user) return null;

  const totalUnread = alerts.length + notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          background: '#1e293b',
          color: '#ffffff',
          border: '2px solid #000000',
          padding: '4px 8px',
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          position: 'relative',
        }}
        title="View Notifications & System Alerts"
      >
        <span>🔔</span>
        {totalUnread > 0 && (
          <span
            style={{
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 900,
              padding: '1px 5px',
              borderRadius: '999px',
            }}
          >
            {totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '36px',
            right: 0,
            width: '340px',
            background: '#ffffff',
            border: '3px solid #000000',
            boxShadow: '6px 6px 0px 0px #000000',
            zIndex: 100,
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
            <span style={{ fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}>
              Alerts & Notifications
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', fontWeight: 900, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Active Alerts */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#b91c1c', marginBottom: '6px' }}>
              System Alerts ({alerts.length})
            </div>
            {alerts.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>No active alerts.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {alerts.map(a => (
                  <div
                    key={a.id}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #f87171',
                      padding: '6px 8px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 800, color: '#991b1b' }}>{a.type}</span>
                      <span style={{ fontWeight: 900, color: a.severity === 'HIGH' ? '#dc2626' : '#d97706' }}>
                        {a.severity}
                      </span>
                    </div>
                    <div style={{ color: '#374151', lineHeight: 1.3 }}>{a.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#1e40af', marginBottom: '6px' }}>
              Inbox ({notifications.length})
            </div>
            {notifications.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>No notifications.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      padding: '6px 8px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>{n.type}</div>
                    <div style={{ color: '#4b5563', lineHeight: 1.3 }}>{n.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

