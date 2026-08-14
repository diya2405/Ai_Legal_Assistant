import React from 'react';
import { motion } from 'framer-motion';
import { TRANSLATIONS } from '../data/translations';

export default function Footer({ language = 'en' }) {
  const t = TRANSLATIONS[language]?.footer || TRANSLATIONS.en.footer;

  return (
    <motion.footer 
      className="app-footer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="footer-content">
        <strong className="text-gold">{t.disclaimerLabel}</strong> {t.disclaimerText}
      </div>
    </motion.footer>
  );
}
