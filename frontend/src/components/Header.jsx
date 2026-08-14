import React from 'react';
import { motion } from 'framer-motion';
import { Scale, ShieldCheck, Languages, HelpCircle } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function Header({ onReset, language = 'en', setLanguage, onOpenHelp }) {
  const t = TRANSLATIONS[language]?.header || TRANSLATIONS.en.header;
  const isHi = language === 'hi';

  return (
    <motion.header 
      className="app-header"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="header-container">
        <motion.div 
          className="logo-group" 
          onClick={onReset} 
          style={{ cursor: 'pointer' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="logo-icon glow-gold">
            <Scale size={24} />
          </div>
          <div>
            <div className="logo-title">
              LegalAId <span className="logo-badge">PRO</span>
            </div>
            <div className="logo-subtitle">
              {t.subtitle}
            </div>
          </div>
        </motion.div>

        <div className="nav-actions">
          {onOpenHelp && (
            <motion.button 
              className="tag-badge tag-badge-teal"
              style={{ cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={onOpenHelp}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isHi ? 'मदद चाहिए?' : 'Need a little help?'}
            >
              <HelpCircle size={15} />
              {isHi ? 'मदद चाहिए?' : 'Need help?'}
            </motion.button>
          )}

          {setLanguage && (
            <motion.button 
              className={`tag-badge ${language === 'hi' ? 'tag-badge-gold' : 'tag-badge-blue'}`}
              style={{ cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setLanguage(prev => prev === 'en' ? 'hi' : 'en')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Switch Language / भाषा बदलें"
            >
              <Languages size={14} />
              {t.switchLang}
            </motion.button>
          )}

          <motion.div 
            className="tag-badge tag-badge-gold"
            whileHover={{ y: -2, boxShadow: '0 4px 15px rgba(234, 179, 8, 0.25)' }}
          >
            <ShieldCheck size={14} />
            {t.citationVerified}
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
