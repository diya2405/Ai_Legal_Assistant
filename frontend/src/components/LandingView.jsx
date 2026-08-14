import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Edit3, ChevronRight, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { SAMPLE_STARTERS } from '../data/constants';

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
  error
}) {
  return (
    <motion.div 
      className="landing-view"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Hero Banner */}
      <motion.div className="hero-banner" variants={childVariants}>
        <motion.div 
          className="hero-pill"
          whileHover={{ scale: 1.05 }}
        >
          <Shield size={14} />
          Indian Jurisprudence • Consumer, Tenant & Employment Rights
        </motion.div>
        <h1 className="hero-title">
          Verified Legal Rights & Statutory Notice Generator
        </h1>
        <p className="hero-subtitle">
          AI legal intake grounded in deterministic statutory knowledge bases. Eliminates hallucinated section numbers.
        </p>
      </motion.div>

      {/* Case Intake Card */}
      <motion.div className="glass-card intake-card" variants={childVariants}>
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
            placeholder="Example: A local supermarket charged me ₹450 for a packaged food item with a printed MRP of ₹300 and refused cash memo receipt..."
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
                  Analyzing Case Facts & Searching Statutes...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyze Legal Rights & Generate Report
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
