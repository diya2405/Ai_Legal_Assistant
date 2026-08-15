import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, RefreshCw, FileCheck, CheckCircle2, Download, Highlighter } from 'lucide-react';
import HighlightText from '../ui/HighlightText';
import { TRANSLATIONS } from '../../data/translations';

export const generateDraftForTone = (tone, entry, isHindi) => {
  if (!entry) return { subject: '', body: '' };

  if (tone === 'request') {
    if (isHindi) {
      return {
        subject: `सहानुभूतिपूर्ण अनुरोध एवं रिफंड आवेदन - ${entry.act_name.toUpperCase()}`,
        body:
          `1. मामले के तथ्य (STATEMENT OF FACTS):\n` +
          `अधोहस्ताक्षरी का निवेदन है कि ${entry.issue_type?.replace(/_/g, ' ')} से संबंधित एक शिकायत उत्पन्न हुई है। हम आशा करते हैं कि इस मामले का बिना किसी कानूनी विवाद के सौहार्दपूर्ण समाधान निकाला जा सकता है।\n\n` +
          `2. कानूनी स्थिति एवं वैधानिक अधिकार (${entry.law_code || 'कानून'}):\n` +
          `सूचित हों कि ${entry.act_name} (${entry.section_number}) के तहत:\n` +
          `"${entry.section_text_plain}"\n\n` +
          `3. सौहार्दपूर्ण अनुरोध (REQUISITION & DIPLOMATIC REQUEST):\n` +
          `आपसे विनम्र निवेदन है कि कृपया इस पत्र की प्राप्ति के 15 दिनों के भीतर हमारी शिकायत का उचित समाधान / रिफंड जारी करें। हमें विश्वास है कि आप इस मामले को तुरंत हल करेंगे।`
      };
    } else {
      return {
        subject: `AMICABLE REQUISITION & REFUND REQUEST REGARDING ${entry.issue_type?.replace(/_/g, ' ').toUpperCase()}`,
        body:
          `1. STATEMENT OF FACTS:\n` +
          `The undersigned respectfully submits that a grievance has arisen regarding ${entry.issue_type?.replace(/_/g, ' ')}. We sincerely believe this matter can be resolved amicably without judicial intervention.\n\n` +
          `2. LEGAL STANDING & RIGHTS (${entry.law_code || 'Statute'}):\n` +
          `Take note that under ${entry.act_name} (${entry.section_number}), the law provides:\n` +
          `"${entry.section_text_plain}"\n\n` +
          `3. REQUISITION & DIPLOMATIC REQUEST:\n` +
          `You are hereby politely requested to arrange for full resolution / refund within 15 days of receipt of this communication. We trust you will take prompt action to resolve this matter amicably.`
      };
    }
  } else {
    // Formal Statutory Notice
    if (isHindi) {
      return {
        subject: `औपचारिक वैधानिक मांग नोटिस - ${entry.act_name.toUpperCase()} (${entry.section_number})`,
        body:
          `1. मामले के तथ्य (STATEMENT OF FACTS):\n` +
          `अधोहस्ताक्षरी का निवेदन है कि आपके अधिकार क्षेत्र के तहत ${entry.issue_type?.replace(/_/g, ' ')} से संबंधित एक गंभीर कानूनी विवाद उत्पन्न हुआ है। बार-बार मौखिक और लिखित अनुरोधों के बावजूद, शिकायत का समाधान नहीं किया गया है।\n\n` +
          `2. लागू कानून एवं वैधानिक प्रावधान (${entry.law_code || 'कानून'}):\n` +
          `सूचित हों कि ${entry.act_name} (${entry.section_number}) के तहत कानून अनिवार्य करता है:\n` +
          `"${entry.section_text_plain}"\n\n` +
          `उपचार मंच: ${entry.remedy_forum}\n` +
          `कानूनी समयावधि: ${entry.limitation_period}\n\n` +
          `3. औपचारिक मांग एवं अदालती चेतावनी (FORMAL DEMAND & LITIGATION WARNING):\n` +
          `आपको इस नोटिस की प्राप्ति के 15 दिनों के भीतर अपने वैधानिक दायित्वों का पालन करने के लिए कहा जाता है, अन्यथा आपके जोखिम और लागत पर ${entry.remedy_forum} के समक्ष औपचारिक कानूनी कार्यवाही शुरू की जाएगी।`
      };
    } else {
      return {
        subject: `FORMAL STATUTORY DEMAND & LEGAL NOTICE UNDER ${entry.act_name.toUpperCase()} (${entry.section_number})`,
        body:
          `1. STATEMENT OF FACTS:\n` +
          `The undersigned hereby serves formal legal notice regarding ${entry.issue_type?.replace(/_/g, ' ')} under your jurisdiction. Despite repeated verbal and written requests, the grievance remains unresolved.\n\n` +
          `2. APPLICABLE LAW & STATUTORY PROVISIONS (${entry.law_code || 'Statute'}):\n` +
          `Take notice that under ${entry.act_name} (${entry.section_number}), the law provides:\n` +
          `"${entry.section_text_plain}"\n\n` +
          `Remedy Forum: ${entry.remedy_forum}\n` +
          `Statutory Limitation Period: ${entry.limitation_period}\n\n` +
          `3. FORMAL DEMAND & LITIGATION WARNING:\n` +
          `You are hereby called upon to comply with your statutory obligations within 15 days of service of this notice, failing which formal legal proceedings will be initiated before ${entry.remedy_forum} at your sole risk, cost, and consequence.`
      };
    }
  }
};

