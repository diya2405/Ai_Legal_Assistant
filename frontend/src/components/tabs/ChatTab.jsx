import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, Send, RefreshCw } from 'lucide-react';
import FormattedText from '../ui/FormattedText';
import { SUGGESTED_CHAT_PROMPTS } from '../../data/constants';

export default function ChatTab({
  kbEntry,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  onSendChatMessage
}) {
  if (!kbEntry) return null;

  return (
    <motion.div 
      className="glass-card panel-card chat-workspace-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      <div className="panel-header">
        <div className="panel-title">
          <MessageSquare size={22} className="icon-accent-gold" />
          Grounded Statutory Q&A Assistant
        </div>
        <span className="badge badge-rag">
          <Sparkles size={13} />
          RAG Statute Grounded
        </span>
      </div>

      {/* Prompt Chips */}
      <div className="chat-prompt-chips">
        <span className="chips-label">Suggested Qs:</span>
        {SUGGESTED_CHAT_PROMPTS.map((promptText, idx) => (
          <motion.button 
            key={idx}
            className="chat-chip"
            onClick={() => onSendChatMessage(null, promptText)}
            disabled={chatLoading}
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(234, 179, 8, 0.15)' }}
            whileTap={{ scale: 0.97 }}
          >
            {promptText}
          </motion.button>
        ))}
      </div>

      <div className="chat-messages-container">
        {chatMessages.length === 0 && (
          <motion.div 
            className="chat-empty-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <MessageSquare size={36} className="empty-icon" />
            <p className="empty-title">Ask statutory follow-up questions regarding {kbEntry.act_name}</p>
            <p className="empty-sub">Answers are grounded in statutory codes and judicial precedents.</p>
          </motion.div>
        )}

        <AnimatePresence>
          {chatMessages.map((msg, idx) => (
            <motion.div 
              key={idx} 
              className={`chat-bubble-row ${msg.role}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="chat-avatar">
                {msg.role === 'user' ? 'YOU' : 'AI'}
              </div>
              <div className="chat-bubble-content">
                <div className="chat-text">
                  <FormattedText text={msg.content} />
                </div>
                {msg.source_chunks && msg.source_chunks.length > 0 && (
                  <div className="chat-source-tag">
                    Source: <strong>{msg.source_chunks[0].act_name} ({msg.source_chunks[0].section_number})</strong>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {chatLoading && (
          <motion.div 
            className="chat-bubble-row assistant"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chat-avatar">AI</div>
            <div className="chat-bubble-content loading-bubble">
              <RefreshCw size={14} className="animate-spin" /> Searching grounded statute chunks...
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={onSendChatMessage} className="chat-input-row">
        <input
          type="text"
          className="chat-input-styled"
          placeholder="Ask a follow-up statutory question..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
        />
        <motion.button 
          type="submit" 
          className="btn-primary" 
          disabled={!chatInput.trim() || chatLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Send size={16} />
        </motion.button>
      </form>
    </motion.div>
  );
}
