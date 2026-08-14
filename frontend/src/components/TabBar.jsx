import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, MessageSquare, UserCheck } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function TabBar({ activeTab, setActiveTab, language = 'en' }) {
  const t = TRANSLATIONS[language]?.tabs || TRANSLATIONS.en.tabs;

  const tabs = [
    { id: 'rights', label: t.rights, icon: Sparkles },
    { id: 'notice', label: t.notice, icon: FileText },
    { id: 'chat', label: t.chat, icon: MessageSquare },
    { id: 'facts', label: t.facts, icon: UserCheck }
  ];

  return (
    <div className="nav-tabs-bar glass-card">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button 
            key={tab.id}
            className={`tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ position: 'relative' }}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="active-pill-highlight"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="tab-btn-content" style={{ position: 'relative', zIndex: 1 }}>
              <Icon size={17} />
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
