import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Sparkles, Copy, Check, ShieldCheck, AlertTriangle, Highlighter, Volume2, VolumeX } from 'lucide-react';
import FormattedText from '../ui/FormattedText';
import ApplicableProvisionsCard from '../ui/ApplicableProvisionsCard';
import DocumentsHelpCard from '../ui/DocumentsHelpCard';
import WhyThisLawCard from '../ui/WhyThisLawCard';
import HighlightText from '../ui/HighlightText';
import { TRANSLATIONS } from '../../data/translations';

export default function RightsTab({
  kbEntry,
  entities = [],
  explanationData,
  expLoading,
  copiedExp,
  onCopyExplanation,
  whyThisLaw,
  language = 'en'
}) {
  const [enableHighlight, setEnableHighlight] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioObj, setAudioObj] = useState(null);

  if (!kbEntry) return null;

  const isHi = language === 'hi';
  const t = TRANSLATIONS[language]?.rightsTab || TRANSLATIONS.en.rightsTab;

  const summaryFallback = (isHi && kbEntry?.plain_summary_seed_hi) 
    ? kbEntry.plain_summary_seed_hi 
    : kbEntry?.plain_summary_seed;

  const textToRead = explanationData?.explanation || summaryFallback;

  const handleAudioToggle = () => {
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (audioObj) {
        audioObj.pause();
        audioObj.currentTime = 0;
        setAudioObj(null);
      }
      setIsPlayingAudio(false);
      return;
    }

    if (!textToRead) return;
    const cleanText = textToRead.replace(/<[^>]*>/g, '').replace(/[*_#`~]/g, '').trim();

    const playBackendTTS = () => {
      try {
        const url = `/api/tts?text=${encodeURIComponent(cleanText.substring(0, 800))}&lang=${isHi ? 'hi' : 'en'}`;
        const audio = new Audio(url);
        setAudioObj(audio);
        audio.play().then(() => setIsPlayingAudio(true)).catch(() => setIsPlayingAudio(false));
        audio.onended = () => { setIsPlayingAudio(false); setAudioObj(null); };
        audio.onerror = () => { setIsPlayingAudio(false); setAudioObj(null); };
      } catch (e) {
        setIsPlayingAudio(false);
      }
    };

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();
      if (isHi) {
        const hindiVoice = voices.find(v => 
          v.lang.toLowerCase().startsWith('hi') || 
          v.name.toLowerCase().includes('hindi') || 
          v.name.toLowerCase().includes('hi-in') ||
          v.name.toLowerCase().includes('kalpana') ||
          v.name.toLowerCase().includes('hemant')
        );
        if (hindiVoice) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.voice = hindiVoice;
          utterance.lang = hindiVoice.lang || 'hi-IN';
          utterance.rate = 0.92;
          utterance.onend = () => setIsPlayingAudio(false);
          utterance.onerror = () => playBackendTTS();
          window.speechSynthesis.speak(utterance);
          setIsPlayingAudio(true);
        } else {
          playBackendTTS();
        }
      } else {
        const englishVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
        const utterance = new SpeechSynthesisUtterance(cleanText);
        if (englishVoice) utterance.voice = englishVoice;
        utterance.rate = 0.92;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => playBackendTTS();
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } else {
      playBackendTTS();
    }
  };

  return (
    <motion.div 
      className="tab-content-stack"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      {/* Word Highlighting Control Toolbar */}
      <div className="highlight-toolbar glass-card">
        <div className="toolbar-left">
          <Highlighter size={18} className="icon-accent-gold" />
          <span className="toolbar-title">
            {isHi ? 'कानूनी धाराओं में महत्वपूर्ण शब्द हाइलाइट करें' : 'Highlight Important Words in Laws'}
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

      {/* 1. Image 1 Reference Component: Applicable Legal Provisions */}
      <ApplicableProvisionsCard 
        kbEntry={kbEntry} 
        language={language} 
        enableHighlight={enableHighlight} 
      />

      {/* 2. "Why This Law?" Fact-to-Law Matching Transparency Feature */}
      <WhyThisLawCard 
        whyThisLaw={whyThisLaw} 
        kbEntry={kbEntry} 
        language={language} 
      />

      {/* 3. Official Bare Act Law Quoted with Keyword Highlighting */}
      <motion.div 
        className="glass-card panel-card bare-act-quote-card"
        whileHover={{ boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)' }}
      >
        <div className="panel-header">
          <div className="panel-title">
            <Scale size={22} className="icon-accent-gold" />
            {t.statutoryQuoteTitle}
          </div>
          <span className="badge badge-code">
            {kbEntry.act_name} ({kbEntry.section_number})
          </span>
        </div>

        <div className="official-law-quote-box">
          <div className="quote-header-tag">{t.verbatimTag}</div>
          <p className="law-quote-text">
            "<HighlightText text={kbEntry.section_text_plain} enableHighlight={enableHighlight} />"
          </p>
        </div>

        <div className="statute-meta-footer">
          <span>
            <strong>{t.filingForum}</strong>{' '}
            <HighlightText text={kbEntry.remedy_forum} enableHighlight={enableHighlight} />
          </span>
          <span>
            <strong>{t.limitationPeriod}</strong>{' '}
            <HighlightText text={kbEntry.limitation_period} enableHighlight={enableHighlight} />
          </span>
          <span>
            <strong>{t.statutoryCode}</strong>{' '}
            <HighlightText text={kbEntry.law_code || 'Enacted Law'} enableHighlight={enableHighlight} />
          </span>
        </div>
      </motion.div>

      {/* 4. Simplified Plain-Language Explanation */}
      <motion.div className="glass-card panel-card hero-explanation-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Sparkles size={22} className="icon-accent-blue" />
            {t.simplifiedTitle}
          </div>
          <div className="header-actions">
            <motion.button 
              onClick={handleAudioToggle} 
              className={`btn-secondary btn-sm ${isPlayingAudio ? 'is-speaking' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isHi ? "व्याख्या को ऑडियो में सुनें" : "Listen to explanation as audio"}
            >
              {isPlayingAudio ? <VolumeX size={14} color="#059669" /> : <Volume2 size={14} color="#059669" />}
              <span>{isPlayingAudio ? (isHi ? 'रोकें' : 'Pause') : (isHi ? 'सुनें' : 'Listen')}</span>
            </motion.button>
            <motion.button 
              onClick={onCopyExplanation} 
              className="btn-secondary btn-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copiedExp ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              {copiedExp ? t.copied : t.copySummary}
            </motion.button>
            <span className="badge badge-verified">
              <ShieldCheck size={14} />
              {t.citationGuardPassed}
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
            <FormattedText 
              text={explanationData?.explanation || summaryFallback} 
              enableHighlight={enableHighlight}
            />
          </div>
        )}

        <div className="panel-footer-meta">
          <span>{t.kbSource}</span>
        </div>
      </motion.div>

      {/* 5. Image 2 Reference Component: Documents That May Help (Dynamic) */}
      <DocumentsHelpCard 
        kbEntry={kbEntry}
        entities={entities}
        language={language} 
        enableHighlight={enableHighlight} 
      />

      {/* 6. Limitation Warning Alert */}
      <motion.div 
        className="limitation-alert-box"
        whileHover={{ scale: 1.01 }}
      >
        <AlertTriangle size={20} className="alert-icon" />
        <div>
          <strong>{t.limitationWarning}</strong> {t.warningText.replace('{act}', kbEntry.act_name).replace('{limit}', kbEntry.limitation_period)}
        </div>
      </motion.div>

    </motion.div>
  );
}
