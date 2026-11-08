'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

import { useToast } from '@/components/Toast';

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitePreview, setInvitePreview] = useState<{
    inviteUrl: string;
    token: string;
    emailPreview: { to: string; subject: string; html: string };
  } | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success && data.data) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendInvite = async (customerId: string) => {
    setSubmitting(true);
    setInvitePreview(null);
    try {
      const res = await fetch(`/api/customers/${customerId}/invite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInvitePreview({
          inviteUrl: data.inviteUrl,
          token: data.token,
          emailPreview: data.emailPreview || {
            to: 'customer@example.com',
            subject: 'Welcome to DealFlow360 Customer Portal',
            html: `<p>You have been invited to DealFlow360. Link: <a href="${data.inviteUrl}">${data.inviteUrl}</a></p>`,
          },
        });
      } else {
        toast.error(data.error || 'Failed to generate invite');
      }
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (invitePreview?.inviteUrl) {
      navigator.clipboard.writeText(invitePreview.inviteUrl);
      toast.success('Onboarding link copied to clipboard!');
    }
  };

  const renderTable = () => {
    return (
      <div className="table-wrap bg-[var(--surface)] border-[var(--border)]">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Contact Name</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Portal Access</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && customers.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: 20}}>Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: 20}}>No customers found.</td></tr>
            ) : (
              customers.map(row => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 700 }}>{row.companyName}</td>
                  <td style={{ color: 'var(--fg-muted)' }}>{row.contactName || '-'}</td>
                  <td>
                    <span className="badge badge-neutral">{row.tier?.name || 'Standard'}</span>
                  </td>
                  <td>
                    <span className={`badge ${row.active ? 'badge-success' : 'badge-neutral'}`}>
                      {row.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {row.portalUserId ? (
                      <span className="badge badge-success">Linked</span>
                    ) : (
                      <span className="badge badge-warning">Not Linked</span>
                    )}
                  </td>
                  <td className="text-right">
                    {!row.portalUserId && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: 12 }} 
                        onClick={() => handleSendInvite(row.id)}
                        disabled={submitting || !row.email}
                      >
                        {row.email ? 'Send Invite' : 'No Email'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="support-text">Manage customer accounts and portal access.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {renderTable()}
      </div>

      {invitePreview && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 9999, padding: '16px',
        }}>
          <div className="card card-shadow-lg" style={{ width: 560, maxWidth: '100%', background: '#ffffff', border: '3px solid #000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>✉️</span>
                <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
                  Invite Email Preview (Simulated)
                </h3>
              </div>
              <span className="badge badge-warning" style={{ fontSize: 10 }}>Demo No-Send</span>
            </div>

            <p style={{ color: 'var(--fg-muted)', fontSize: 12, marginBottom: 12 }}>
              In production, an email is dispatched via SMTP/SendGrid. In this browser-side demo, we render the exact email template and onboarding token below:
            </p>

            {/* Email Meta */}
            <div style={{ background: '#f8fafc', border: '2px solid #000', padding: '10px 14px', marginBottom: 14, fontSize: 12 }}>
              <div style={{ marginBottom: 4 }}><strong>To:</strong> {invitePreview.emailPreview.to}</div>
              <div style={{ marginBottom: 4 }}><strong>Subject:</strong> {invitePreview.emailPreview.subject}</div>
              <div><strong>Token:</strong> <code>{invitePreview.token}</code></div>
            </div>

            {/* Rendered HTML Preview */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '14px',
                marginBottom: 16,
                fontSize: 13,
                maxHeight: '160px',
                overflowY: 'auto',
              }}
              dangerouslySetInnerHTML={{ __html: invitePreview.emailPreview.html }}
            />

            {/* Onboarding Link Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                Direct Onboarding Link (Pool Token):
              </label>
              <input 
                className="input" 
                type="text" 
                value={invitePreview.inviteUrl} 
                readOnly 
                style={{ width: '100%', fontSize: 12, fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setInvitePreview(null)}>Close</button>
              <button className="btn btn-primary" onClick={copyToClipboard}>📋 Copy Onboarding Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
