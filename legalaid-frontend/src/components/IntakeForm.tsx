import React, { useState, useEffect } from 'react';
import { Send, Mic, Sparkles, DollarSign, Phone, Calendar } from 'lucide-react';
import { api } from '../api/client';
import type { IntakeResponse } from '../types';

interface IntakeFormProps {
  onIntakeCreated: (intakeData: IntakeResponse) => void;
}

const SAMPLE_SCENARIOS = [
  {
    title: '🛒 Defective Product',
    text: 'I bought a defective refrigerator from XYZ Electronics for Rs. 45000 on 12th May. Phone: 9876543210. The seller is refusing repair or refund.'
  },
  {
    title: '💼 Unpaid Salary',
    text: 'My employer withheld my salary for 3 months amounting to Rs. 120000. Phone: 9123456789. What are my legal remedies?'
  },
  {
    title: '🏠 Tenant Deposit Withheld',
    text: 'My landlord is refusing to refund my security deposit of Rs. 35000 after I vacated the flat on 1st April.'
  }
];

export const IntakeForm: React.FC<IntakeFormProps> = ({ onIntakeCreated }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [detectedEntities, setDetectedEntities] = useState<{ label: string; value: string }[]>([]);

  // Instant client-side entity preview while typing
  useEffect(() => {
    const ents: { label: string; value: string }[] = [];
    
    // Money regex
    const moneyMatch = text.match(/(?:Rs\.?|INR|₹)\s*[\d,]+/gi) || text.match(/\b\d{4,7}\b/g);
    if (moneyMatch) {
      moneyMatch.forEach(m => ents.push({ label: 'MONEY', value: m }));
    }

    // Phone regex
    const phoneMatch = text.match(/\b[6-9]\d{9}\b/g);
    if (phoneMatch) {
      phoneMatch.forEach(p => ents.push({ label: 'PHONE', value: p }));
    }

    // Date regex
    const dateMatch = text.match(/\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/gi);
    if (dateMatch) {
      dateMatch.forEach(d => ents.push({ label: 'DATE', value: d }));
    }

    setDetectedEntities(ents);
  }, [text]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length < 10) return;

    setLoading(true);
    try {
      setLoadingStep('Detecting language & extracting key entities...');
      const intakeData = await api.createIntake(text);

      setLoadingStep('Classifying legal domain & matching verified statutes...');
      await api.classifyIntake(intakeData.intake_id);

      setLoadingStep('Complete! Loading your personalized rights dashboard...');
      setTimeout(() => {
        onIntakeCreated(intakeData);
        setLoading(false);
      }, 600);

    } catch (err) {
      console.error(err);
      alert('Failed to process grievance intake. Please try again.');
      setLoading(false);
    }
  };

  const handleVoiceClick = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Supports Indian English & Hindi terms

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '850px', margin: '0 auto 40px auto', padding: '32px' }}>
      {/* Scenario Chips Header */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          💡 Try a Sample Grievance Scenario:
        </span>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
          {SAMPLE_SCENARIOS.map((sc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setText(sc.text)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              {sc.title}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main Textarea Input */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your legal problem in plain English or Hindi (e.g. I bought a defective refrigerator for Rs 45,000 on 12th May and the vendor refuses repair...)"
            maxLength={2000}
            rows={6}
            style={{
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 48px 16px 16px',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.6,
              fontFamily: 'Inter, sans-serif'
            }}
          />

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={handleVoiceClick}
            style={{
              position: 'absolute',
              right: '16px',
              top: '16px',
              background: isRecording ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
              border: 'none',
              color: isRecording ? 'var(--accent-rose)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isRecording ? 'Listening...' : 'Voice Input (Dictate Issue)'}
          >
            <Mic size={20} className={isRecording ? 'pulse-glow' : ''} />
          </button>
        </div>

        {/* Character Count & Entity Detection Preview Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
          {/* Entity Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {detectedEntities.length > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Auto-Detected Facts:
              </span>
            )}
            {detectedEntities.map((ent, i) => (
              <span key={i} className="badge badge-indigo" style={{ fontSize: '0.75rem' }}>
                {ent.label === 'MONEY' && <DollarSign size={12} />}
                {ent.label === 'PHONE' && <Phone size={12} />}
                {ent.label === 'DATE' && <Calendar size={12} />}
                <span>{ent.value}</span>
              </span>
            ))}
          </div>

          {/* Character Counter */}
          <span style={{ fontSize: '0.85rem', color: text.length > 1800 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
            {text.length} / 2000 chars
          </span>
        </div>

        {/* Submit Button & Progressive Loading State */}
        {loading ? (
          <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--accent-indigo)' }}>
              <Sparkles size={20} className="pulse-glow" />
              <span style={{ fontWeight: 600 }}>{loadingStep}</span>
            </div>
          </div>
        ) : (
          <button
            type="submit"
            disabled={!text.trim() || text.length < 10}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Send size={18} />
            <span>Analyze My Case & Explain Rights →</span>
          </button>
        )}
      </form>
    </div>
  );
};
