// src/demo/ui/TraceDrawer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  getTraces,
  subscribeTraces,
  clearTraces,
  getSimulateFailure,
  setSimulateFailure,
  type TraceEntry,
} from '../server/trace';

export function TraceDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [traces, setTraces] = useState<TraceEntry[]>([]);
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [simulate500, setSimulate500State] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setTraces(getTraces());
    setSimulate500State(getSimulateFailure());

    const unsubscribe = subscribeTraces(newTraces => {
      setTraces(newTraces);
    });

    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };

    window.addEventListener('df360:toggle-trace', handleToggle);

    return () => {
      unsubscribe();
      window.removeEventListener('df360:toggle-trace', handleToggle);
    };
  }, []);

  const handleToggleFailure = () => {
    const nextVal = !simulate500;
    setSimulateFailure(nextVal);
    setSimulate500State(nextVal);
  };

  const filteredTraces = traces.filter(t => {
    if (filterMethod !== 'ALL' && t.method !== filterMethod) return false;
    if (search && !t.path.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Backend Execution Trace Drawer"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '560px',
        maxWidth: '100vw',
        background: '#ffffff',
        borderLeft: '4px solid #000000',
        boxShadow: '-8px 0px 0px 0px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#000000',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #000000',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⚡</span>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Backend Trace Logger
            </h2>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Intercepted in-browser network calls & table reads/writes
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          style={{
            background: '#ffffff',
            color: '#000000',
            border: '2px solid #000000',
            fontWeight: 900,
            fontSize: '12px',
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          ✕ CLOSE
        </button>
      </div>

      {/* Toolbar */}
      <div
        style={{
          background: '#f8fafc',
          borderBottom: '2px solid #000000',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Filter by endpoint path..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '12px',
              border: '2px solid #000000',
              fontWeight: 600,
              outline: 'none',
            }}
          />

          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
            style={{
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: 800,
              border: '2px solid #000000',
              background: '#ffffff',
            }}
          >
            <option value="ALL">ALL METHODS</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          <button
            type="button"
            onClick={clearTraces}
            style={{
              background: '#ffffff',
              border: '2px solid #000000',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>

        {/* Failure injection switch */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: simulate500 ? '#fef2f2' : '#ffffff',
            border: `2px solid ${simulate500 ? '#ef4444' : '#000000'}`,
            padding: '6px 12px',
          }}
        >
          <label
            htmlFor="simulate-500-toggle"
            style={{ fontSize: '12px', fontWeight: 700, color: simulate500 ? '#b91c1c' : '#374151', cursor: 'pointer' }}
          >
            Simulate 500 Failure on Next Write:
          </label>
          <input
            id="simulate-500-toggle"
            type="checkbox"
            checked={simulate500}
            onChange={handleToggleFailure}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Traces List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredTraces.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
            No intercepted requests captured yet. Make actions in the demo to populate traces!
          </div>
        ) : (
          filteredTraces.map(t => {
            const isExpanded = expandedId === t.id;
            const isSuccess = t.status >= 200 && t.status < 300;
            const isClientError = t.status >= 400 && t.status < 500;

            const methodBg =
              t.method === 'GET' ? '#3b82f6' :
              t.method === 'POST' ? '#10b981' :
              t.method === 'PUT' ? '#8b5cf6' :
              t.method === 'DELETE' ? '#ef4444' : '#6b7280';

            const statusBg = isSuccess ? '#10b981' : isClientError ? '#f59e0b' : '#ef4444';

            return (
              <div
                key={t.id}
                style={{
                  background: '#ffffff',
                  border: '2px solid #000000',
                  boxShadow: '3px 3px 0px 0px #000000',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '12px',
                }}
              >
                {/* Top line */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        background: methodBg,
                        color: '#ffffff',
                        padding: '1px 6px',
                        fontWeight: 900,
                        fontSize: '10px',
                        border: '1px solid #000000',
                      }}
                    >
                      {t.method}
                    </span>

                    <span
                      style={{
                        background: statusBg,
                        color: '#ffffff',
                        padding: '1px 6px',
                        fontWeight: 900,
                        fontSize: '10px',
                        border: '1px solid #000000',
                      }}
                    >
                      {t.status}
                    </span>

                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#000000', wordBreak: 'break-all' }}>
                      {t.path}
                    </span>
                  </div>

                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                    {t.latencyMs} ms
                  </span>
                </div>

                {/* Actor & Table Info */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                  {t.actorRole && (
                    <span style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}>
                      Role: {t.actorRole}
                    </span>
                  )}

                  {t.tablesRead.length > 0 && (
                    <span style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1e40af', padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}>
                      Read: {t.tablesRead.join(', ')}
                    </span>
                  )}

                  {t.tablesWritten.length > 0 && (
                    <span style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}>
                      Wrote: {t.tablesWritten.join(', ')}
                    </span>
                  )}
                </div>

                {/* Expand Toggle */}
                <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#2563eb',
                      fontWeight: 800,
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: '2px 4px',
                    }}
                  >
                    {isExpanded ? 'Hide Payload ▲' : 'Inspect JSON ▼'}
                  </button>
                </div>

                {/* Collapsible JSON Body */}
                {isExpanded && (
                  <div style={{ marginTop: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Boolean(t.requestBody) && (
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                          Request Body:
                        </div>
                        <pre style={{ background: '#f8fafc', padding: '6px', border: '1px solid #e2e8f0', fontSize: '11px', overflowX: 'auto', maxHeight: '140px', margin: '2px 0 0 0' }}>
                          {JSON.stringify(t.requestBody, null, 2)}
                        </pre>
                      </div>
                    )}

                    {Boolean(t.responseBody) && (
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                          Response Payload:
                        </div>
                        <pre style={{ background: '#f8fafc', padding: '6px', border: '1px solid #e2e8f0', fontSize: '11px', overflowX: 'auto', maxHeight: '180px', margin: '2px 0 0 0' }}>
                          {JSON.stringify(t.responseBody, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

