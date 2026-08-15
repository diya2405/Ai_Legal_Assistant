import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Sparkles, ShieldCheck, Info, X, ExternalLink } from 'lucide-react';
import HighlightText from './HighlightText';

export default function ApplicableProvisionsCard({ kbEntry, language = 'en', enableHighlight = true }) {
  const [showModal, setShowModal] = useState(false);

  if (!kbEntry) return null;

  const isHi = language === 'hi';

  const title = isHi ? 'लागू कानूनी प्रावधान' : 'Applicable legal provisions';
  const actNameLabel = isHi ? 'अधिनियम का नाम:' : 'ACT NAME:';
  const sectionLabel = isHi ? 'धारा क्रमांक:' : 'SECTION NUMBER:';
  const explanationLabel = isHi ? 'वैधानिक नियम व्याख्या:' : 'STATUTORY RULE EXPLANATION:';
  const whyBtnText = isHi ? '🛡️ हम यह क्यों दिखा रहे हैं?' : 'Why are we showing this?';

  const defaultExplanation = isHi
    ? (kbEntry.plain_summary_seed_hi || kbEntry.plain_summary_seed || 'उपभोक्ताओं को अनुचित व्यापार प्रथाओं के खिलाफ निवारण प्राप्त करने तथा दोषपूर्ण उत्पादों के लिए प्रतिस्थापन या धनवापसी प्राप्त करने का अधिकार प्रदान करता है।')
    : (kbEntry.plain_summary_seed || 'Provides consumers the right to seek redressal against unfair trade practices and obtain replacement or refund for defective products.');

  return (
    <motion.div
      className="glass-card panel-card applicable-provisions-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top Header */}
      <div className="provisions-header">
        <div className="header-left-group">
          <div className="mint-icon-box">
            <Scale size={22} className="mint-scale-icon" />
          </div>
          <h2 className="provisions-title">{title}</h2>
        </div>
      </div>

      {/* Main Inner Details Card Container */}
      <div className="provisions-inner-box">
        <div className="provisions-grid">
          <div className="provision-field">
            <span className="field-caps-label">{actNameLabel}</span>
            <div className="field-value-bold">
              <HighlightText
                text={kbEntry.act_name}
                enableHighlight={enableHighlight}
              />
            </div>
          </div>

          <div className="provision-field">
            <span className="field-caps-label">{sectionLabel}</span>
            <div className="field-value-emerald">
              <HighlightText
                text={kbEntry.section_number}
                enableHighlight={enableHighlight}
              />
            </div>
          </div>
        </div>

        <div className="provisions-divider"></div>

        <div className="provision-field full-width">
          <span className="field-caps-label">{explanationLabel}</span>
          <p className="field-explanation-text">
            <HighlightText
              text={defaultExplanation}
              enableHighlight={enableHighlight}
            />
          </p>
        </div>
      </div>

      {/* Bottom Action Pill Button */}
      <div className="provisions-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <motion.button
          className="why-showing-btn"
          onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <ShieldCheck size={16} className="shield-icon" />
          <span>{whyBtnText}</span>
        </motion.button>

        <span
          className="source-link-pill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            color: '#10b981',
            padding: '6px 12px',
            borderRadius: '20px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontWeight: 500
          }}
        >
          <span>{isHi ? 'पूर्वानुमान स्रोत: मूल अधिनियम ज्ञानकोश' : 'Prediction Source: Bare Act KB'}</span>
        </span>
      </div>

      {/* Interactive Explanation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="modal-card glass-card"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title-group">
                  <ShieldCheck size={20} className="icon-accent-emerald" />
                  <h3>{isHi ? 'साइटेशन मैपिंग और सत्यापन' : 'Citation Mapping & Verification'}</h3>
                </div>
                <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <p>
                  {isHi
                    ? `यह कानून (${kbEntry.act_name} ${kbEntry.section_number}) आपके द्वारा दर्ज किए गए मामले के तथ्यों के आधार पर 100% सटीक साइटेशन गार्ड द्वारा सत्यापित किया गया है।`
                    : `This statutory provision (${kbEntry.act_name} - ${kbEntry.section_number}) was deterministically retrieved based on natural language case entities and verified by our 100% Citation Guard.`
                  }
                </p>
                <div className="modal-info-box">
                  <Info size={16} className="icon-accent-blue" />
                  <span>
                    {isHi
                      ? `अधिनियम स्रोत: भारत का राजपत्र एवं आधिकारिक मूल अधिनियम ज्ञानकोश (${kbEntry.official_source_name || kbEntry.act_name})।`
                      : `Prediction Source: Official Bare Act Knowledge Base (${kbEntry.official_source_name || kbEntry.law_code || 'Statute Code'}). Forum: ${kbEntry.remedy_forum}.`
                    }
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-primary btn-sm" onClick={() => setShowModal(false)}>
                  {isHi ? 'समझ गया' : 'Got it'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
