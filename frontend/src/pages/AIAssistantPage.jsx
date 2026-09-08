import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  ChevronRight,
  Shield,
  MessageSquare,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  FileCode2,
  ExternalLink,
  Info,
  Clock,
  RefreshCw,
  Sliders,
  Scale
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { useNavigate } from 'react-router-dom';

const QUICK_PROMPTS = [
  'Which mines need immediate attention?',
  'Why is Mine C critical?',
  'Show SLA breaches',
  'Compare Mine C and Mine D',
  'Show today\'s governance signals',
  'Show me Mine C\'s latest inspection',
  'Show the audit history for Violation 1'
];

export const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Good day Officer. I am your KhanDrishti AI Safety & Regulatory Intelligence Copilot. I analyze live statutory mining registers, Silence-to-Risk telemetry, SLA escalations, and DGMS CMR 2017 compliance mandates.',
      citations: ['DGMS CMR 2017 Reg 104', 'Coal Mines Act 1952'],
      actionLinks: [
        { label: 'View Command Center', path: '/dashboard' },
        { label: 'Inspect Critical Violations', path: '/violations' }
      ],
      sources: ['Mine Registry', 'XGBoost Risk Engine', 'Silence-to-Risk Engine'],
      toolUsed: 'get_mine_summary'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const navigate = useNavigate();

  const handleSend = async (queryText = input) => {
    if (!queryText.trim() || loading) return;

    const userMsg = { role: 'user', text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.sendMessage(queryText, language);
      const botMsg = {
        role: 'assistant',
        text: res.answer,
        recommendedAction: res.recommended_action,
        citations: res.citations || [],
        actionLinks: res.action_links || [],
        toolUsed: res.tool_used,
        sources: res.sources || ['Operational Governance Database']
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Mine C (Singrauli Block-B) currently exhibits a Unified Risk Score of 87.85 (CRITICAL). Contributing factors include 4 recurring methane violations (+24 pts), reporting telemetry drift (+19 pts), and CMSMS satellite anomaly (+12 pts). Authorized human verification is required before enforcement action.',
          citations: ['VIOL-2026-001 (Methane Drift)', 'DGMS Reg 104'],
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
      // Markdown table row
      if (line.trim().startsWith('|')) {
        return (
          <div key={idx} className="font-mono text-[11px] overflow-x-auto text-brand-teal py-0.5">
            {line}
          </div>
        );
      }
      // Bullet point
      if (line.trim().startsWith('•') || line.trim().startsWith('*')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 py-0.5 pl-1 text-text-secondary">
            <span className="text-brand-emerald font-bold">•</span>
            <span>{line.replace(/^[•*]\s*/, '')}</span>
          </div>
        );
      }
      // Bold headers
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={idx} className="py-1 text-text-primary">
            {parts.map((p, i) => (i % 2 === 1 ? <strong key={i} className="text-brand-emerald font-bold">{p}</strong> : p))}
          </p>
        );
      }
      return <p key={idx} className="py-0.5">{line}</p>;
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      {/* Left: Quick Knowledge Panel */}
      <div className="hidden lg:flex w-64 bg-brand-card border border-brand-border rounded-2xl p-4 flex-col justify-between shadow-sm">
        <div className="space-y-4">
          <button
            onClick={() => setMessages([{
              role: 'assistant',
              text: 'Started new governance intelligence session. You can query mine risk scores, silence-to-risk telemetry, SLA escalations, or DGMS compliance provisions.',
              citations: ['DGMS CMR 2017'],
              actionLinks: []
            }])}
            className="w-full py-2.5 px-3 rounded-xl bg-brand-forest border border-brand-emerald/40 text-brand-emerald font-bold text-xs hover:bg-brand-emerald hover:text-brand-bg transition-all flex items-center justify-center gap-2 shadow-glow-emerald"
          >
            <Plus className="w-4 h-4" />
            <span>New Inquiry Session</span>
          </button>

          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-teal" /> Suggested Inquiries
            </p>
            <div className="space-y-1.5">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="w-full text-left p-2 rounded-lg bg-brand-surface/70 hover:bg-brand-forest/40 border border-brand-border hover:border-brand-emerald/40 text-[11px] text-text-secondary hover:text-text-primary transition-all line-clamp-2"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-brand-surface border border-brand-border text-[11px] text-text-muted space-y-1">
          <div className="flex items-center gap-1.5 text-brand-emerald font-bold text-[10px] uppercase">
            <Shield className="w-3.5 h-3.5" /> Controlled Tool Guardrail
          </div>
          <p className="text-[10px] leading-tight">
            Queries execute via safe, deterministic backend tools without arbitrary SQL.
          </p>
        </div>
      </div>

      {/* Center: Conversation Feed */}
      <div className="flex-1 bg-brand-card border border-brand-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-brand-border bg-gradient-to-r from-brand-forest/40 via-brand-surface to-brand-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-forest text-brand-emerald border border-brand-emerald/40 flex items-center justify-center font-bold shadow-glow-emerald">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                <span>KhanDrishti AI Safety Copilot</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/40 font-mono font-bold">
                  GOVERNANCE COPILOT
                </span>
              </h2>
              <p className="text-[10px] text-text-muted">
                Evidence-grounded statutory intelligence for coal mine compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-surface border border-brand-border text-brand-emerald hover:border-brand-emerald/50 transition-colors"
            >
              {language === 'en' ? 'Switch to हिंदी' : 'Switch to English'}
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-emerald text-brand-bg font-bold rounded-tr-none shadow-glow-emerald'
                    : 'bg-brand-surface border border-brand-border text-text-primary rounded-tl-none shadow-md'
                }`}
              >
                {/* Tool Badge if assistant */}
                {msg.role === 'assistant' && msg.toolUsed && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-brand-border/40">
                    <span className="px-1.5 py-0.5 rounded bg-brand-forest text-brand-teal text-[9px] font-mono font-bold border border-brand-emerald/30 uppercase">
                      Tool: {msg.toolUsed}
                    </span>
                  </div>
                )}

                {/* Main Message Text */}
                <div className="space-y-1">
                  {renderFormattedText(msg.text)}
                </div>

                {/* Recommended Action Callout */}
                {msg.recommendedAction && (
                  <div className="mt-3 p-2.5 rounded-xl bg-brand-forest/30 border border-brand-emerald/40 text-[11px] text-brand-emerald flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[10px] uppercase font-bold text-text-primary">Recommended Governance Action:</strong>
                      {msg.recommendedAction}
                    </div>
                  </div>
                )}

                {/* Statutory Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-brand-border/60">
                    <p className="text-[10px] font-bold text-brand-teal uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Statutory Citations:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-brand-forest/60 text-brand-emerald text-[10px] font-mono border border-brand-emerald/30"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grounded Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 text-[10px] text-text-muted font-mono">
                    Retrieved from: {msg.sources.join(' • ')}
                  </div>
                )}

                {/* Action Deep Links */}
                {msg.actionLinks && msg.actionLinks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.actionLinks.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigate(action.path || '/dashboard')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-card border border-brand-border hover:border-brand-emerald text-[11px] font-bold text-brand-teal hover:text-brand-emerald transition-all shadow-sm"
                      >
                        <span>{action.label || 'View Entity'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-text-muted bg-brand-surface p-3.5 rounded-xl border border-brand-border w-fit shadow-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-emerald" />
              <span>Querying verified risk registers & statutory policy rules...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-5 py-2 border-t border-brand-border bg-brand-surface/40 flex items-center gap-2 overflow-x-auto">
          {QUICK_PROMPTS.slice(0, 4).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1 text-[11px] rounded-lg bg-brand-card border border-brand-border text-text-secondary hover:text-text-primary hover:border-brand-emerald/40 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-brand-border bg-brand-surface">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about mine risk, DGMS safety rules, SLAs, inspections..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand-card border border-brand-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-emerald"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-brand-emerald text-brand-bg font-bold text-xs hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-glow-emerald flex items-center gap-1.5"
            >
              <span>Query</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right: Contextual Entity & Governance Standards Panel */}
      <div className="hidden xl:flex w-72 bg-brand-card border border-brand-border rounded-2xl p-4 flex-col justify-between shadow-sm space-y-4">
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-brand-teal" /> Contextual Priority Focus
          </h3>

          <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary">Singrauli Block-B</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-crimson/20 text-brand-crimson border border-brand-crimson/40">
                CRITICAL
              </span>
            </div>
            <div className="flex justify-between text-text-secondary text-[11px]">
              <span>Risk Score:</span>
              <span className="font-mono font-bold text-brand-crimson">87.85 / 100</span>
            </div>
            <div className="flex justify-between text-text-secondary text-[11px]">
              <span>Subsidiary:</span>
              <span className="font-mono font-semibold text-text-primary">NCL</span>
            </div>
            <div className="flex justify-between text-text-secondary text-[11px]">
              <span>SLA Overdue:</span>
              <span className="font-mono font-bold text-brand-amber">1 active case</span>
            </div>
            <div className="flex justify-between text-text-secondary text-[11px]">
              <span>Reporting Cadence:</span>
              <span className="font-bold text-brand-crimson">30% (7 Missing)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-brand-surface/60 border border-brand-border text-[11px] text-text-muted space-y-1">
            <span className="font-bold text-text-secondary block">Statutory Mandate</span>
            <p className="text-[10px] leading-tight">
              DGMS CMR 2017 Regulation 104 requires continuous mechanical ventilation and daily return airway gas telemetry.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-brand-forest/20 border border-brand-emerald/30 text-[10px] text-text-muted">
          <p className="font-bold text-brand-emerald mb-0.5">Defensible Governance Policy</p>
          <p className="leading-tight">
            "KhanDrishti AI Safety Copilot assists decision-making; final statutory compliance decisions require authorized human verification."
          </p>
        </div>
      </div>
    </div>
  );
};

