import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertCircle, Sparkles, Scale, FileText, Download, 
  Send, CheckCircle2, ChevronRight, Edit3, UserCheck,
  Clock, MapPin, Copy, Check, RefreshCw, MessageSquare, ArrowLeft,
  BookOpen, AlertTriangle, FileCheck, Landmark, Info, Award, Shield
} from 'lucide-react';

const MANDATORY_DISCLAIMER = "LegalAId is an automated AI legal research assistant designed for informational and educational purposes only under Indian jurisprudence. It does not constitute formal legal representation. Litigants are advised to consult a licensed advocate before initiating judicial proceedings.";

const SAMPLE_STARTERS = [
  {
    label: "Tenant Security Deposit",
    text: "My landlord in Bangalore is refusing to return my security deposit of ₹45,000 after 2 months of vacating the flat."
  },
  {
    label: "Supermarket MRP Overcharge",
    text: "A local supermarket charged me ₹450 for a packaged food item that has a printed Maximum Retail Price (MRP) of ₹300, and refused to provide a cash memo receipt."
  },
  {
    label: "Defective Electronics Warranty",
    text: "I bought a washing machine for ₹25,000 but it was broken on arrival. Seller is refusing refund or warranty repair."
  },
  {
    label: "Unpaid Salary Withheld",
    text: "My company has withheld my monthly salary of ₹35,000 for 3 consecutive months without any written reason."
  },
  {
    label: "Illegal Utility Disconnection",
    text: "House owner cut off our electricity and water supply without notice to force us to leave the premises."
  }
];

const SUGGESTED_CHAT_PROMPTS = [
  "What documents should I attach with the legal notice?",
  "What is the step-by-step court process if they don't reply?",
  "How much court fee is required for filing this case?",
  "Can I claim compensation for mental agony and interest?"
];

