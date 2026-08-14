import React from 'react';
import { motion } from 'framer-motion';
import { Scale, ShieldCheck, Award } from 'lucide-react';

export default function Header({ onReset }) {
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
              Verified AI Legal Rights & Statutory Notice Platform
            </div>
          </div>
        </motion.div>

        <div className="nav-actions">
          <motion.div 
            className="tag-badge tag-badge-gold"
            whileHover={{ y: -2, boxShadow: '0 4px 15px rgba(234, 179, 8, 0.25)' }}
          >
            <ShieldCheck size={14} />
            100% Citation Guard Verified
          </motion.div>
          <motion.div 
            className="tag-badge tag-badge-blue"
            whileHover={{ y: -2, boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)' }}
          >
            <Award size={14} />
            Deterministic Bare Act KB
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