export default function NoticeTab({
  kbEntry,
  docTone,
  setDocTone,
  userName,
  setUserName,
  userAddress,
  setUserAddress,
  opposingName,
  setOpposingName,
  opposingAddress,
  setOpposingAddress,
  customSubject,
  setCustomSubject,
  customBody,
  setCustomBody,
  generatedDoc,
  docLoading,
  onGenerateDoc,
  language = 'en'
}) {
  const [enableHighlight, setEnableHighlight] = useState(true);

  if (!kbEntry) return null;

  const isHi = language === 'hi';
  const t = TRANSLATIONS[language]?.noticeTab || TRANSLATIONS.en.noticeTab;

  const defaultBodyPreview = customBody || (isHi 
    ? `1. मामले के तथ्य (STATEMENT OF FACTS):\nअधोहस्ताक्षरी का निवेदन है कि ${kbEntry.act_name} के तहत कानूनी विवाद उत्पन्न हुआ है...` 
    : `1. STATEMENT OF FACTS:\nA dispute has arisen regarding ${kbEntry.issue_type?.replace(/_/g, ' ')}...`
  );

  const handleToneSelect = (newTone) => {
    setDocTone(newTone);
    const draft = generateDraftForTone(newTone, kbEntry, isHi);
    setCustomSubject(draft.subject);
    setCustomBody(draft.body);
  };

  return (
    <motion.div 
      className="tab-content-stack"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      {/* Highlighting Toolbar for Notice Section */}
      <div className="highlight-toolbar glass-card">
        <div className="toolbar-left">
          <Highlighter size={18} className="icon-accent-purple" />
          <span className="toolbar-title">
            {isHi ? 'कानूनी नोटिस में मुख्य कानूनी शब्द हाइलाइट करें' : 'Highlight Important Words in Legal Notice'}
          </span>
        </div>
        <label className="toggle-switch-label">
          <span className="toggle-label-text">{enableHighlight ? (isHi ? 'हाइलाइट चालू' : 'Highlights ON') : (isHi ? 'हाइलाइट बंद' : 'Highlights OFF')}</span>
          <div className="toggle-switch">
            <input 
              type="checkbox" 
              checked={enableHighlight} 
              onChange={e => setEnableHighlight(e.target.checked)} 
            />
            <span className="switch-slider"></span>
          </div>
        </label>
      </div>

      <div className="tab-content-grid notice-tab-layout">
        {/* Form Inputs & Full Body Editor Panel */}
        <div className="glass-card panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <FileText size={22} className="icon-accent-purple" />
              {t.title}
            </div>
          </div>

          <div className="form-sections">
            <div className="form-group">
              <label className="form-label">{t.styleTone}</label>
              <div className="tone-grid">
                <motion.button 
                  type="button"
                  className={`tone-card ${docTone === 'request' ? 'active' : ''}`}
                  onClick={() => handleToneSelect('request')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="tone-title">{t.politeTitle}</div>
                  <div className="tone-desc">{t.politeDesc}</div>
                </motion.button>
                <motion.button 
                  type="button"
                  className={`tone-card ${docTone === 'formal_notice' ? 'active' : ''}`}
                  onClick={() => handleToneSelect('formal_notice')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="tone-title">{t.formalTitle}</div>
                  <div className="tone-desc">{t.formalDesc}</div>
                </motion.button>
              </div>
            </div>

            {/* Parties Personal Details */}
            <div className="form-inputs-grid">
              <div className="form-group">
                <label className="form-label">{t.complainantNameLabel}</label>
                <input
                  type="text"
                  placeholder={t.complainantNamePlaceholder}
                  className="input-styled"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.complainantAddrLabel}</label>
                <input
                  type="text"
                  placeholder={t.complainantAddrPlaceholder}
                  className="input-styled"
                  value={userAddress}
                  onChange={e => setUserAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.opposingNameLabel}</label>
                <input
                  type="text"
                  placeholder={t.opposingNamePlaceholder}
                  className="input-styled"
                  value={opposingName}
                  onChange={e => setOpposingName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.opposingAddrLabel}</label>
                <input
                  type="text"
                  placeholder={t.opposingAddrPlaceholder}
                  className="input-styled"
                  value={opposingAddress}
                  onChange={e => setOpposingAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Editable Notice Subject */}
            <div className="form-group">
              <label className="form-label">{t.subjectLabel}:</label>
              <input
                type="text"
                className="input-styled"
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
              />
            </div>

            {/* Editable Full Legal Notice Content / Body Textarea */}
            <div className="form-group">
              <label className="form-label">{t.bodyLabel}:</label>
              <textarea
                className="intake-textarea notice-body-textarea"
                rows={10}
                value={customBody}
                onChange={e => setCustomBody(e.target.value)}
                placeholder="Edit the complete legal notice body, add specific invoice numbers, dates, or custom terms..."
              />
            </div>

            <div className="editor-actions-row" style={{ display: 'flex', gap: '0.75rem' }}>
              <motion.button 
                className="btn-primary btn-notice-generate glow-effect" 
                onClick={onGenerateDoc}
                disabled={docLoading}
                style={{ flex: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {docLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    {t.generatingBtn}
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    {t.generateBtn}
                  </>
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {generatedDoc && (
                <motion.div 
                  className="doc-success-banner"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="banner-left">
                    <CheckCircle2 size={20} className="icon-emerald" />
                    <div>
                      <div className="banner-title">Edited Legal PDF Generated!</div>
                      <div className="banner-sub">{generatedDoc.filename}</div>
                    </div>
                  </div>
                  <motion.a 
                    href={generatedDoc.download_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-emerald btn-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download size={15} /> {t.downloadBtn}
                  </motion.a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Live Real-Time PDF Paper Blueprint Mockup */}
        <div className="glass-card panel-card pdf-preview-card">
          <div className="panel-header">
            <div className="panel-title">
              <FileCheck size={20} className="icon-accent-blue" />
              Live Document Blueprint Preview
            </div>
          </div>

          <motion.div 
            className="pdf-sheet"
            whileHover={{ y: -3, boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="pdf-header">
              <HighlightText 
                text={docTone === 'request' ? 'REQUISITION & REFUND REQUEST NOTICE' : 'FORMAL STATUTORY LEGAL NOTICE'} 
                enableHighlight={enableHighlight} 
              />
            </div>
            <div className="pdf-divider"></div>
            <div className="pdf-meta">
              <div><strong>FROM:</strong> {userName || '[YOUR NAME]'} ({userAddress || '[YOUR ADDRESS]'})</div>
              <div><strong>TO:</strong> {opposingName || '[OPPOSING PARTY]'} ({opposingAddress || '[OPPOSING ADDRESS]'})</div>
              <div><strong>DATE:</strong> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
            <div className="pdf-body-preview">
              <p>
                <strong>SUBJECT:</strong>{' '}
                <HighlightText 
                  text={customSubject || `STATUTORY DEMAND NOTICE UNDER ${kbEntry.act_name.toUpperCase()}`} 
                  enableHighlight={enableHighlight} 
                />
              </p>
              <br />
              <p>Sir / Madam,</p>
              <div className="live-preview-body">
                <HighlightText 
                  text={defaultBodyPreview} 
                  enableHighlight={enableHighlight} 
                />
              </div>
            </div>
            <div className="pdf-watermark">LEGAL DRAFT</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
