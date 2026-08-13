import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, User, Bot, Loader2, Mic } from 'lucide-react';
import { api } from '../api/client';
import type { ChatMessage } from '../types';

interface LegalChatProps {
  intakeId: string;
}

const SUGGESTED_QUESTIONS = [
  'Can I claim interest on the disputed amount?',
  'What if the seller ignores the 15-day legal notice?',
  'Where do I file an online complaint on e-Daakhil?',
  'What happens if they offer a partial refund?'
];

export const LegalChat: React.FC<LegalChatProps> = ({ intakeId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your LegalAId assistant. Ask me any follow-up questions about your rights, remedies, or claim calculations!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleVoiceChat = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsRecording(true);

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await api.chatIntake(intakeId, textToSend, updatedHistory);
      const botMsg: ChatMessage = { role: 'assistant', content: res.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Error getting response. Please try asking again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginTop: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-indigo)', fontWeight: 700, fontSize: '1.15rem' }}>
          <MessageSquare size={22} />
          <span>Interactive Legal Q&A Assistant</span>
        </div>
        <span className="badge badge-indigo">
          <Sparkles size={12} />
          <span>0% Hallucination Guarded Chat</span>
        </span>
      </div>

      {/* Suggested Follow-up Chips */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          💡 Suggested Questions:
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              disabled={loading}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div style={{
        maxHeight: '320px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '12px',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '16px'
      }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '10px',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: m.role === 'user' ? 'var(--accent-indigo)' : 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0
            }}>
              {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div style={{
              background: m.role === 'user' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              lineHeight: 1.6
            }}>
              {m.content.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} style={{ height: '4px' }} />;
                
                // Strip raw bullet stars (* **Title**)
                const cleanLine = trimmed.replace(/^[\*\-\•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return (
                  <p key={idx} style={{ margin: '0 0 6px 0' }} dangerouslySetInnerHTML={{ __html: cleanLine }} />
                );
              })}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Loader2 size={16} className="pulse-glow" />
            <span>Consulting verified statutory database...</span>
          </div>
        )}
      </div>

      {/* Chat Input Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '10px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question or dictating using the mic..."
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 40px 10px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
          <button
            type="button"
            onClick={handleVoiceChat}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: isRecording ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
              border: 'none',
              color: isRecording ? 'var(--accent-rose)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isRecording ? 'Listening...' : 'Voice Input (Dictate Question)'}
          >
            <Mic size={18} className={isRecording ? 'pulse-glow' : ''} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{ padding: '10px 18px' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
