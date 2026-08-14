import React from 'react';
import { motion } from 'framer-motion';
import { Edit3, ChevronRight, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { getSampleStarters } from '../data/constants';
import { TRANSLATIONS } from '../data/translations';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.08
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 }
  }
};

const childVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function LandingView({
  inputText,
  setInputText,
  onSubmit,
  loading,
  error,
  language = 'en'
}) {
  const t = TRANSLATIONS[language]?.landing || TRANSLATIONS.en.landing;
  const starters = getSampleStarters(language);

  return (
    <motion.div 
      className="landing-view"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Case Intake Card */}
      <motion.div className="glass-card intake-card" variants={childVariants}>
        <div className="intake-header">
          <h2 className="section-heading">
            <Edit3 size={20} className="icon-accent-gold" />
            {t.intakeHeading}
          </h2>
          <span className="subtext-muted">
            {t.intakeSubtext}
          </span>
        </div>

        {/* Demo Sample Prompts */}
        <div>
          <div className="starter-label">
            {t.selectSample}
          </div>
          <div className="prompt-starters">
            {starters.map((starter, i) => (
              <motion.button
                key={i}
                type="button"
                className="starter-chip"
                onClick={() => setInputText(starter.text)}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(234, 179, 8, 0.15)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronRight size={13} className="icon-accent-gold" />
                {starter.label}
              </motion.button>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <textarea
            className="intake-textarea"
            placeholder={t.textareaPlaceholder}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />

          <div className="intake-actions">
            <motion.button 
              type="submit" 
              className="btn-primary btn-large glow-effect"
              disabled={loading || !inputText.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  {t.analyzingBtn}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {t.analyzeBtn}
                </>
              )}
            </motion.button>
          </div>
        </form>

        {error && (
          <motion.div 
            className="warning-box mt-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
