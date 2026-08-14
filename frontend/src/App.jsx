import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Header from './components/Header';
import Footer from './components/Footer';
import LandingView from './components/LandingView';
import WorkspaceHeader from './components/WorkspaceHeader';
import StatCards from './components/StatCards';
import TabBar from './components/TabBar';

import RightsTab from './components/tabs/RightsTab';
import NoticeTab from './components/tabs/NoticeTab';
import ChatTab from './components/tabs/ChatTab';
import FactsTab from './components/tabs/FactsTab';

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

  // Pre-fill editable document content when KB Entry is loaded
  useEffect(() => {
    if (kbEntry) {
      setCustomSubject(`STATUTORY DEMAND NOTICE UNDER ${kbEntry.act_name.toUpperCase()} (${kbEntry.section_number})`);
      setCustomBody(
        `1. STATEMENT OF FACTS:\n` +
        `The undersigned submits that a legal dispute has arisen regarding ${kbEntry.issue_type?.replace(/_/g, ' ')} under your jurisdiction. Despite repeated verbal and written requests, the grievance remains unresolved.\n\n` +
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
  const handleIntakeSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setExplanationData(null);
    setGeneratedDoc(null);

    const activeSessionId = await getOrCreateSessionId();

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          raw_text: inputText,
          language: 'en'
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
      setActiveTab('rights');

      if (data.kb_entry) {
        fetchExplanation(data.kb_entry.id, data.entities);
      }
    } catch (err) {
      console.error("Intake submission error:", err);
      setError(err.message || "Failed to process legal intake. Please try again.");
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
      <Header onReset={handleResetSearch} />

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
              />

              <StatCards kbEntry={kbEntry} />

              <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

              <AnimatePresence mode="wait">
                {activeTab === 'rights' && (
                  <RightsTab
                    key="rights"
                    kbEntry={kbEntry}
                    explanationData={explanationData}
                    expLoading={expLoading}
                    copiedExp={copiedExp}
                    onCopyExplanation={handleCopyExplanation}
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
                  />
                )}

                {activeTab === 'facts' && (
                  <FactsTab
                    key="facts"
                    entities={entities}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
