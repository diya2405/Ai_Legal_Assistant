import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

const TAB_ORDER = ['rights', 'notice', 'chat', 'facts'];

export default function TabFooterNav({ activeTab, setActiveTab, language = 'en' }) {
  const isHi = language === 'hi';
  const t = TRANSLATIONS[language]?.tabs || TRANSLATIONS.en.tabs;

  const currentIndex = TAB_ORDER.indexOf(activeTab);
  const prevTabId = currentIndex > 0 ? TAB_ORDER[currentIndex - 1] : null;
  const nextTabId = currentIndex < TAB_ORDER.length - 1 ? TAB_ORDER[currentIndex + 1] : null;

  const handleNav = (targetTabId) => {
    setActiveTab(targetTabId);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div className="tab-footer-nav glass-card">
      <div className="nav-btn-wrapper left">
        {prevTabId && (
          <motion.button
            type="button"
            className="tab-nav-btn btn-prev"
            onClick={() => handleNav(prevTabId)}
            whileHover={{ scale: 1.02, x: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            <ChevronLeft size={18} />
            <div className="btn-nav-text">
              <span className="nav-step-label">{isHi ? 'पिछला चरण' : 'Previous Step'}</span>
              <span className="nav-tab-title">{t[prevTabId]}</span>
            </div>
          </motion.button>
        )}
      </div>

      <div className="nav-indicator-center">
        <span className="step-count-pill">
          {isHi ? `चरण ${currentIndex + 1} / 4` : `Step ${currentIndex + 1} of 4`}
        </span>
      </div>

      <div className="nav-btn-wrapper right">
        {nextTabId && (
          <motion.button
            type="button"
            className="tab-nav-btn btn-next"
            onClick={() => handleNav(nextTabId)}
            whileHover={{ scale: 1.02, x: 3 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="btn-nav-text align-right">
              <span className="nav-step-label">{isHi ? 'अगला चरण' : 'Next Step'}</span>
              <span className="nav-tab-title">{t[nextTabId]}</span>
            </div>
            <ChevronRight size={18} />
          </motion.button>
        )}
      </div>
    </div>
  );
}
