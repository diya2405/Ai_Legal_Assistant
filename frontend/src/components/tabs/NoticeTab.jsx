import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, RefreshCw, FileCheck, CheckCircle2, Download } from 'lucide-react';

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
  onGenerateDoc
}) {
  if (!kbEntry) return null;

  return (
    <motion.div 
      className="tab-content-grid notice-tab-layout"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      {/* Form Inputs & Full Body Editor Panel */}
      <div className="glass-card panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <FileText size={22} className="icon-accent-purple" />
            Configure & Edit Statutory Legal Notice
          </div>
          <span className="badge badge-purple">100% Fully Editable</span>
        </div>

        <div className="form-sections">
          <div className="form-group">
            <label className="form-label">Notice Style Tone:</label>
            <div className="tone-grid">
              <motion.button 
                type="button"
                className={`tone-card ${docTone === 'request' ? 'active' : ''}`}
                onClick={() => setDocTone('request')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="tone-title">Polite Requisition Notice</div>
                <div className="tone-desc">Diplomatic request before initiating legal action</div>
              </motion.button>
              <motion.button 
                type="button"
                className={`tone-card ${docTone === 'formal_notice' ? 'active' : ''}`}
                onClick={() => setDocTone('formal_notice')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="tone-title">Formal Statutory Notice</div>
                <div className="tone-desc">Strict legal demand with explicit litigation warning</div>
              </motion.button>
            </div>
          </div>

          {/* Parties Personal Details */}
          <div className="form-inputs-grid">
            <div className="form-group">
              <label className="form-label">Complainant / Litigant Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                className="input-styled"
                value={userName}
                onChange={e => setUserName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Complainant Address</label>
              <input
                type="text"
                placeholder="e.g. Indiranagar, Bangalore"
                className="input-styled"
                value={userAddress}
                onChange={e => setUserAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Opposing Party / Entity Name</label>
              <input
                type="text"
                placeholder="e.g. Landlord / Retail Store Manager"
                className="input-styled"
                value={opposingName}
                onChange={e => setOpposingName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Opposing Party Address</label>
              <input
                type="text"
                placeholder="e.g. MG Road, Bangalore"
                className="input-styled"
                value={opposingAddress}
                onChange={e => setOpposingAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Editable Notice Subject */}
          <div className="form-group">
            <label className="form-label">Notice Subject Line (Editable):</label>
            <input
              type="text"
              className="input-styled"
              value={customSubject}
              onChange={e => setCustomSubject(e.target.value)}
            />
          </div>

          {/* Editable Full Legal Notice Content / Body Textarea */}
          <div className="form-group">
            <label className="form-label">Editable Statutory Notice Body Content (Full Text):</label>
            <textarea
              className="intake-textarea notice-body-textarea"
              rows={10}
              value={customBody}
              onChange={e => setCustomBody(e.target.value)}
              placeholder="Edit the complete legal notice body, add specific invoice numbers, dates, or custom terms..."
            />
          </div>

          <motion.button 
            className="btn-primary btn-notice-generate glow-effect" 
            onClick={onGenerateDoc}
            disabled={docLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {docLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Generating Official Custom Legal PDF...
              </>
            ) : (
              <>
                <FileText size={18} />
                Generate & Download Legal Notice PDF
              </>
            )}
          </motion.button>

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
                    <div className="banner-title">Legal PDF Generated!</div>
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
                  <Download size={15} /> Download PDF
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
          <span className="pill pill-gold">Live Updating</span>
        </div>

        <motion.div 
          className="pdf-sheet"
          whileHover={{ y: -3, boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)' }}
          transition={{ duration: 0.2 }}
        >
          <div className="pdf-header">
            {docTone === 'request' ? 'REQUISITION & REFUND REQUEST NOTICE' : 'FORMAL STATUTORY LEGAL NOTICE'}
          </div>
          <div className="pdf-divider"></div>
          <div className="pdf-meta">
            <div><strong>FROM:</strong> {userName || '[YOUR NAME]'} ({userAddress || '[YOUR ADDRESS]'})</div>
            <div><strong>TO:</strong> {opposingName || '[OPPOSING PARTY]'} ({opposingAddress || '[OPPOSING ADDRESS]'})</div>
            <div><strong>DATE:</strong> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
          <div className="pdf-body-preview">
            <p><strong>SUBJECT:</strong> {customSubject || `STATUTORY DEMAND NOTICE UNDER ${kbEntry.act_name.toUpperCase()}`}</p>
            <br />
            <p>Sir / Madam,</p>
            <div className="live-preview-body">
              {customBody || `1. STATEMENT OF FACTS:\nA dispute has arisen regarding ${kbEntry.issue_type?.replace(/_/g, ' ')}...`}
            </div>
          </div>
          <div className="pdf-watermark">LEGAL DRAFT</div>
        </motion.div>
      </div>

    </motion.div>
  );
}
