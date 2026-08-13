import React, { useState, useEffect } from 'react';
import { Scale, ShieldCheck, Moon, Sun, History } from 'lucide-react';
import { api } from '../api/client';

interface NavbarProps {
  onOpenHistory?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenHistory }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check or create session on initial render
    api.getSession()
      .then((data) => setSessionId(data.session_id))
      .catch(() => {
        api.createSession().then((d) => setSessionId(d.session_id)).catch(() => {});
      });
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <nav className="glass-panel" style={{ margin: '16px 24px', padding: '14px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #10b981)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            <Scale size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.1 }}>
              LegalAId
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              AI Rights Assistant for India
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Active Anonymous Session Indicator */}
          <div className="badge badge-emerald" title={`Session ID: ${sessionId || 'Initializing...'}`}>
            <ShieldCheck size={14} />
            <span>{sessionId ? 'Anonymous Session Active' : 'Connecting...'}</span>
          </div>

          {/* History Trigger */}
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              <History size={16} />
              <span>History</span>
            </button>
          )}

          {/* Dark / Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
          </button>
        </div>
      </div>
    </nav>
  );
};
