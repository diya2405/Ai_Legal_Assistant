import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, MessageSquare, UserCheck } from 'lucide-react';

const tabs = [
  { id: 'rights', label: '1. Legal Rights & Statutes', icon: Sparkles },
  { id: 'notice', label: '2. Legal Notice Generator (Editable)', icon: FileText },
  { id: 'chat', label: '3. Statutory Q&A Assistant', icon: MessageSquare },
  { id: 'facts', label: '4. Extracted Case Facts', icon: UserCheck }
];

export default function TabBar({ activeTab, setActiveTab }) {
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