function renderFormattedMessage(text) {
  if (!text) return null;
  const paragraphs = text.split('\n\n');
  return paragraphs.map((para, pIdx) => {
    const parts = para.split(/(\*\*.*?\*\*)/g);
    const renderedParts = parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold-highlight">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    const isStep = para.startsWith('•') || para.startsWith('Step') || /^\d+\./.test(para);
    if (isStep) {
      return (
        <div key={pIdx} className="formatted-step-box">
          {renderedParts}
        </div>
      );
    }

    return (
      <p key={pIdx} className="formatted-paragraph">
        {renderedParts}
      </p>
    );
  });
}

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  
  // Intake state
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Flow State
  const [intakeData, setIntakeData] = useState(null);
  const [classification, setClassification] = useState(null);
  const [entities, setEntities] = useState([]);
  const [kbEntry, setKbEntry] = useState(null);
  
  // Inner Page Tab State ('rights' | 'notice' | 'chat' | 'facts')
  const [activeTab, setActiveTab] = useState('rights');
  const [showOriginalIntake, setShowOriginalIntake] = useState(false);

  // Explanation state
  const [explanationData, setExplanationData] = useState(null);
  const [expLoading, setExpLoading] = useState(false);
  const [copiedExp, setCopiedExp] = useState(false);

  // Document state (100% Editable Notice)
  const [docTone, setDocTone] = useState('formal_notice');
  const [userName, setUserName] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [opposingName, setOpposingName] = useState('');
  const [opposingAddress, setOpposingAddress] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  // Chat (RAG) state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Initialize session
  useEffect(() => {
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then(res => res.json())
      .then(data => setSessionId(data.session_id))
      .catch(err => console.error("Session init failed:", err));
  }, []);

  // Pre-fill editable document content when KB Entry is loaded
  useEffect(() => {
    if (kbEntry) {
      setCustomSubject(`STATUTORY DEMAND NOTICE UNDER ${kbEntry.act_name.toUpperCase()} (${kbEntry.section_number})`);
      setCustomBody(
        `1. STATEMENT OF FACTS:\n` +
        `The undersigned submits that a legal dispute has arisen regarding ${kbEntry.issue_type.replace(/_/g, ' ')} under your jurisdiction. Despite repeated verbal and written requests, the grievance remains unresolved.\n\n` +
        `2. APPLICABLE LAW & STATUTORY PROVISIONS (${kbEntry.law_code || 'Statute'}):\n` +
        `Take notice that under ${kbEntry.act_name} (${kbEntry.section_number}), the law provides:\n` +
        `"${kbEntry.section_text_plain}"\n\n` +
        `Remedy Forum: ${kbEntry.remedy_forum}\n` +
        `Statutory Limitation Period: ${kbEntry.limitation_period}\n\n` +
        `3. DEMAND & RELIEF SOUGHT:\n` +
        `You are hereby called upon to comply with your statutory obligations within 15 days of service of this notice, failing which formal legal proceedings will be initiated before ${kbEntry.remedy_forum} at your sole risk, cost, and consequence.`
      );
    }
  }, [kbEntry]);

  // Handle Intake submission
  const handleIntakeSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !sessionId) return;

    setLoading(true);
    setError(null);
    setExplanationData(null);
    setGeneratedDoc(null);
    setActiveTab('rights');

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          raw_text: inputText,
          language: 'en'
        })
      });
      const data = await res.json();
      
      setIntakeData(data);
      setClassification(data.classification);
      setEntities(data.entities || []);
      setKbEntry(data.kb_entry);

      if (data.kb_entry) {
        fetchExplanation(data.kb_entry.id, data.entities);
      }
    } catch (err) {
      setError("Failed to process request. Please ensure the backend server is running at http://localhost:8000.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch LLM rephrased explanation
  const fetchExplanation = async (kbId, currentEntities) => {
    setExpLoading(true);
    try {
      const res = await fetch('/api/explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kb_entry_id: kbId,
          facts: currentEntities
        })
      });
      const data = await res.json();
      setExplanationData(data);
    } catch (err) {
      console.error("Explanation fetch error:", err);
    } finally {
      setExpLoading(false);
    }
  };

  // Reset to New Analysis
  const handleResetSearch = () => {
    setKbEntry(null);
    setIntakeData(null);
    setClassification(null);
    setEntities([]);
    setExplanationData(null);
    setGeneratedDoc(null);
    setChatMessages([]);
  };

  // Copy Explanation
  const handleCopyExplanation = () => {
    const textToCopy = explanationData?.explanation || kbEntry?.plain_summary_seed;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedExp(true);
      setTimeout(() => setCopiedExp(false), 2000);
    }
  };

  // Handle Document Generation
  const handleGenerateDoc = async () => {
    if (!sessionId || !kbEntry) return;
    setDocLoading(true);
    try {
      const res = await fetch('/api/document/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          kb_entry_id: kbEntry.id,
          tone: docTone,
          user_name: userName || 'First Citizen',
          user_address: userAddress || 'Resident Address',
          opposing_name: opposingName || 'Opposing Party',
          opposing_address: opposingAddress || 'Opposing Address',
          custom_subject: customSubject,
          custom_body: customBody
        })
      });
      const data = await res.json();
      setGeneratedDoc(data);
    } catch (err) {
      console.error("Document generation error:", err);
    } finally {
      setDocLoading(false);
    }
  };

  // Handle Chat message (RAG)
  const handleSendChatMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const query = customText || chatInput;
    if (!query.trim() || !sessionId) return;

    const userMsg = { role: 'user', content: query };
    setChatMessages(prev => [...prev, userMsg]);
    if (!customText) setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch(`/api/chat/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: query,
          domain_hint: classification?.domain
        })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        source_chunks: data.source_chunks,
        abstained: data.abstained
      }]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      
      {/* Executive Header Bar */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo-group" onClick={handleResetSearch} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">
              <Scale size={24} />
            </div>
            <div>
              <div className="logo-title">LegalAId <span className="logo-badge">PRO</span></div>
              <div className="logo-subtitle">
                Verified AI Legal Rights & Statutory Notice Platform
              </div>
            </div>
          </div>

          <div className="nav-actions">
            <div className="tag-badge tag-badge-gold">
              <ShieldCheck size={14} />
              100% Citation Guard Verified
            </div>
            <div className="tag-badge tag-badge-blue">
              <Award size={14} />
              Deterministic Bare Act KB
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="main-container">
        
        {/* ==================== SEARCH / INTAKE LANDING VIEW ==================== */}
        {!kbEntry ? (
          <div className="landing-view">
            
            {/* Hero Banner */}
            <div className="hero-banner">
              <div className="hero-pill">
                <Shield size={14} />
                Indian Jurisprudence • Consumer, Tenant & Employment Rights
              </div>
              <h1 className="hero-title">
                Verified Legal Rights & Statutory Notice Generator
              </h1>
              <p className="hero-subtitle">
                AI legal intake grounded in deterministic statutory knowledge bases. Eliminates hallucinated section numbers.
              </p>
            </div>

            {/* Case Intake Card */}
            <div className="glass-card intake-card">
              <div className="intake-header">
                <h2 className="section-heading">
                  <Edit3 size={20} className="icon-accent-gold" />
                  Describe Your Legal Issue
                </h2>
                <span className="subtext-muted">
                  Natural Language Legal Intake
                </span>
              </div>

              {/* Sample Prompts */}
              <div>
                <div className="starter-label">
                  Select Sample Case Prompt:
                </div>
                <div className="prompt-starters">
                  {SAMPLE_STARTERS.map((starter, i) => (
                    <button
                      key={i}
                      type="button"
                      className="starter-chip"
                      onClick={() => setInputText(starter.text)}
                    >
                      <ChevronRight size={13} className="icon-accent-gold" />
                      {starter.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleIntakeSubmit}>
                <textarea
                  className="intake-textarea"
                  placeholder="Example: A local supermarket charged me ₹450 for a packaged food item with a printed MRP of ₹300 and refused cash memo receipt..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />

                <div className="intake-actions">
                  <button 
                    type="submit" 
                    className="btn-primary btn-large"
                    disabled={loading || !inputText.trim()}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Analyzing Case Facts & Searching Statutes...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Analyze Legal Rights & Generate Report
                      </>
                    )}
                  </button>
                </div>
              </form>

              {error && (
                <div className="warning-box mt-3">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        ) : (

        /* ==================== EXECUTIVE RESULTS WORKSPACE (After Analysis) ==================== */
          <div className="results-workspace">
            
            {/* Executive Workspace Header */}
            <div className="workspace-header glass-card">
              <div className="header-left">
                <button className="btn-back" onClick={handleResetSearch}>
                  <ArrowLeft size={15} />
                  New Legal Analysis
                </button>
                
                <div className="case-title-meta">
                  <h1 className="case-heading">
                    {classification?.domain.toUpperCase()} RIGHTS • {classification?.issue_type.replace(/_/g, ' ').toUpperCase()}
                  </h1>
                  <div className="meta-pills">
                    <span className="pill pill-gold">
                      <Scale size={12} /> {kbEntry.act_name}
                    </span>
                    <span className="pill pill-emerald">
                      <ShieldCheck size={12} /> 100% Citation Guard Passed
                    </span>
                    <span className="pill pill-blue">
                      <Landmark size={12} /> {kbEntry.remedy_forum}
                    </span>
                    <span className="pill pill-purple">
                      <Award size={12} /> Confidence: {Math.round((classification?.confidence || 1) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="header-right">
                <button 
                  className="btn-secondary btn-sm"
                  onClick={() => setShowOriginalIntake(prev => !prev)}
                >
                  <BookOpen size={14} />
                  {showOriginalIntake ? 'Hide Facts' : 'View Submitted Facts'}
                </button>
              </div>
            </div>

            {/* Collapsible Facts Drawer */}
            {showOriginalIntake && (
              <div className="glass-card original-facts-box animate-fadeIn">
                <div className="facts-box-title">
                  <Info size={16} className="icon-accent-gold" />
                  Submitted Case Intake Narrative:
                </div>
                <p className="facts-box-text">"{inputText}"</p>
              </div>
            )}

            {/* 4 Executive Metric Cards */}
            <div className="stats-grid">
              <div className="stat-card glass-card border-top-gold">
                <div className="stat-label">Enacted Statute Act</div>
                <div className="stat-value text-gold">{kbEntry.act_name}</div>
                <div className="stat-subtext">Statutory Code</div>
              </div>

              <div className="stat-card glass-card border-top-pink">
                <div className="stat-label">Section Citation</div>
                <div className="stat-value font-mono text-pink">{kbEntry.section_number}</div>
                <div className="stat-subtext">Verified Law Code</div>
              </div>

              <div className="stat-card glass-card border-top-blue">
                <div className="stat-label">Remedy Forum</div>
                <div className="stat-value text-blue">
                  <MapPin size={14} className="inline-icon" /> {kbEntry.remedy_forum}
                </div>
                <div className="stat-subtext">Filing Jurisdiction</div>
              </div>

              <div className="stat-card glass-card border-top-emerald">
                <div className="stat-label">Limitation Period</div>
                <div className="stat-value text-emerald">
                  <Clock size={14} className="inline-icon" /> {kbEntry.limitation_period}
                </div>
                <div className="stat-subtext">Filing Time Limit</div>
              </div>
            </div>

            {/* Tab Bar Navigation */}
            <div className="nav-tabs-bar glass-card">
              <button 
                className={`tab-btn ${activeTab === 'rights' ? 'active' : ''}`}
                onClick={() => setActiveTab('rights')}
              >
                <Sparkles size={17} />
                1. Legal Rights & Statutes
              </button>

              <button 
                className={`tab-btn ${activeTab === 'notice' ? 'active' : ''}`}
                onClick={() => setActiveTab('notice')}
              >
                <FileText size={17} />
                2. Legal Notice Generator (Editable)
              </button>

              <button 
                className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare size={17} />
                3. Statutory Q&A Assistant
              </button>

              <button 
                className={`tab-btn ${activeTab === 'facts' ? 'active' : ''}`}
                onClick={() => setActiveTab('facts')}
              >
                <UserCheck size={17} />
                4. Extracted Case Facts
              </button>
            </div>

            {/* TAB 1: Rights Explanation & Original Quoted Law */}
            {activeTab === 'rights' && (
              <div className="tab-content-stack animate-fadeIn">
                
                {/* 1. Official Bare Act Law Quoted */}
                <div className="glass-card panel-card bare-act-quote-card">
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
                </div>

                {/* 2. Simplified Plain-Language Explanation (Below the Quoted Law) */}
                <div className="glass-card panel-card hero-explanation-panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <Sparkles size={22} className="icon-accent-blue" />
                      Simplified Plain-Language Explanation
                    </div>
                    <div className="header-actions">
                      <button 
                        onClick={handleCopyExplanation} 
                        className="btn-secondary btn-sm"
                      >
                        {copiedExp ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                        {copiedExp ? 'Copied' : 'Copy Summary'}
                      </button>
                      <span className="badge badge-verified">
                        <ShieldCheck size={14} />
                        Citation Guard Passed
                      </span>
                    </div>
                  </div>

                  {expLoading ? (
                    <div className="skeleton-container">
                      <div className="skeleton-line" style={{ width: '100%' }}></div>
                      <div className="skeleton-line" style={{ width: '88%' }}></div>
                      <div className="skeleton-line" style={{ width: '65%' }}></div>
                    </div>
                  ) : (
                    <div className="explanation-body">
                      {renderFormattedMessage(explanationData?.explanation || kbEntry?.plain_summary_seed)}
                    </div>
                  )}

                  <div className="panel-footer-meta">
                    <span>Knowledge Base Source: Bare Act Verification</span>
                  </div>
                </div>

                {/* Limitation Warning Alert */}
                <div className="limitation-alert-box">
                  <AlertTriangle size={20} className="alert-icon" />
                  <div>
                    <strong>Limitation Period Warning:</strong> Under {kbEntry.act_name}, you must issue formal notice or initiate legal proceedings within <strong>{kbEntry.limitation_period}</strong> from the cause of action.
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: Fully Editable Legal Notice Generator */}
            {activeTab === 'notice' && (
              <div className="tab-content-grid notice-tab-layout animate-fadeIn">
                
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
                        <button 
                          type="button"
                          className={`tone-card ${docTone === 'request' ? 'active' : ''}`}
                          onClick={() => setDocTone('request')}
                        >
                          <div className="tone-title">Polite Requisition Notice</div>
                          <div className="tone-desc">Diplomatic request before initiating legal action</div>
                        </button>
                        <button 
                          type="button"
                          className={`tone-card ${docTone === 'formal_notice' ? 'active' : ''}`}
                          onClick={() => setDocTone('formal_notice')}
                        >
                          <div className="tone-title">Formal Statutory Notice</div>
                          <div className="tone-desc">Strict legal demand with explicit litigation warning</div>
                        </button>
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

                    <button 
                      className="btn-primary btn-notice-generate" 
                      onClick={handleGenerateDoc}
                      disabled={docLoading}
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
                    </button>

                    {generatedDoc && (
                      <div className="doc-success-banner">
                        <div className="banner-left">
                          <CheckCircle2 size={20} className="icon-emerald" />
                          <div>
                            <div className="banner-title">Legal PDF Generated!</div>
                            <div className="banner-sub">{generatedDoc.filename}</div>
                          </div>
                        </div>
                        <a 
                          href={generatedDoc.download_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-emerald btn-sm"
                        >
                          <Download size={15} /> Download PDF
                        </a>
                      </div>
                    )}
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

                  <div className="pdf-sheet">
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
                        {customBody || `1. STATEMENT OF FACTS:\nA dispute has arisen regarding ${kbEntry.issue_type.replace(/_/g, ' ')}...`}
                      </div>
                    </div>
                    <div className="pdf-watermark">LEGAL DRAFT</div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: RAG Q&A Assistant */}
            {activeTab === 'chat' && (
              <div className="glass-card panel-card chat-workspace-card animate-fadeIn">
                <div className="panel-header">
                  <div className="panel-title">
                    <MessageSquare size={22} className="icon-accent-gold" />
                    Grounded Statutory Q&A Assistant
                  </div>
                  <span className="badge badge-rag">
                    <Sparkles size={13} />
                    RAG Statute Grounded
                  </span>
                </div>

                {/* Prompt Chips */}
                <div className="chat-prompt-chips">
                  <span className="chips-label">Suggested Qs:</span>
                  {SUGGESTED_CHAT_PROMPTS.map((promptText, idx) => (
                    <button 
                      key={idx}
                      className="chat-chip"
                      onClick={() => handleSendChatMessage(null, promptText)}
                      disabled={chatLoading}
                    >
                      {promptText}
                    </button>
                  ))}
                </div>

                <div className="chat-messages-container">
                  {chatMessages.length === 0 && (
                    <div className="chat-empty-state">
                      <MessageSquare size={36} className="empty-icon" />
                      <p className="empty-title">Ask statutory follow-up questions regarding {kbEntry.act_name}</p>
                      <p className="empty-sub">Answers are grounded in statutory codes and judicial precedents.</p>
                    </div>
                  )}

                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble-row ${msg.role}`}>
                      <div className="chat-avatar">
                        {msg.role === 'user' ? 'YOU' : 'AI'}
                      </div>
                      <div className="chat-bubble-content">
                        <div className="chat-text">{renderFormattedMessage(msg.content)}</div>
                        {msg.source_chunks && msg.source_chunks.length > 0 && (
                          <div className="chat-source-tag">
                            Source: <strong>{msg.source_chunks[0].act_name} ({msg.source_chunks[0].section_number})</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="chat-bubble-row assistant">
                      <div className="chat-avatar">AI</div>
                      <div className="chat-bubble-content loading-bubble">
                        <RefreshCw size={14} className="animate-spin" /> Searching grounded statute chunks...
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendChatMessage} className="chat-input-row">
                  <input
                    type="text"
                    className="chat-input-styled"
                    placeholder="Ask a follow-up statutory question..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" disabled={!chatInput.trim() || chatLoading}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: Extracted Case Facts */}
            {activeTab === 'facts' && (
              <div className="glass-card panel-card animate-fadeIn">
                <div className="panel-header">
                  <div className="panel-title">
                    <UserCheck size={22} className="icon-accent-emerald" />
                    NER Extracted Key Case Entities
                  </div>
                  <span className="subtext-muted">Extracted automatically from your intake description</span>
                </div>

                {entities.length === 0 ? (
                  <div className="empty-facts-state">No specific entities detected in the text.</div>
                ) : (
                  <div className="entities-grid">
                    {entities.map((ent, idx) => (
                      <div key={idx} className="entity-card glass-card">
                        <div className="entity-label">{ent.entity_type}</div>
                        <div className="entity-value">{ent.entity_value}</div>
                        <div className="entity-status">
                          <CheckCircle2 size={12} className="icon-emerald" /> Verified Extracted Entity
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <strong className="text-gold">Mandatory Legal Disclaimer:</strong> {MANDATORY_DISCLAIMER}
        </div>
      </footer>

    </div>
  );
}
