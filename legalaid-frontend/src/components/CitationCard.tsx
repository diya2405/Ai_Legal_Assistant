import React from 'react';
import { ExternalLink, CheckCircle2, FileText } from 'lucide-react';
import type { CitationDetail } from '../types';

interface CitationCardProps {
  citation: CitationDetail;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation }) => {
  return (
    <div className="glass-card" style={{ padding: '18px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--accent-indigo)" />
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
            {citation.act_name}
          </h4>
        </div>
        <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
          {citation.law_code || 'N/A'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span className="badge badge-emerald">
          Section {citation.section_number.replace(/^section\s+/i, '')}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
          <CheckCircle2 size={13} />
          Human Legal Verified
        </span>
      </div>

      {citation.source_url && (
        <a
          href={citation.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: 'var(--accent-indigo)',
            textDecoration: 'none',
            fontWeight: 500,
            marginTop: '4px'
          }}
        >
          <span>View Official India Code Record</span>
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
};
