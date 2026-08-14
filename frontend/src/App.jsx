import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Header from './components/Header';
import Footer from './components/Footer';
import LandingView from './components/LandingView';
import WorkspaceHeader from './components/WorkspaceHeader';
import StatCards from './components/StatCards';
import TabBar from './components/TabBar';
import TabFooterNav from './components/TabFooterNav';
import { getSampleStarters } from './data/constants';

import RightsTab from './components/tabs/RightsTab';
import NoticeTab, { generateDraftForTone } from './components/tabs/NoticeTab';
import ChatTab from './components/tabs/ChatTab';
import FactsTab from './components/tabs/FactsTab';

import HelpDrawerModal from './components/ui/HelpDrawerModal';
import FloatingHelpButton from './components/ui/FloatingHelpButton';
import MissingInfoModal from './components/ui/MissingInfoModal';

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  
  // Intake state
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');

  // Accessibility & Helper Modal State (Image 4)
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [textSize, setTextSize] = useState('normal'); // 'normal' | 'large' | 'xlarge'
  const [elderlyMode, setElderlyMode] = useState(false);

  // Flow & Structured Case State
  const [intakeData, setIntakeData] = useState(null);
  const [classification, setClassification] = useState(null);
  const [entities, setEntities] = useState([]);
  const [kbEntry, setKbEntry] = useState(null);
  const [whyThisLaw, setWhyThisLaw] = useState(null);
  const [missingQuestions, setMissingQuestions] = useState([]);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  
  // Active Tab State ('rights' | 'notice' | 'chat' | 'facts')
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

  // Pre-fill editable document content when KB Entry or tone is loaded
  useEffect(() => {
    if (kbEntry) {
      const isHi = language === 'hi';
      const draft = generateDraftForTone(docTone, kbEntry, isHi);
      setCustomSubject(draft.subject);
      setCustomBody(draft.body);
    }
  }, [kbEntry, language, docTone]);

  // Helper to ensure valid session ID
  const getOrCreateSessionId = async () => {
    if (sessionId) return sessionId;
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.session_id) {
          setSessionId(data.session_id);
          return data.session_id;
        }
      }
    } catch (e) {
      console.error("Session auto-create failed:", e);
    }
    const fallbackId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    setSessionId(fallbackId);
    return fallbackId;
  };

  // Handle Intake submission
  const handleIntakeSubmit = async (e, directText = null, targetTab = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToProcess = directText || inputText;
    if (!textToProcess.trim()) return;

    setLoading(true);
    setError(null);
    setExplanationData(null);
    setGeneratedDoc(null);

    const activeSessionId = await getOrCreateSessionId();

    const isDevanagari = /[\u0900-\u097F]/.test(textToProcess);
    const targetLanguage = isDevanagari ? 'hi' : language;
    if (isDevanagari && language !== 'hi') {
      setLanguage('hi');
    }

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          raw_text: textToProcess,
          language: targetLanguage
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API response error (${res.status}): ${errText || res.statusText}`);
      }

      const data = await res.json();
      
      setIntakeData(data);
      setClassification(data.classification);
      setEntities(data.entities || []);
      setKbEntry(data.kb_entry);
      setWhyThisLaw(data.why_this_law);

      if (targetTab) {
        setActiveTab(targetTab);
      } else if (!activeTab) {
        setActiveTab('rights');
      }

      if (data.missing_critical_info && data.missing_critical_info.length > 0) {
        setMissingQuestions(data.missing_critical_info);
        setIsMissingModalOpen(true);
      }

      if (data.kb_entry) {
        fetchExplanation(data.kb_entry.id, data.entities, targetLanguage);
      }
    } catch (err) {
      console.error("Intake submission error:", err);
      setError(err.message || "Failed to process legal intake. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    if (!kbEntry && tabId !== 'rights') {
      const starters = getSampleStarters(language);
      const defaultText = starters[0]?.text || 'My landlord is refusing to return my security deposit.';
      setInputText(defaultText);
      handleIntakeSubmit(null, defaultText, tabId);
    }
  };

  // Handle missing details submission
  const handleMissingAnswersSubmit = (answers) => {
    const updatedEntities = [...entities];
    Object.entries(answers).forEach(([key, val]) => {
      if (val && val.trim()) {
        updatedEntities.push({
          entity_type: key,
          entity_value: val.trim(),
          confirmed_by_user: true
        });
      }
    });
    setEntities(updatedEntities);
  };

  // Fetch LLM rephrased explanation
  const fetchExplanation = async (kbId, currentEntities, langOverride) => {
    setExpLoading(true);
    const activeLang = langOverride || language;
    try {
      const res = await fetch('/api/explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kb_entry_id: kbId,
          facts: currentEntities,
          language: activeLang
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
    setWhyThisLaw(null);
    setMissingQuestions([]);
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

  const isHiLang = language === 'hi';
  const currentReadAloudText = explanationData?.explanation || 
    (isHiLang ? (kbEntry?.plain_summary_seed_hi || kbEntry?.plain_summary_seed) : kbEntry?.plain_summary_seed) || 
    (isHiLang 
      ? "सत्यापित कानूनी अधिकार एवं नोटिस प्लेटफ़ॉर्म लीगल ऐड प्रो में आपका स्वागत है। आपके मामले के लिए लागू कानूनों और कानूनी नोटिस की जानकारी यहां उपलब्ध है।" 
      : "Welcome to LegalAId PRO verified statutory legal analysis platform. Here is your legal analysis and verified statutory options.");


  return (
    <div className={`app-wrapper ${textSize !== 'normal' ? 'text-scale-' + textSize : ''} ${elderlyMode ? 'elderly-mode' : ''}`}>
      <Header 
        onReset={handleResetSearch} 
        language={language} 
        setLanguage={setLanguage} 
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="main-container">
        <AnimatePresence mode="wait">
          {!kbEntry ? (
            <LandingView
              key="landing"
              inputText={inputText}
              setInputText={setInputText}
              onSubmit={handleIntakeSubmit}
              loading={loading}
              error={error}
              language={language}
            />
          ) : (
            <motion.div 
              key="results"
              className="results-workspace"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
            >
              <WorkspaceHeader
                classification={classification}
                kbEntry={kbEntry}
                inputText={inputText}
                showOriginalIntake={showOriginalIntake}
                setShowOriginalIntake={setShowOriginalIntake}
                onResetSearch={handleResetSearch}
                language={language}
              />

              <StatCards kbEntry={kbEntry} language={language} />

              <div className="workspace-main-layout">
                <aside className="workspace-sidebar">
                  <TabBar 
                    activeTab={activeTab} 
                    setActiveTab={handleTabSelect} 
                    language={language} 
                    isSidebar={true} 
                    kbEntry={kbEntry}
                  />
                </aside>

                <div className="workspace-tab-content">
                  <AnimatePresence mode="wait">
                    {activeTab === 'rights' && (
                      <RightsTab
                        key="rights"
                        kbEntry={kbEntry}
                        entities={entities}
                        explanationData={explanationData}
                        expLoading={expLoading}
                        copiedExp={copiedExp}
                        onCopyExplanation={handleCopyExplanation}
                        whyThisLaw={whyThisLaw}
                        language={language}
                      />
                    )}

                    {activeTab === 'notice' && (
                      <NoticeTab
                        key="notice"
                        kbEntry={kbEntry}
                        docTone={docTone}
                        setDocTone={setDocTone}
                        userName={userName}
                        setUserName={setUserName}
                        userAddress={userAddress}
                        setUserAddress={setUserAddress}
                        opposingName={opposingName}
                        setOpposingName={setOpposingName}
                        opposingAddress={opposingAddress}
                        setOpposingAddress={setOpposingAddress}
                        customSubject={customSubject}
                        setCustomSubject={setCustomSubject}
                        customBody={customBody}
                        setCustomBody={setCustomBody}
                        generatedDoc={generatedDoc}
                        docLoading={docLoading}
                        onGenerateDoc={handleGenerateDoc}
                        language={language}
                      />
                    )}

                    {activeTab === 'chat' && (
                      <ChatTab
                        key="chat"
                        kbEntry={kbEntry}
                        chatMessages={chatMessages}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        chatLoading={chatLoading}
                        onSendChatMessage={handleSendChatMessage}
                        language={language}
                      />
                    )}

                    {activeTab === 'facts' && (
                      <FactsTab
                        key="facts"
                        entities={entities}
                        language={language}
                      />
                    )}
                  </AnimatePresence>

                  <TabFooterNav 
                    activeTab={activeTab} 
                    setActiveTab={handleTabSelect} 
                    language={language} 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer language={language} />

      {/* Floating Help Trigger Button */}
      <FloatingHelpButton onClick={() => setIsHelpOpen(true)} language={language} />

      {/* Accessibility & Help Assistant Drawer / Modal (Image 4) */}
      <HelpDrawerModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        language={language}
        setLanguage={setLanguage}
        textSize={textSize}
        setTextSize={setTextSize}
        elderlyMode={elderlyMode}
        setElderlyMode={setElderlyMode}
        readAloudText={currentReadAloudText}
      />

      {/* Missing Information Follow-Up Questions Prompt Modal */}
      <MissingInfoModal
        isOpen={isMissingModalOpen}
        onClose={() => setIsMissingModalOpen(false)}
        missingQuestions={missingQuestions}
        onSubmitAnswers={handleMissingAnswersSubmit}
        language={language}
      />
    </div>
  );
}
