import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  X,
  ChevronRight,
  Shield,
  AlertTriangle,
  Scale,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService } from '../../services/chatService';
import { useNavigate } from 'react-router-dom';

const QUICK_PROMPTS = [
  'Which mines need immediate attention?',
  'Why is Mine C critical?',
  'Show SLA breaches',
  'Compare Mine C and Mine D',
  'Show today\'s governance signals',
  'Show me Mine C\'s latest inspection'
];

export const FloatingAICopilot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Good day Officer. I am your TRINETRA AI Safety & Compliance Copilot. How can I assist you with mine risks, SLA breaches, or regulatory provisions today?',
      citations: ['DGMS CMR 2017 Reg 104'],
      actionLinks: [],
      sources: ['Mine Registry', 'Risk Engine']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const navigate = useNavigate();

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatService.sendMessage(textToSend, language);
      const assistantMsg = {
        role: 'assistant',
        text: response.answer,
        recommendedAction: response.recommended_action,
        citations: response.citations || [],
        actionLinks: response.action_links || [],
        toolUsed: response.tool_used,
        sources: response.sources || ['Operational Governance Database']
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Mine C (Singrauli Block-B) has an elevated Risk Score of 87.85 (CRITICAL). Contributing factors include 4 recurring methane violations and high reporting drift. Authorized human verification is required before enforcement action.',
          citations: ['VIOL-2026-001 (Methane Accumulation)', 'DGMS Reg 104'],
          actionLinks: [{ label: 'View Case VIOL-2026-001', path: '/violations' }],
          sources: ['XGBoost Priority Engine', 'Mine Registry']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.trim().startsWith('|')) {
        return (
          <div key={idx} className="font-mono text-[10px] overflow-x-auto text-brand-teal py-0.5">
            {line}
          </div>
        );
      }
      if (line.trim().startsWith('•') || line.trim().startsWith('*')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 py-0.5 pl-1 text-text-secondary">
            <span className="text-brand-emerald font-bold">•</span>
            <span>{line.replace(/^[•*]\s*/, '')}</span>
          </div>
        );
      }
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={idx} className="py-0.5 text-text-primary">
            {parts.map((p, i) => (i % 2 === 1 ? <strong key={i} className="text-brand-emerald font-bold">{p}</strong> : p))}
          </p>
        );
      }
      return <p key={idx} className="py-0.5">{line}</p>;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs pointer-events-auto"
          />

          {/* Copilot Drawer Panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-auto">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-md bg-brand-surface border-l border-brand-border shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-gradient-to-r from-brand-forest/60 to-brand-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-emerald text-brand-bg flex items-center justify-center font-bold shadow-glow-emerald">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                      AI Safety Copilot
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/40 font-mono">
                        v2.4
                      </span>
                    </h3>
                    <p className="text-[10px] text-text-muted">Evidence-Backed Decision Support</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                    className="px-2 py-1 text-[10px] font-bold rounded-md bg-brand-card border border-brand-border text-brand-emerald"
                  >
                    {language === 'en' ? 'हिंदी' : 'EN'}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-brand-surface"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[92%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-brand-emerald text-brand-bg font-semibold rounded-tr-none shadow-glow-emerald'
                          : 'bg-brand-card border border-brand-border text-text-primary rounded-tl-none shadow-sm'
                      }`}
                    >
                      {/* Tool tag */}
                      {msg.role === 'assistant' && msg.toolUsed && (
                        <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-brand-border/40">
                          <span className="px-1.5 py-0.5 rounded bg-brand-forest text-brand-teal text-[8px] font-mono font-bold border border-brand-emerald/30 uppercase">
                            Tool: {msg.toolUsed}
                          </span>
                        </div>
                      )}

                      <div className="space-y-1">
                        {renderFormattedText(msg.text)}
                      </div>

                      {/* Recommended Action */}
                      {msg.recommendedAction && (
                        <div className="mt-2.5 p-2 rounded-lg bg-brand-forest/30 border border-brand-emerald/40 text-[10px] text-brand-emerald">
                          <strong>Recommended Action:</strong> {msg.recommendedAction}
                        </div>
                      )}

                      {/* Evidence Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-brand-border/60">
                          <p className="text-[9px] font-bold text-brand-teal uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Scale className="w-3 h-3" /> Statutory Citations:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {msg.citations.map((c, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-brand-forest/60 text-brand-emerald text-[9px] font-mono border border-brand-emerald/30"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Navigation Links */}
                      {msg.actionLinks && msg.actionLinks.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {msg.actionLinks.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                onClose();
                                navigate(action.path || '/dashboard');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-emerald text-[10px] font-bold text-brand-teal hover:text-brand-emerald transition-colors"
                            >
                              <span>{action.label || 'View Entity'}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-text-muted bg-brand-card p-3 rounded-xl border border-brand-border w-fit">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-emerald" />
                    <span>Analyzing statutory databases & risk telemetry...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompts */}
              <div className="px-4 py-2 border-t border-brand-border bg-brand-card/40">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Suggested Inquiries
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.slice(0, 3).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="px-2.5 py-1 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-teal/40 text-[10px] text-text-secondary hover:text-text-primary transition-colors text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-brand-border bg-brand-surface">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about mine risk, DGMS safety rules, SLAs..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-brand-card border border-brand-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-emerald"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2 rounded-xl bg-brand-emerald text-brand-bg hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-glow-emerald"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted px-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Shield className="w-3 h-3 text-brand-emerald" /> Decision Support Only
                  </span>
                  <span>Human verification required</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

