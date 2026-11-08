'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PortalMessagesPage() {
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch('/api/portal/messages');
        if (res.ok) {
          const data = await res.json();
          setNegotiations(data.negotiations || data.data || []);
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, []);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Message Inbox</h1>
        <p className="support-text">All active conversations across your quotations</p>
      </div>

      {loading ? (
        <div className="card text-center" style={{ padding: 40 }}>
          <p>Loading messages...</p>
        </div>
      ) : negotiations.length === 0 ? (
        <div className="card text-center" style={{ padding: 40 }}>
          <h3 style={{ color: 'var(--fg-muted)' }}>No messages yet</h3>
          <p>You don&apos;t have any active negotiations or messages.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {negotiations.map((neg: any) => (
            <div key={neg.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, margin: 0 }}>
                    Quote #{neg.quote?.quoteNumber || neg.quoteId}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '4px 0 0 0' }}>
                    Status: <span style={{ fontWeight: 600 }}>{neg.status}</span>
                  </p>
                </div>
                <Link href={`/portal/quotation?id=${neg.quote?.id || neg.quoteId}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }}>
                  View Quote Thread
                </Link>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                <h4 style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '0 0 8px 0' }}>Recent Messages:</h4>
                {(!neg.messages || neg.messages.length === 0) ? (
                  <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>No messages in this thread yet.</p>
                ) : (
                  <div className="space-y-3">
                    {neg.messages.slice(0, 3).map((msg: any) => (
                      <div key={msg.id} style={{
                        background: msg.authorRole === 'CUSTOMER' ? 'var(--surface-sunken)' : 'var(--primary-light, #e0f2fe)',
                        padding: '10px 14px',
                        borderRadius: 8,
                        fontSize: 13
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: msg.authorRole === 'CUSTOMER' ? 'var(--fg)' : 'var(--primary-dark, #0369a1)' }}>
                            {msg.authorRole === 'CUSTOMER' ? 'You' : 'Sales Rep'}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <div>{msg.message}</div>
                      </div>
                    ))}
                    {neg.messages.length > 3 && (
                      <p style={{ fontSize: 12, color: 'var(--fg-muted)', fontStyle: 'italic' }}>
                        + {neg.messages.length - 3} older messages
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
