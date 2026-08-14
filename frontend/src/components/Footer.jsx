import React from 'react';
import { motion } from 'framer-motion';
import { MANDATORY_DISCLAIMER } from '../data/constants';

export default function Footer() {
  return (
    <motion.footer 
      className="app-footer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="footer-content">
        <strong className="text-gold">Mandatory Legal Disclaimer:</strong> {MANDATORY_DISCLAIMER}
      </div>
    </motion.footer>
  );
}
