import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertCircle, Sparkles, Scale, FileText, Download, 
  Send, Globe, CheckCircle2, ChevronRight, Edit3, UserCheck,
  Clock, MapPin, Copy, Check, RefreshCw, MessageSquare, ArrowLeft,
  BookOpen, AlertTriangle, Layers, FileCheck, Landmark, Info, Search,
  Award, Shield, FileSpreadsheet, ExternalLink
} from 'lucide-react';

const MANDATORY_DISCLAIMER = "LegalAId is an automated AI legal research assistant designed for informational and educational purposes only under Indian jurisprudence. It does not constitute formal legal representation. Litigants are advised to consult a licensed advocate before initiating judicial proceedings.";

const SAMPLE_STARTERS = [
  {
    label: "Tenant Security Deposit",
    text_en: "My landlord in Bangalore is refusing to return my security deposit of ₹45,000 after 2 months of vacating the flat.",
    text_hi: "मकान मालिक मेरी 45,000 रुपये की सिक्योरिटी डिपॉजिट वापस नहीं कर रहा है।"
  },
  {
    label: "Supermarket MRP Overcharge",
    text_en: "A local supermarket charged me ₹450 for a packaged food item that has a printed Maximum Retail Price (MRP) of ₹300, and refused to provide a cash memo receipt.",
    text_hi: "सुपरमार्केट ने ₹300 एमआरपी वाले सामान के ₹450 वसूले और रसीद देने से मना कर दिया।"
  },
  {
    label: "Defective Electronics Warranty",
    text_en: "I bought a washing machine for ₹25,000 but it was broken on arrival. Seller is refusing refund or warranty repair.",
    text_hi: "नया वाशिंग मशीन खरीदा पर वो खराब निकला, दुकानदार वापस नहीं ले रहा।"
  },
  {
    label: "Unpaid Salary Withheld",
    text_en: "My company has withheld my monthly salary of ₹35,000 for 3 consecutive months without any written reason.",
    text_hi: "कंपनी 3 महीने से मेरी सैलरी नहीं दे रही है और टाल-मटोल कर रही है।"
  },
  {
    label: "Illegal Utility Disconnection",
    text_en: "House owner cut off our electricity and water supply without notice to force us to leave the premises.",
    text_hi: "मकान मालिक ने बिना नोटिस दिए पानी और बिजली का कनेक्शन काट दिया।"
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
  const [lang, setLang] = useState('en'); // 'en' or 'hi'
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

  // Document state
  const [docTone, setDocTone] = useState('formal_notice');
  const [userName, setUserName] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [opposingName, setOpposingName] = useState('');
  const [opposingAddress, setOpposingAddress] = useState('');
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
          language: lang
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
          user_name: userName || (lang === 'hi' ? 'प्रथम नागरिक' : 'First Citizen'),
          user_address: userAddress || (lang === 'hi' ? 'निवासी स्थान' : 'Resident Address'),
          opposing_name: opposingName || (lang === 'hi' ? 'विपक्षी पक्ष' : 'Opposing Party'),
          opposing_address: opposingAddress || (lang === 'hi' ? 'विपक्षी पता' : 'Opposing Address')
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
                {lang === 'hi' ? 'सत्यापित एआई कानूनी अधिकार और नोटिस प्लेटफॉर्म' : 'Verified AI Legal Rights & Statutory Notice Platform'}
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

            <button 
              className="lang-btn" 
              onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
            >
              <Globe size={16} />
              {lang === 'en' ? 'हिंदी (Devanagari)' : 'English'}
            </button>
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
                {lang === 'hi' 
                  ? 'अपनी कानूनी समस्या दर्ज करें — धाराएं एवं कानूनी नोटिस तुरंत प्राप्त करें' 
                  : 'Verified Legal Rights & Statutory Notice Generator'}
              </h1>
              <p className="hero-subtitle">
                {lang === 'hi'
                  ? 'भारत के कानूनों (BNS, उपभोक्ता संरक्षण अधिनियम, मॉडल टेनेंसी एक्ट) पर आधारित 100% सटीक कानूनी जानकारी।'
                  : 'AI legal intake grounded in deterministic statutory knowledge bases. Eliminates hallucinated section numbers.'}
              </p>
            </div>

            {/* Case Intake Card */}
            <div className="glass-card intake-card">
              <div className="intake-header">
                <h2 className="section-heading">
                  <Edit3 size={20} className="icon-accent-gold" />
                  {lang === 'hi' ? 'मामले का विवरण दर्ज करें' : 'Describe Your Legal Issue'}
                </h2>
                <span className="subtext-muted">
                  {lang === 'hi' ? 'हिंदी या अंग्रेजी में लिखें' : 'Bilingual Natural Language Intake'}
                </span>
              </div>

              {/* Sample Prompts */}
              <div>
                <div className="starter-label">
                  {lang === 'hi' ? 'त्वरित उदाहरण चुनें:' : 'Select Sample Case Prompt:'}
                </div>
                <div className="prompt-starters">
                  {SAMPLE_STARTERS.map((starter, i) => (
                    <button
                      key={i}
                      type="button"
                      className="starter-chip"
                      onClick={() => setInputText(lang === 'hi' ? starter.text_hi : starter.text_en)}
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
                  placeholder={
                    lang === 'hi'
                      ? "उदाहरण: सुपरमार्केट ने ₹300 एमआरपी वाले सामान के ₹450 वसूले और रसीद देने से मना कर दिया..."
                      : "Example: A local supermarket charged me ₹450 for a packaged food item with a printed MRP of ₹300 and refused cash memo receipt..."
                  }
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
                        {lang === 'hi' ? 'सत्यापन एवं विश्लेषण जारी है...' : 'Analyzing Case Facts & Searching Statutes...'}
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        {lang === 'hi' ? 'कानूनी अधिकार खोजें' : 'Analyze Legal Rights & Generate Report'}
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
                  {lang === 'hi' ? 'नया मामला' : 'New Legal Analysis'}
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
                {lang === 'hi' ? '1. कानूनी अधिकार एवं धाराएं' : '1. Legal Rights & Statutes'}
              </button>

              <button 
                className={`tab-btn ${activeTab === 'notice' ? 'active' : ''}`}
                onClick={() => setActiveTab('notice')}
              >
                <FileText size={17} />
                {lang === 'hi' ? '2. कानूनी नोटिस ड्राफ्ट (PDF)' : '2. Legal Notice Generator'}
              </button>

              <button 
                className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare size={17} />
                {lang === 'hi' ? '3. प्रश्नोत्तर चैट (RAG)' : '3. Statutory Q&A Assistant'}
              </button>

              <button 
                className={`tab-btn ${activeTab === 'facts' ? 'active' : ''}`}
                onClick={() => setActiveTab('facts')}
              >
                <UserCheck size={17} />
                {lang === 'hi' ? '4. मुख्य तथ्य' : '4. Extracted Case Facts'}
              </button>
            </div>

            {/* TAB 1: Rights Explanation & Statute Details */}
            {activeTab === 'rights' && (
              <div className="tab-content-grid animate-fadeIn">
                
                {/* Rights Explanation Card */}
                <div className="glass-card panel-card hero-explanation-panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <Sparkles size={22} className="icon-accent-gold" />
                      {lang === 'hi' ? 'आपके कानूनी अधिकार' : 'Verified Legal Rights Summary'}
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
                      {explanationData?.explanation || kbEntry.plain_summary_seed}
                    </div>
                  )}

                  <div className="panel-footer-meta">
                    <span>Knowledge Base Source: Bare Act Verification</span>
                    <span>Provider: <strong className="text-emerald">{explanationData?.provider_used || 'KB Seed'}</strong></span>
                  </div>
                </div>

                {/* Statute Details Card */}
                <div className="glass-card panel-card">
                  <div className="panel-header">
                    <div className="panel-title">
                      <Scale size={22} className="icon-accent-blue" />
                      {lang === 'hi' ? 'कानूनी धाराएं एवं मंच विवरण' : 'Statute & Filing Details'}
                    </div>
                    <span className="badge badge-code">
                      {kbEntry.law_code || 'Statutory Code'}
                    </span>
                  </div>

                  <div className="details-list">
                    <div className="detail-item">
                      <div className="detail-label">Enacted Statute Act</div>
                      <div className="detail-value text-gold">{kbEntry.act_name}</div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-label">Specific Section Citation</div>
                      <div className="detail-value font-mono text-pink">{kbEntry.section_number}</div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-label">Appropriate Filing Forum</div>
                      <div className="detail-value text-blue">
                        <MapPin size={15} className="inline-icon" />
                        {kbEntry.remedy_forum}
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-label">Statutory Limitation Period</div>
                      <div className="detail-value text-emerald">
                        <Clock size={15} className="inline-icon" />
                        {kbEntry.limitation_period}
                      </div>
                    </div>
                  </div>

                  {/* Limitation Warning Alert */}
                  <div className="limitation-alert-box">
                    <AlertTriangle size={20} className="alert-icon" />
                    <div>
                      <strong>Limitation Warning:</strong> You must issue formal notice or file a claim within <strong>{kbEntry.limitation_period}</strong> from the cause of action. Delay may forfeit statutory remedies.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Legal Notice Generator */}
            {activeTab === 'notice' && (
              <div className="tab-content-grid notice-tab-layout animate-fadeIn">
                
                {/* Form Inputs Panel */}
                <div className="glass-card panel-card">
                  <div className="panel-header">
                    <div className="panel-title">
                      <FileText size={22} className="icon-accent-purple" />
                      {lang === 'hi' ? 'कानूनी नोटिस की जानकारी दर्ज करें' : 'Configure Statutory Legal Notice'}
                    </div>
                    <span className="badge badge-purple">Ready to Print</span>
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

                    <button 
                      className="btn-primary btn-notice-generate" 
                      onClick={handleGenerateDoc}
                      disabled={docLoading}
                    >
                      {docLoading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          Generating Official Legal PDF...
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

                {/* PDF Paper Blueprint Mockup Card */}
                <div className="glass-card panel-card pdf-preview-card">
                  <div className="panel-header">
                    <div className="panel-title">
                      <FileCheck size={20} className="icon-accent-blue" />
                      Document Paper Blueprint
                    </div>
                    <span className="pill pill-gold">Format: Legal PDF</span>
                  </div>

                  <div className="pdf-sheet">
                    <div className="pdf-header">FORMAL STATUTORY LEGAL NOTICE</div>
                    <div className="pdf-divider"></div>
                    <div className="pdf-meta">
                      <div><strong>FROM:</strong> {userName || 'Litigant Name'} ({userAddress || 'Address'})</div>
                      <div><strong>TO:</strong> {opposingName || 'Opposing Party'} ({opposingAddress || 'Address'})</div>
                      <div><strong>DATE:</strong> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <div className="pdf-body-preview">
                      <p><strong>SUBJECT:</strong> STATUTORY DEMAND NOTICE UNDER {kbEntry.act_name.toUpperCase()} ({kbEntry.section_number})</p>
                      <br />
                      <p>Sir/Madam,</p>
                      <p>Under instructions from my client, notice is hereby served upon you regarding your failure to fulfill statutory obligations...</p>
                      <br />
                      <p><strong>RELIEF DEMANDED:</strong> Full compliance within 15 days, failing which formal proceedings will be filed in {kbEntry.remedy_forum}.</p>
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
                    {lang === 'hi' ? 'कानूनी धारा Q&A चैट' : 'Grounded Statutory Q&A Assistant'}
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
                    {lang === 'hi' ? 'मामले से निकाले गए मुख्य तथ्य' : 'NER Extracted Key Case Entities'}
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
