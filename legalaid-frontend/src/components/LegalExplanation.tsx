import React from 'react';
import { ShieldCheck, Sparkles, Clock, ArrowRight, FileCheck, Landmark, FolderCheck, ListChecks, Database } from 'lucide-react';
import type { LegalExplanationResponse } from '../types';
import { CitationCard } from './CitationCard';
import { LegalChat } from './LegalChat';

interface LegalExplanationProps {
  explanationData: LegalExplanationResponse;
  onProceedToDocument: () => void;
}

// Clean helper to render raw markdown text into styled React elements
const renderCleanText = (text: string) => {
  if (!text) return null;

  // Split into paragraphs
  const paragraphs = text.split('\n');

  return paragraphs.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} style={{ height: '8px' }} />;

    // Headers (### Part 1: ...)
    if (trimmed.startsWith('###') || trimmed.startsWith('Part 1') || trimmed.startsWith('Part 2')) {
      const headerText = trimmed.replace(/^#+\s*/, '');
      return (
        <h4 key={idx} style={{
          fontSize: '1.05rem',
          color: 'var(--accent-indigo)',
          marginTop: '14px',
          marginBottom: '8px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '4px',
          fontFamily: 'Outfit, sans-serif'
        }}>
          {headerText}
        </h4>
      );
    }

    // Bullet points (1. **Gather Evidence**:)
    const formattedLine = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return (
      <p
        key={idx}
        style={{ margin: '0 0 10px 0', fontSize: '0.94rem', lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: formattedLine }}
      />
    );
  });
};

export const LegalExplanation: React.FC<LegalExplanationProps> = ({
  explanationData,
  onProceedToDocument
}) => {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto 60px auto', padding: '0 24px' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span className="badge badge-emerald">
              <ShieldCheck size={14} />
              <span>0% AI Hallucination Guard</span>
            </span>
            <span className="badge badge-indigo">
              <Database size={14} />
              <span>RAG: SentenceTransformers + Human KB</span>
            </span>
            <span className="badge badge-indigo">
              <Sparkles size={14} />
              <span>Provider: {explanationData.provider_used.toUpperCase()}</span>
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', margin: 0 }}>
            Legal Rights Analysis & Step-by-Step Guidance
          </h2>
        </div>

        <button onClick={onProceedToDocument} className="btn-primary">
          <span>Generate Formal Legal Notice PDF</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Two Column Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', marginBottom: '28px' }}>
        
        {/* Left Column: Verified Statutory Provisions */}
        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={20} color="var(--accent-indigo)" />
            <span>Verified Statutory Provisions ({explanationData.citations.length})</span>
          </h3>

          {explanationData.citations.length > 0 ? (
            explanationData.citations.map((cit, idx) => (
              <CitationCard key={idx} citation={cit} />
            ))
          ) : (
            <div className="glass-card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
              Consumer Protection Act, 2019 & Statutory Rights apply.
            </div>
          )}

          {/* Limitation Period Warning */}
          <div className="glass-card" style={{ padding: '16px', marginTop: '16px', borderLeft: '4px solid var(--accent-amber)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: 'var(--accent-amber)', fontWeight: 600, fontSize: '0.9rem' }}>
              <Clock size={16} />
              <span>Limitation Period Reminder</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Under Indian law, consumer and labor disputes must be filed within <strong>2 Years</strong> from cause of action.
            </p>
          </div>
        </div>

        {/* Right Column: AI Plain-Language Summary WITH WHITESPACE SCROLL FIX */}
        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={20} color="var(--accent-emerald)" />
            <span>Plain-Language Legal Rights Summary</span>
          </h3>

          <div
            className="glass-panel"
            style={{
              padding: '20px',
              maxHeight: '440px', // FIX: Prevents expanding height and removes bottom whitespace bug!
              overflowY: 'auto',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            {renderCleanText(explanationData.explanation)}
          </div>
        </div>

      </div>

      {/* LOWER SECTION: WHAT TO DO NEXT & SUPPORTING DOCUMENTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
        
        {/* Step-by-Step Action Plan */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-indigo)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>
            <ListChecks size={20} />
            <span>What Should I Do Next? (4-Step Action Plan)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ background: 'var(--accent-indigo)', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>1</span>
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Send Formal Legal Notice</strong>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Send a 15-day formal legal demand notice via Speed Post or Email.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ background: 'var(--accent-indigo)', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>2</span>
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Wait 15 Days for Reply</strong>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Give the opposing party 15 days from delivery to resolve the grievance.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ background: 'var(--accent-indigo)', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>3</span>
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Lodge e-Daakhil Complaint</strong>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>If unaddressed, register an online complaint on <code>edaakhil.nic.in</code> or Helpline (1915).</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ background: 'var(--accent-indigo)', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>4</span>
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>File District Commission Case</strong>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>File a formal claim petition before your District Commission seeking refund + damages.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Required Supporting Documents Checklist */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>
            <FolderCheck size={20} />
            <span>Case-Specific Supporting Documents Checklist</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Tailored evidentiary checklist for your legal domain:
          </p>

          <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(explanationData.supporting_documents || []).map((doc, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--accent-emerald)' }}>📄</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}><strong>{doc}</strong></span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Interactive Q&A Chat Assistant */}
      <LegalChat intakeId={explanationData.intake_id} />
    </div>
  );
};
