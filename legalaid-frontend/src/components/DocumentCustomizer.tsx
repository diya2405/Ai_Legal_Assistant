import React, { useState } from 'react';
import { Download, ArrowLeft, Sparkles, CheckCircle2, Eye, Edit3 } from 'lucide-react';
import { api } from '../api/client';
import type { GenerateDocumentResponse } from '../types';

interface DocumentCustomizerProps {
  intakeId: string;
  onBackToExplanation: () => void;
}

export const DocumentCustomizer: React.FC<DocumentCustomizerProps> = ({
  intakeId,
  onBackToExplanation
}) => {
  const [tone, setTone] = useState<'request' | 'formal'>('formal');
  const [complainantName, setComplainantName] = useState('Ramesh Kumar');
  const [complainantAddress, setComplainantAddress] = useState('Flat 402, Green Enclave, Delhi');
  const [opponentName, setOpponentName] = useState('XYZ Retail Electronics Ltd.');
  const [opponentAddress, setOpponentAddress] = useState('Store 12, City Mall, Delhi');
  const [amountClaimed, setAmountClaimed] = useState('45,000');
  const [noticeFacts, setNoticeFacts] = useState('The complainant purchased an electronics item for Rs 45,000. The item was found defective upon delivery and the seller refuses repair or refund despite multiple requests.');

  const [loading, setLoading] = useState(false);
  const [documentData, setDocumentData] = useState<GenerateDocumentResponse | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.generateDocument(intakeId, {
        tone,
        complainant_name: complainantName,
        complainant_address: complainantAddress,
        opponent_name: opponentName,
        opponent_address: opponentAddress,
        amount_claimed: amountClaimed
      });
      setDocumentData(res);
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF document. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto 60px auto', padding: '0 24px' }}>
      {/* Top Header & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button
          onClick={onBackToExplanation}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Rights Analysis</span>
        </button>

        <span className="badge badge-emerald">
          <CheckCircle2 size={14} />
          <span>Step 3 of 3: Live Document Editor & Preview</span>
        </span>
      </div>

      {/* Main Split-Screen Grid: Left Editor | Right Live Canvas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
        
        {/* LEFT COLUMN: EDIT FORM & TONE SELECTOR */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-indigo)', fontWeight: 700, fontSize: '1.2rem' }}>
            <Edit3 size={20} />
            <span>Customize Notice Details</span>
          </div>

          <form onSubmit={handleGenerate}>
            {/* Tone Selector */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Notice Legal Tone:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setTone('request')}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${tone === 'request' ? 'var(--accent-indigo)' : 'var(--border-color)'}`,
                    background: tone === 'request' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    🤝 Amicable Request
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Polite demand</div>
                </div>

                <div
                  onClick={() => setTone('formal')}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${tone === 'formal' ? 'var(--accent-indigo)' : 'var(--border-color)'}`,
                    background: tone === 'formal' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    ⚖️ Formal Legal Demand
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Strict statutory notice</div>
                </div>
              </div>
            </div>

            {/* Editable Form Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Complainant Name (From):
                </label>
                <input
                  type="text"
                  value={complainantName}
                  onChange={(e) => setComplainantName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Complainant Address:
                </label>
                <input
                  type="text"
                  value={complainantAddress}
                  onChange={(e) => setComplainantAddress(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Opponent / Vendor Name (To):
                </label>
                <input
                  type="text"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Opponent Address:
                </label>
                <input
                  type="text"
                  value={opponentAddress}
                  onChange={(e) => setOpponentAddress(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Financial Dispute Claim Amount (Rs.):
                </label>
                <input
                  type="text"
                  value={amountClaimed}
                  onChange={(e) => setAmountClaimed(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Statement of Grievance & Facts:
                </label>
                <textarea
                  rows={3}
                  value={noticeFacts}
                  onChange={(e) => setNoticeFacts(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Sparkles size={18} />
              <span>{loading ? 'Compiling PDF Document...' : 'Compile & Download Official PDF'}</span>
            </button>
          </form>

          {/* Download Box */}
          {documentData && (
            <div className="glass-card animate-fade-in" style={{ padding: '16px', marginTop: '20px', border: '1px solid var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', textAlign: 'center' }}>
              <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>
                ✔ PDF Document Compiled Successfully!
              </div>
              <a
                href={api.getDownloadUrl(documentData.download_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ textDecoration: 'none', padding: '10px 16px', fontSize: '0.88rem' }}
              >
                <Download size={16} />
                <span>Download Official Legal_Notice.pdf</span>
              </a>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE REAL-TIME LEGAL DOCUMENT CANVAS PREVIEW */}
        <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', color: '#1a1a1a', borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)', fontFamily: '"Times New Roman", Times, serif' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              BY REGISTERED POST A.D. / SPEED POST / EMAIL
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 'bold', fontSize: '0.75rem' }}>
              <Eye size={14} />
              <span>LIVE DOCUMENT PREVIEW</span>
            </div>
          </div>

          {/* Notice Subject Banner */}
          <div style={{ textAlign: 'center', margin: '12px 0 16px 0', padding: '8px', border: '1.5px solid #000', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: '"Times New Roman", Times, serif' }}>
              {tone === 'formal' ? 'STRICT LEGAL DEMAND NOTICE' : 'REQUISITION NOTICE & RECOVERY DEMAND'}
            </h3>
          </div>

          {/* Parties Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>
            <div style={{ border: '1px solid #e2e8f0', padding: '8px', background: '#f8fafc' }}>
              <strong style={{ color: '#1e3a8a', textTransform: 'uppercase', fontSize: '0.75rem' }}>FROM (SENDER):</strong>
              <div><strong>{complainantName || '[Your Name]'}</strong></div>
              <div style={{ color: '#475569', fontSize: '0.8rem' }}>{complainantAddress || '[Your Address]'}</div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', padding: '8px', background: '#f8fafc' }}>
              <strong style={{ color: '#1e3a8a', textTransform: 'uppercase', fontSize: '0.75rem' }}>TO (RECIPIENT):</strong>
              <div><strong>{opponentName || '[Opponent Name]'}</strong></div>
              <div style={{ color: '#475569', fontSize: '0.8rem' }}>{opponentAddress || '[Opponent Address]'}</div>
            </div>
          </div>

          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', padding: '6px 8px', background: '#e2e8f0', borderLeft: '4px solid #1d4ed8', fontSize: '0.82rem', marginBottom: '14px' }}>
            SUBJECT: LEGAL NOTICE FOR RECOVERY OF DISPUTED AMOUNT (Rs. {amountClaimed || '0'}) & DEFICIENCY OF SERVICE
          </div>

          {/* Statement of Facts */}
          <div style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '14px', textAlign: 'justify' }}>
            <strong style={{ display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.8rem', borderBottom: '1px solid #cbd5e1' }}>
              1. Statement of Facts & Cause of Action
            </strong>
            <p style={{ margin: 0 }}>{noticeFacts}</p>
          </div>

          {/* Financial Claim */}
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '10px', fontSize: '0.85rem', marginBottom: '14px' }}>
            <strong style={{ color: '#92400e' }}>2. Total Financial Claim Demanded:</strong> Rs. {amountClaimed}/-
          </div>

          {/* Annexures */}
          <div style={{ fontSize: '0.82rem', marginBottom: '14px' }}>
            <strong style={{ display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.78rem' }}>
              3. List of Supporting Evidence & Annexures:
            </strong>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569' }}>
              <li>Annexure A: Purchase Invoice / Retail Bill</li>
              <li>Annexure B: Bank Payment Proof (UPI / Account Statement)</li>
              <li>Annexure C: Written Email / WhatsApp Complaints Transcripts</li>
            </ul>
          </div>

          {/* Demand Ultimatum */}
          <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', padding: '10px', fontSize: '0.82rem', marginBottom: '16px' }}>
            <strong style={{ color: '#991b1b' }}>
              {tone === 'formal' ? 'TAKE NOTICE THAT' : 'REQUISITION:'}
            </strong> you are hereby called upon to satisfy the above claim within <strong>15 (FIFTEEN) DAYS</strong> from receipt of this notice, failing which litigation proceedings will be instituted before the appropriate Consumer Forum / Court at your sole risk and cost.
          </div>

          {/* Signature */}
          <div style={{ textAlign: 'right', marginTop: '24px', fontSize: '0.85rem' }}>
            <p style={{ margin: 0 }}>Yours faithfully,</p>
            <br />
            <p style={{ margin: 0 }}>__________________________</p>
            <strong>{complainantName}</strong>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>(Aggrieved Party)</div>
          </div>

        </div>

      </div>
    </div>
  );
};
