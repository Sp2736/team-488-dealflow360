// src/app/architecture/components/SchemaSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DOMAINS, MODELS_METADATA, type ModelMetadata } from '../schemaMetadata';
import { getStore } from '@/demo/db/store';

export function SchemaSection() {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [activeModelName, setActiveModelName] = useState<string>('Quote');
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const store = getStore();
      const counts: Record<string, number> = {};
      Object.keys(MODELS_METADATA).forEach(model => {
        try {
          counts[model] = store.count(model as any);
        } catch {
          counts[model] = 0;
        }
      });
      setRowCounts(counts);
    } catch {
      // Ignore during initial SSR hydration
    }
  }, []);

  const activeModel: ModelMetadata = MODELS_METADATA[activeModelName] || MODELS_METADATA.Quote;

  const filteredModels = Object.values(MODELS_METADATA).filter(m => {
    if (selectedDomain === 'all') return true;
    return m.domain === selectedDomain;
  });

  return (
    <section id="schema" className="card" style={{ border: '3px solid #000000', padding: '24px', background: '#ffffff' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Section 6.7 · Relational Data Architecture
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Database Schema (33 Core Models & Live Session Counts)
        </h2>
      </div>

      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
        The relational data model comprises 33 models derived from <code>schema.prisma</code> (configured for Microsoft SQL Server 2022). In this live demo session, each table is backed by our in-memory store. <strong>Click any table card to inspect columns, indexes, and touched subsystems.</strong>
      </p>

      {/* Central Spine Highlight */}
      <div
        style={{
          border: '2px solid #000000',
          background: '#fefce8',
          padding: '16px',
          marginBottom: '24px',
          boxShadow: '3px 3px 0px 0px #000000',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
          🏛️ The Central Relational Spine
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 800 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: '#0369a1' }}>Commercial Spine:</span>
            <span style={{ background: '#fff', border: '1.5px solid #000', padding: '2px 8px' }}>Customer</span>
            <span>➔</span>
            <span style={{ background: '#fbbf24', border: '1.5px solid #000', padding: '2px 8px' }}>Quote</span>
            <span>➔</span>
            <span style={{ background: '#fff', border: '1.5px solid #000', padding: '2px 8px' }}>QuoteLine</span>
            <span>➔</span>
            <span style={{ background: '#fff', border: '1.5px solid #000', padding: '2px 8px' }}>Product</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: '#166534' }}>Execution Spine:</span>
            <span style={{ background: '#fbbf24', border: '1.5px solid #000', padding: '2px 8px' }}>Quote</span>
            <span>➔</span>
            <span style={{ background: '#fff', border: '1.5px solid #000', padding: '2px 8px' }}>Order</span>
            <span>➔</span>
            <span style={{ background: '#fff', border: '1.5px solid #000', padding: '2px 8px' }}>Invoice / Fulfillment / Subscription</span>
          </div>
        </div>
      </div>

      {/* Domain Filter Pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setSelectedDomain('all')}
          style={{
            background: selectedDomain === 'all' ? '#000000' : '#ffffff',
            color: selectedDomain === 'all' ? '#ffffff' : '#000000',
            border: '2px solid #000000',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          All Domains (33)
        </button>
        {DOMAINS.map(d => {
          const isSelected = selectedDomain === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDomain(d.id)}
              style={{
                background: isSelected ? '#000000' : '#ffffff',
                color: isSelected ? '#ffffff' : '#000000',
                border: '2px solid #000000',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {d.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Split View: Model Grid & Detail Side-Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Table Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', maxHeight: '520px', overflowY: 'auto', paddingRight: '8px' }}>
          {filteredModels.map(model => {
            const isSelected = activeModelName === model.name;
            const count = rowCounts[model.name] ?? 0;

            return (
              <div
                key={model.name}
                onClick={() => setActiveModelName(model.name)}
                style={{
                  background: isSelected ? '#fefce8' : '#ffffff',
                  border: isSelected ? '2.5px solid #000000' : '1.5px solid #cbd5e1',
                  padding: '10px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '3px 3px 0px 0px #000000' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.1s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 900, fontSize: '13px', color: isSelected ? '#000' : '#0f172a' }}>
                      {model.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: '11px',
                        background: '#e2e8f0',
                        padding: '1px 5px',
                        borderRadius: '3px',
                      }}
                      title="Live row count in current demo session"
                    >
                      {count}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                    {model.tableName}
                  </div>
                </div>

                <div style={{ fontSize: '10px', color: '#475569', marginTop: '6px' }}>
                  {model.fields.length} cols · {model.indexes.length} idx
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Model Detail Panel */}
        <div
          style={{
            border: '3px solid #000000',
            background: '#f8fafc',
            padding: '20px',
            boxShadow: '4px 4px 0px 0px #000000',
            maxHeight: '520px',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
                  {activeModel.name}
                </h3>
                <span
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {rowCounts[activeModel.name] ?? 0} rows live
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                Table: <code>{activeModel.tableName}</code> · Domain: {activeModel.domain}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#334155', marginBottom: '16px' }}>
            {activeModel.description}
          </p>

          {/* Touched By */}
          <div style={{ marginBottom: '16px', background: '#ffffff', border: '1.5px solid #000', padding: '8px 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              Subsystems & Engines Touching This Table:
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {activeModel.touchedBy.map((t, idx) => (
                <span key={idx} style={{ background: '#fef3c7', border: '1px solid #d97706', fontSize: '11px', fontWeight: 700, padding: '1px 6px' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Fields Table */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
              Columns & Types ({activeModel.fields.length}):
            </div>
            <div className="table-wrap" style={{ border: '1.5px solid #000', background: '#ffffff' }}>
              <table className="data-table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Keys / Constraints</th>
                  </tr>
                </thead>
                <tbody>
                  {activeModel.fields.map((f, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 800, fontFamily: 'monospace' }}>{f.name}</td>
                      <td style={{ color: '#475569' }}>{f.type}</td>
                      <td>
                        {f.isPk && <span className="badge badge-success" style={{ fontSize: '9px', marginRight: '4px' }}>PK</span>}
                        {f.isFk && <span className="badge badge-warning" style={{ fontSize: '9px', marginRight: '4px' }}>FK</span>}
                        {f.isUnique && <span className="badge badge-info" style={{ fontSize: '9px' }}>UNIQUE</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Indexes */}
          {activeModel.indexes.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Indexes & Unique Constraints:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeModel.indexes.map((idx, i) => (
                  <code key={i} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 6px', fontSize: '10px' }}>
                    {idx}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

