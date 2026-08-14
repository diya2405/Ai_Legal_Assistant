import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Scale, ShieldCheck, Landmark, Award, BookOpen, Info } from 'lucide-react';

export default function WorkspaceHeader({
  classification,
  kbEntry,
  inputText,
  showOriginalIntake,
  setShowOriginalIntake,
  onResetSearch
}) {
  return (
    <div className="workspace-header-group">
      <motion.div 
        className="workspace-header glass-card"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="header-left">
          <motion.button 
            className="btn-back" 
            onClick={onResetSearch}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={15} />
            New Legal Analysis
          </motion.button>
          
          <div className="case-title-meta">
            <h1 className="case-heading">
              {classification?.domain?.toUpperCase()} RIGHTS • {classification?.issue_type?.replace(/_/g, ' ').toUpperCase()}
            </h1>
            <div className="meta-pills">
              <span className="pill pill-gold">
                <Scale size={12} /> {kbEntry?.act_name}
              </span>
              <span className="pill pill-emerald">
                <ShieldCheck size={12} /> 100% Citation Guard Passed
              </span>
              <span className="pill pill-blue">
                <Landmark size={12} /> {kbEntry?.remedy_forum}
              </span>
              <span className="pill pill-purple">
                <Award size={12} /> Confidence: {Math.round((classification?.confidence || 1) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <motion.button 
            className="btn-secondary btn-sm"
            onClick={() => setShowOriginalIntake(prev => !prev)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <BookOpen size={14} />
            {showOriginalIntake ? 'Hide Facts' : 'View Submitted Facts'}
          </motion.button>
        </div>
      </motion.div>

      {/* Collapsible Facts Drawer */}
      <AnimatePresence>
        {showOriginalIntake && (
          <motion.div 
            className="glass-card original-facts-box"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="facts-box-title">
              <Info size={16} className="icon-accent-gold" />
              Submitted Case Intake Narrative:
            </div>
            <p className="facts-box-text">"{inputText}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
