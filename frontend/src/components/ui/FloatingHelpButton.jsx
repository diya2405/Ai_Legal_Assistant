import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

export default function FloatingHelpButton({ onClick, language = 'en' }) {
  const isHi = language === 'hi';

  return (
    <motion.button 
      className="floating-help-trigger"
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08, boxShadow: '0 8px 25px rgba(13, 148, 136, 0.4)' }}
      whileTap={{ scale: 0.94 }}
      title={isHi ? 'मदद चाहिए?' : 'Need a little help?'}
    >
      <div className="floating-icon-glow">
        <HelpCircle size={22} />
      </div>
      <span className="floating-help-label">
        {isHi ? 'मदद चाहिए?' : 'Need help?'}
      </span>
    </motion.button>
  );
}
