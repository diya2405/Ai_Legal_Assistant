import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';

export default function MissingInfoModal({ isOpen, onClose, missingQuestions = [], onSubmitAnswers, language = 'en' }) {
  const [answers, setAnswers] = useState({});

  if (!isOpen || !missingQuestions || missingQuestions.length === 0) return null;

  const isHi = language === 'hi';

  const title = isHi ? 'महत्वपूर्ण जानकारी आवश्यक है' : 'Critical Case Details Missing';
  const subtitle = isHi 
    ? 'सटीक कानूनी नोटिस तैयार करने के लिए कृपया इन उत्तरों को भरें:' 
    : 'To generate a legally sound notice, please provide these missing case details:';

  const handleInputChange = (field, val) => {
    setAnswers(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmitAnswers) {
      onSubmitAnswers(answers);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="modal-card glass-card missing-info-modal-card"
          initial={{ scale: 0.9, y: 25 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 25 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-title-group">
              <AlertCircle size={22} className="icon-accent-gold" />
              <h3>{title}</h3>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <p className="missing-modal-subtitle">{subtitle}</p>

          <form onSubmit={handleSubmit} className="missing-form-stack">
            {missingQuestions.map((q, idx) => (
              <div key={idx} className="form-group">
                <label className="form-label">{q.question}</label>
                <input 
                  type="text" 
                  className="input-styled" 
                  placeholder={isHi ? 'उत्तर दर्ज करें...' : 'Enter detail...'}
                  value={answers[q.field] || ''}
                  onChange={e => handleInputChange(q.field, e.target.value)}
                />
              </div>
            ))}

            <div className="missing-modal-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={onClose}>
                {isHi ? 'बाद में भरें' : 'Skip for now'}
              </button>
              <button type="submit" className="btn-primary btn-sm">
                <CheckCircle2 size={16} />
                {isHi ? 'विवरण सहेजें' : 'Update Case Facts'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
