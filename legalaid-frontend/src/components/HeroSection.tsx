import React from 'react';
import { ShieldAlert, BookOpenCheck, Lock } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', maxWidth: '800px', margin: '40px auto 24px auto', padding: '0 20px' }}>
      <div className="badge badge-indigo" style={{ marginBottom: '16px' }}>
        <span>⚖️ Empowering First-Generation Litigants in India</span>
      </div>
      
      <h1 style={{ fontSize: '2.8rem', lineHeight: 1.25, color: 'var(--text-primary)', marginBottom: '16px' }}>
        Understand Your Legal Rights in <span style={{
          background: 'linear-gradient(135deg, #6366f1, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>Simple Language</span> & Generate Free Notices
      </h1>
      
      <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.6 }}>
        Describe your legal issue in your own words. We automatically match verified Indian legal provisions, explain your options without jargon, and compile formal legal demand PDFs.
      </p>

      {/* Trust Badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <BookOpenCheck size={16} color="var(--accent-emerald)" />
          <span>100% Human-Audited Laws (IPC/BNS/CPA)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <ShieldAlert size={16} color="var(--accent-indigo)" />
          <span>0% AI Hallucination Guard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Lock size={16} color="var(--accent-amber)" />
          <span>100% Free & Anonymous</span>
        </div>
      </div>
    </div>
  );
};
