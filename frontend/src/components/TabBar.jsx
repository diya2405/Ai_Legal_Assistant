import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, MessageSquare, UserCheck, Layers, ShieldCheck, Scale, BookOpen, CheckCircle } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function TabBar({ activeTab, setActiveTab, language = 'en', isSidebar = true, kbEntry = null }) {
  const t = TRANSLATIONS[language]?.tabs || TRANSLATIONS.en.tabs;
  const isHi = language === 'hi';

  const tabs = [
    { 
      id: 'rights', 
      num: '1',
      label: t.rights, 
      desc: isHi ? 'कानूनी अधिकार, मूल अधिनियम की धाराएं एवं उपाय' : 'Statutory rights, bare act remedies & provisions',
      icon: Sparkles 
    },
    { 
      id: 'notice', 
      num: '2',
      label: t.notice, 
      desc: isHi ? 'औपचारिक कानूनी नोटिस तैयार करें व डाउनलोड करें' : 'Draft & customize formal legal notice PDF',
      icon: FileText 
    },
    { 
      id: 'chat', 
      num: '3',
      label: t.chat, 
      desc: isHi ? 'सत्यापित कानून पर आधारित प्रश्न पूछें' : 'Ask questions grounded in statutory law',
      icon: MessageSquare 
    },
    { 
      id: 'facts', 
      num: '4',
      label: t.facts, 
      desc: isHi ? 'शिकायत से निकाले गए प्रमुख तथ्य एवं विवरण' : 'Key entities & facts extracted from intake',
      icon: UserCheck 
    }
  ];

  if (!isSidebar) {
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

  return (
    <div className="sidebar-nav-container glass-card">
      <div className="sidebar-header">
        <div className="sidebar-header-title">
          <Layers size={18} className="icon-accent-gold" />
          <span>{isHi ? 'कानूनी वर्कस्पेस मोड्यूल' : 'Legal Workspace Modules'}</span>
        </div>
      </div>

      <div className="sidebar-tab-list">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              className={`sidebar-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.015, x: 2 }}
              whileTap={{ scale: 0.98 }}
              style={{ position: 'relative' }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSidebarIndicator"
                  className="sidebar-active-indicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              
              <div className="sidebar-tab-body" style={{ position: 'relative', zIndex: 1 }}>
                <div className="sidebar-tab-top">
                  <span className={`sidebar-tab-num ${isActive ? 'num-active' : ''}`}>{tab.num}</span>
                  <div className={`sidebar-tab-icon-box ${isActive ? 'icon-active' : ''}`}>
                    <Icon size={18} />
                  </div>
                  <span className="sidebar-tab-label">{tab.label}</span>
                </div>
                <p className="sidebar-tab-desc">{tab.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

