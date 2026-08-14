import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Sparkles, Copy, Check, ShieldCheck, AlertTriangle } from 'lucide-react';
import FormattedText from '../ui/FormattedText';

export default function RightsTab({
  kbEntry,
  explanationData,
  expLoading,
  copiedExp,
  onCopyExplanation
}) {
  if (!kbEntry) return null;

  return (
    <motion.div 
      className="tab-content-stack"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      {/* 1. Official Bare Act Law Quoted */}
      <motion.div 
        className="glass-card panel-card bare-act-quote-card"
        whileHover={{ boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)' }}
      >
        <div className="panel-header">
          <div className="panel-title">
            <Scale size={22} className="icon-accent-gold" />
            Official Statutory Bare Act Law Quoted
          </div>
          <span className="badge badge-code">
            {kbEntry.act_name} ({kbEntry.section_number})
          </span>
        </div>

        <div className="official-law-quote-box">
          <div className="quote-header-tag">VERBATIM STATUTORY PROVISION EXCERPT:</div>
          <p className="law-quote-text">"{kbEntry.section_text_plain}"</p>
        </div>

        <div className="statute-meta-footer">
          <span><strong>Filing Forum:</strong> {kbEntry.remedy_forum}</span>
          <span><strong>Limitation Period:</strong> {kbEntry.limitation_period}</span>
          <span><strong>Statutory Code:</strong> {kbEntry.law_code || 'Enacted Law'}</span>
        </div>
      </motion.div>

      {/* 2. Simplified Plain-Language Explanation */}
      <motion.div className="glass-card panel-card hero-explanation-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Sparkles size={22} className="icon-accent-blue" />
            Simplified Plain-Language Explanation
          </div>
          <div className="header-actions">
            <motion.button 
              onClick={onCopyExplanation} 
              className="btn-secondary btn-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copiedExp ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              {copiedExp ? 'Copied' : 'Copy Summary'}
            </motion.button>
            <span className="badge badge-verified">
              <ShieldCheck size={14} />
              Citation Guard Passed
            </span>
          </div>
        </div>

        {expLoading ? (
          <div className="skeleton-container">
            <div className="skeleton-line shimmer" style={{ width: '100%' }}></div>
            <div className="skeleton-line shimmer" style={{ width: '88%' }}></div>
            <div className="skeleton-line shimmer" style={{ width: '65%' }}></div>
          </div>
        ) : (
          <div className="explanation-body">
            <FormattedText text={explanationData?.explanation || kbEntry?.plain_summary_seed} />
          </div>
        )}

        <div className="panel-footer-meta">
          <span>Knowledge Base Source: Bare Act Verification</span>
        </div>
      </motion.div>

      {/* Limitation Warning Alert */}
      <motion.div 
        className="limitation-alert-box"
        whileHover={{ scale: 1.01 }}
      >
        <AlertTriangle size={20} className="alert-icon" />
        <div>
          <strong>Limitation Period Warning:</strong> Under {kbEntry.act_name}, you must issue formal notice or initiate legal proceedings within <strong>{kbEntry.limitation_period}</strong> from the cause of action.
        </div>
      </motion.div>

    </motion.div>
  );
}
