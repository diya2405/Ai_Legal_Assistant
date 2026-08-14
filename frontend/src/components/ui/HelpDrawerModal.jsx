import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Volume2, VolumeX, Eye, Languages, PhoneCall, Type } from 'lucide-react';

export default function HelpDrawerModal({
  isOpen,
  onClose,
  language = 'en',
  setLanguage,
  textSize,
  setTextSize,
  elderlyMode,
  setElderlyMode,
  readAloudText
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioFallbackObj, setAudioFallbackObj] = useState(null);

  const isHi = language === 'hi';

  // Dual-Engine Speech Synthesis & Server Proxy TTS Handler (Hindi + English)
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioFallbackObj) {
        audioFallbackObj.pause();
        audioFallbackObj.currentTime = 0;
        setAudioFallbackObj(null);
      }
      setIsPlayingAudio(false);
      return;
    }

    let rawText = readAloudText || (
      isHi 
        ? "लीगल ऐड प्रो में आपका स्वागत है। आपके मामले के लिए लागू कानूनों और कानूनी नोटिस की जानकारी यहां उपलब्ध है।" 
        : "Welcome to Legal A I d PRO. Here is your legal analysis and verified statutory options."
    );
    // Clean HTML tags and markdown symbols so speech synthesis reads cleanly
    const cleanText = rawText.replace(/<[^>]*>/g, '').replace(/[*_#`~]/g, '').trim();

    // Helper for HTML5 Audio fallback using backend proxy /api/tts
    const playBackendTTSFallback = (textToPlay) => {
      try {
        const langParam = isHi ? 'hi' : 'en';
        const url = `/api/tts?text=${encodeURIComponent(textToPlay.substring(0, 800))}&lang=${langParam}`;
        const audio = new Audio(url);
        setAudioFallbackObj(audio);
        audio.play().then(() => {
          setIsPlayingAudio(true);
        }).catch((err) => {
          console.warn("Backend proxy TTS audio playback failed:", err);
          setIsPlayingAudio(false);
        });
        audio.onended = () => {
          setIsPlayingAudio(false);
          setAudioFallbackObj(null);
        };
        audio.onerror = () => {
          console.warn("Backend proxy TTS audio error");
          setIsPlayingAudio(false);
          setAudioFallbackObj(null);
        };
      } catch (e) {
        console.error("Audio fallback exception:", e);
        setIsPlayingAudio(false);
      }
    };

    if (!('speechSynthesis' in window)) {
      playBackendTTSFallback(cleanText);
      return;
    }

    window.speechSynthesis.cancel();

    let voices = window.speechSynthesis.getVoices();

    if (isHi) {
      const hindiVoice = voices.find(v => 
        v.lang.toLowerCase().startsWith('hi') || 
        v.lang.toLowerCase().includes('hindi') || 
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
        utterance.pitch = 1.0;

        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = (err) => {
          console.warn("SpeechSynthesis error for Hindi, falling back to backend proxy TTS:", err);
          playBackendTTSFallback(cleanText);
        };

        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);
          setIsPlayingAudio(true);
        } catch (e) {
          console.warn("SpeechSynthesis speak exception for Hindi, using fallback:", e);
          playBackendTTSFallback(cleanText);
        }
      } else {
        // No native Hindi voice installed in client browser -> use backend proxy TTS!
        playBackendTTSFallback(cleanText);
      }
    } else {
      const englishVoice = voices.find(v => 
        v.lang.toLowerCase().includes('en-in') || 
        v.lang.toLowerCase().includes('en-us') || 
        v.lang.toLowerCase().startsWith('en')
      );

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (englishVoice) {
        utterance.voice = englishVoice;
        utterance.lang = englishVoice.lang;
      } else {
        utterance.lang = 'en-US';
      }
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = (err) => {
        console.warn("SpeechSynthesis error, switching to backend audio fallback:", err);
        playBackendTTSFallback(cleanText);
      };

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      } catch (e) {
        console.warn("SpeechSynthesis exception, switching to backend audio fallback:", e);
        playBackendTTSFallback(cleanText);
      }
    }
  };

  // Warmup and cleanup audio
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay help-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="help-modal-card glass-card"
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="help-modal-header">
            <div className="help-header-title">
              <div className="mint-icon-box">
                <HelpCircle size={22} className="mint-help-icon" />
              </div>
              <h2>{isHi ? 'क्या आपको मदद चाहिए?' : 'Need a little help?'}</h2>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Body Sections */}
          <div className="help-modal-body">
            
            {/* 1. Audio Reader */}
            <div className="help-section-box audio-reader-box">
              <div className="section-title-group">
                <Volume2 size={18} className="icon-emerald" />
                <span className="section-title">{isHi ? 'ऑडियो रीडर' : 'Audio Reader'}</span>
              </div>
              <p className="section-desc">
                {isHi 
                  ? 'अपनी वर्तमान स्क्रीन पर मुख्य पाठ को स्पष्ट रूप से सुनें।' 
                  : 'Listen to the key text on your current screen spoken clearly.'
                }
              </p>
              <motion.button 
                className={`btn-audio-speak ${isPlayingAudio ? 'is-speaking' : ''}`}
                onClick={handleToggleAudio}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX size={18} />
                    <span>{isHi ? 'वाचन रोकें' : 'Pause Reading'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={18} />
                    <Volume2 size={14} className="speaker-second-icon" />
                    <span>{isHi ? 'यह पेज जोर से पढ़ें' : 'Read this page aloud'}</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* 2. Text Size */}
            <div className="help-section-box text-size-box">
              <div className="section-title-group">
                <Type size={18} className="icon-navy" />
                <span className="section-title">{isHi ? 'फ़ॉन्ट आकार' : 'Text Size'}</span>
              </div>
              <div className="text-size-buttons-grid">
                <button 
                  className={`size-btn ${textSize === 'normal' ? 'active' : ''}`}
                  onClick={() => setTextSize && setTextSize('normal')}
                >
                  {isHi ? 'Aa सामान्य' : 'Aa Normal text'}
                </button>
                <button 
                  className={`size-btn ${textSize === 'large' ? 'active' : ''}`}
                  onClick={() => setTextSize && setTextSize('large')}
                >
                  {isHi ? 'A+ बड़ा पाठ' : 'A+ Increase text size'}
                </button>
                <button 
                  className={`size-btn ${textSize === 'xlarge' ? 'active' : ''}`}
                  onClick={() => setTextSize && setTextSize('xlarge')}
                >
                  {isHi ? 'A++ बहुत बड़ा' : 'A++ Large'}
                </button>
              </div>
            </div>

            {/* 3. Easy-to-Read (Elderly) Mode */}
            <div className="help-section-box elderly-mode-box">
              <div className="elderly-row-top">
                <div className="section-title-group">
                  <Eye size={18} className="icon-purple" />
                  <span className="section-title">{isHi ? 'सरल (बुजुर्ग) मोड' : 'Easy-to-Read (Elderly) Mode'}</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={elderlyMode} 
                    onChange={e => setElderlyMode && setElderlyMode(e.target.checked)} 
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>
              <p className="section-desc">
                {isHi 
                  ? 'बटन लेबल को सरल बनाता है, रिक्ति बढ़ाता है, और वरिष्ठ नागरिकों के लिए बड़े टाइपोग्राफी का उपयोग करता है।' 
                  : 'Simplifies button labels, increases spacing, and uses larger typography tailored for elderly users.'
                }
              </p>
            </div>

            {/* 4. Language Switch */}
            <div className="help-section-box language-box">
              <div className="section-title-group">
                <Languages size={18} className="icon-teal" />
                <span className="section-title">{isHi ? 'भाषा / Language' : 'Language / भाषा'}</span>
              </div>
              <div className="lang-buttons-grid">
                <button 
                  className={`lang-choice-btn ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage && setLanguage('en')}
                >
                  ✓ English
                </button>
                <button 
                  className={`lang-choice-btn ${language === 'hi' ? 'active' : ''}`}
                  onClick={() => setLanguage && setLanguage('hi')}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            {/* 5. Free Legal Help Info */}
            <div className="help-section-box legal-aid-info-box">
              <div className="section-title-group">
                <PhoneCall size={18} className="icon-gold-brown" />
                <span className="section-title gold-title">
                  {isHi ? 'निःशुल्क कानूनी सहायता जानकारी प्राप्त करें' : 'Get free legal help info'}
                </span>
              </div>
              <p className="section-desc gold-desc">
                {isHi 
                  ? 'जिला कानूनी सेवाएं प्राधिकरण (DLSA) भारत में पात्र नागरिकों को मुफ्त कानूनी सहायता प्रदान करता है। नालसा हेल्पलाइन 15100 पर कॉल करें।' 
                  : 'District Legal Services Authority (DLSA) provides free legal aid to eligible citizens in India. Call NALSA helpline 15100.'
                }
              </p>
            </div>

          </div>

          {/* Footer Done Button */}
          <div className="help-modal-footer">
            <button className="btn-done-full" onClick={onClose}>
              {isHi ? 'संपन्न (Done)' : 'Done'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
