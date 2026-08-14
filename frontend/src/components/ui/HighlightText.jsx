import React from 'react';

const DEFAULT_HIGHLIGHT_KEYWORDS = [
  'Consumer Protection Act, 2019',
  'Consumer Protection Act',
  'Section 2(47)',
  'Section 35',
  'Section 2(11)',
  'Unfair Trade Practice',
  'Deficiency in Service',
  'defective products',
  'statutory obligations',
  'redressal',
  'replacement or refund',
  'replacement',
  'refund',
  'limitation period',
  'remedy forum',
  'District Commission',
  'Labour Court',
  '15 days',
  '30 days',
  '2 years',
  'STATEMENT OF FACTS',
  'APPLICABLE LAW & STATUTORY PROVISIONS',
  'APPLICABLE LAW',
  'DEMAND & RELIEF SOUGHT',
  'FORMAL STATUTORY LEGAL NOTICE',
  'REQUISITION & REFUND REQUEST NOTICE',
  '₹22,000',
  '₹450',
  '₹300',
  'MRP'
];

export default function HighlightText({ text, extraKeywords = [], enableHighlight = true, className = "" }) {
  if (!text) return null;

  if (!enableHighlight) {
    return <span className={className}>{text}</span>;
  }

  const allKeywords = Array.from(new Set([...extraKeywords, ...DEFAULT_HIGHLIGHT_KEYWORDS])).filter(Boolean);

  // Escape special regex characters in keywords
  const escapedKeywords = allKeywords
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length); // match longest phrases first

  if (escapedKeywords.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={`highlighted-text-wrapper ${className}`}>
      {parts.map((part, index) => {
        const isMatch = allKeywords.some(kw => kw.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <mark key={index} className="legal-word-highlight">
              {part}
            </mark>
          );
        }
        return part;
      })}
    </span>
  );
}
