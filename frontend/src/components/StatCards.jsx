import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function StatCards({ kbEntry }) {
  if (!kbEntry) return null;

  return (
    <motion.div 
      className="stats-grid"
      variants={gridVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="stat-card glass-card border-top-gold"
        variants={cardVariants}
        whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(234, 179, 8, 0.15)' }}
      >
        <div className="stat-label">Enacted Statute Act</div>
        <div className="stat-value text-gold">{kbEntry.act_name}</div>
        <div className="stat-subtext">Statutory Code</div>
      </motion.div>

      <motion.div 
        className="stat-card glass-card border-top-pink"
        variants={cardVariants}
        whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(236, 72, 153, 0.15)' }}
      >
        <div className="stat-label">Section Citation</div>
        <div className="stat-value font-mono text-pink">{kbEntry.section_number}</div>
        <div className="stat-subtext">Verified Law Code</div>
      </motion.div>

      <motion.div 
        className="stat-card glass-card border-top-blue"
        variants={cardVariants}
        whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)' }}
      >
        <div className="stat-label">Remedy Forum</div>
        <div className="stat-value text-blue">
          <MapPin size={14} className="inline-icon" /> {kbEntry.remedy_forum}
        </div>
        <div className="stat-subtext">Filing Jurisdiction</div>
      </motion.div>

      <motion.div 
        className="stat-card glass-card border-top-emerald"
        variants={cardVariants}
        whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)' }}
      >
        <div className="stat-label">Limitation Period</div>
        <div className="stat-value text-emerald">
          <Clock size={14} className="inline-icon" /> {kbEntry.limitation_period}
        </div>
        <div className="stat-subtext">Filing Time Limit</div>
      </motion.div>
    </motion.div>
  );
}
