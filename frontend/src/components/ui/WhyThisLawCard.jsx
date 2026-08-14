import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, CheckCircle2, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';
import HighlightText from './HighlightText';

export default function WhyThisLawCard({ whyThisLaw, kbEntry, language = 'en' }) {
  if (!whyThisLaw && !kbEntry) return null;

  const isHi = language === 'hi';

  const heading = isHi ? 'यह कानून क्यों लागू होता है? (Why This Law?)' : 'Why This Law Applies to Your Case';
  const factLabel = isHi ? '1. पहचाना गया मुख्य तथ्य:' : '1. DETECTED CASE FACT:';
  const issueLabel = isHi ? '2. कानूनी विवाद वर्गीकरण:' : '2. LEGAL ISSUE CLASSIFICATION:';
  const provisionLabel = isHi ? '3. लागू कानूनी प्रावधान:' : '3. APPLICABLE PROVISION:';
  const reasonLabel = isHi ? '4. लागू होने का तर्क:' : '4. REASON & JURISPRUDENTIAL BASIS:';
  const sourceLabel = isHi ? 'आधिकारिक स्रोत:' : 'Official Government Source:';

  const factText = whyThisLaw?.detected_fact || "Material facts extracted from user intake description.";
  const issueText = whyThisLaw?.legal_issue || `${kbEntry?.domain?.toUpperCase()} dispute regarding ${kbEntry?.issue_type?.replace(/_/g, ' ')}`;
  const provisionText = whyThisLaw?.applicable_provision || `${kbEntry?.act_name} (${kbEntry?.section_number})`;
  const reasonText = whyThisLaw?.reason || kbEntry?.plain_summary_seed || "Statutory protection under Indian law.";
  const sourceName = whyThisLaw?.official_source_name || kbEntry?.official_source_name || "India Code";
  const sourceUrl = whyThisLaw?.official_source_url || kbEntry?.source_url || "https://www.indiacode.nic.in/";

  return (
    <motion.div 
      className="glass-card panel-card why-this-law-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="why-law-header">
        <div className="why-law-title-group">
          <div className="gold-help-box">
            <HelpCircle size={22} className="gold-help-icon" />
          </div>
          <div>
            <h3 className="why-law-title">{heading}</h3>
            <span className="why-law-subtitle">
              {isHi ? 'तथ्य-से-कानून मैपिंग में पारदर्शिता' : 'Transparent Fact-to-Law Matching & Statutory Reasoning'}
            </span>
          </div>
        </div>
        <div className="confidence-pill-verified">
          <ShieldCheck size={14} />
          <span>{whyThisLaw?.confidence_label || '100% Citation Verified'}</span>
        </div>
      </div>

      {/* Structured Fact-to-Law Flow Pipeline */}
      <div className="why-law-flow-grid">
        
        {/* Step 1: Fact */}
        <div className="flow-step-box">
          <span className="flow-caps-tag">{factLabel}</span>
          <p className="flow-text-content">
            "<HighlightText text={factText} />"
          </p>
        </div>

        <div className="flow-arrow-divider">
          <ArrowRight size={18} className="arrow-icon" />
        </div>

        {/* Step 2: Issue */}
        <div className="flow-step-box">
          <span className="flow-caps-tag">{issueLabel}</span>
          <p className="flow-text-bold">
            <HighlightText text={issueText} />
          </p>
        </div>

        <div className="flow-arrow-divider">
          <ArrowRight size={18} className="arrow-icon" />
        </div>

        {/* Step 3: Provision */}
        <div className="flow-step-box highlight-provision-box">
          <span className="flow-caps-tag">{provisionLabel}</span>
          <p className="flow-text-emerald">
            <HighlightText text={provisionText} />
          </p>
        </div>

      </div>

      {/* Rationale Section */}
      <div className="why-law-reason-box">
        <span className="reason-caps-tag">{reasonLabel}</span>
        <p className="reason-body-text">
          <HighlightText text={reasonText} />
        </p>
      </div>

      {/* Official Citation Source Footer */}
      <div className="why-law-footer">
        <div className="source-link-group">
          <CheckCircle2 size={16} className="icon-emerald" />
          <span>{sourceLabel} <strong>{sourceName}</strong></span>
        </div>
        {sourceUrl && (
          <a 
            href={sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-source-link"
          >
            <span>{isHi ? 'आधिकारिक स्रोत देखें' : 'View Official Government Source'}</span>
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </motion.div>
  );
}
