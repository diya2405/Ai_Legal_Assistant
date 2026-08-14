import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, CheckCircle2 } from 'lucide-react';
import { TRANSLATIONS } from '../../data/translations';

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
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } }
};

export default function FactsTab({ entities, language = 'en' }) {
  const t = TRANSLATIONS[language]?.factsTab || TRANSLATIONS.en.factsTab;

  return (
    <motion.div 
      className="glass-card panel-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      <div className="panel-header">
        <div className="panel-title">
          <UserCheck size={22} className="icon-accent-emerald" />
          {t.title}
        </div>
        <span className="subtext-muted">{t.subtext}</span>
      </div>

      {entities.length === 0 ? (
        <div className="empty-facts-state">{t.emptyText}</div>
      ) : (
        <motion.div 
          className="entities-grid"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {entities.map((ent, idx) => (
            <motion.div 
              key={idx} 
              className="entity-card glass-card"
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -3, boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)' }}
            >
              <div className="entity-label">{ent.entity_type}</div>
              <div className="entity-value">{ent.entity_value}</div>
              <div className="entity-status">
                <CheckCircle2 size={12} className="icon-emerald" /> {t.verifiedStatus}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
