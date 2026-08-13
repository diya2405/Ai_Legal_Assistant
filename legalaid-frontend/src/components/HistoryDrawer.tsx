import React, { useEffect, useState } from 'react';
import { X, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';

interface HistoryCase {
  id: string;
  raw_text: string;
  domain: string;
  created_at: string;
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (caseId: string, rawText: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose, onSelectCase }) => {
  const [cases, setCases] = useState<HistoryCase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiClient.get('/api/session/intakes')
        .then((res) => {
          setCases(res.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        height: '100%',
        borderRadius: 0,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--accent-indigo)" />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
              Session History ({cases.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Info */}
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Real intakes stored under your active anonymous session cookie in Supabase PostgreSQL.
        </p>

        {/* Case List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', padding: '40px 0' }}>
              <Loader2 size={18} className="pulse-glow" />
              <span>Fetching session history...</span>
            </div>
          ) : cases.length > 0 ? (
            cases.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onSelectCase(c.id, c.raw_text);
                  onClose();
                }}
                className="glass-card"
                style={{ padding: '16px', marginBottom: '12px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>{c.domain}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500, margin: '0 0 8px 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.raw_text}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
                  <span>View Analysis & Notice</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '0.9rem' }}>
              No cases submitted in this session yet. Submit a grievance to see it here!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
