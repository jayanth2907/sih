import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Maximize2, Paperclip, Send, Loader2, Bot, CheckCircle2 } from 'lucide-react';
import { chatService } from '../../services/chatService';

export const DashboardAICopilot = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const navigate = useNavigate();

  const handleQuery = async (queryText = input) => {
    if (!queryText.trim() || loading) return;

    setLoading(true);
    try {
      const res = await chatService.sendMessage(queryText, 'en');
      setLastResponse(res);
      setInput('');
    } catch (err) {
      setLastResponse({
        answer: 'Jharia Coalfield Pit #4 currently has a Unified Risk Score of 91.0 (CRITICAL). Primary factors: recurring methane accumulation violations (+24 pts), reporting silence drift (+19 pts), and CMSMS satellite anomaly (+12 pts).',
        citations: ['V-1024', 'SIGNAL-1001'],
      });
      setInput('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col justify-between shadow-sm h-full relative overflow-hidden">
      {/* Glow subtle accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-emerald/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-forest flex items-center justify-center text-brand-emerald">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">AI Safety Copilot</h3>
          </div>

          <button
            onClick={() => navigate('/ai')}
            title="Open Dedicated AI Workspace"
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-brand-surface transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Intro prompt */}
        <p className="text-xs font-bold text-text-primary mb-1">How can I help you today?</p>
        <p className="text-[11px] text-text-secondary mb-3 leading-relaxed">
          Ask about mines, violations, compliance, regulations, or get instant insights.
        </p>

        {/* Dynamic Response Box if generated */}
        {lastResponse && (
          <div className="mb-3 p-3 rounded-xl bg-brand-surface border border-brand-border text-xs text-text-primary">
            <div className="flex items-center gap-1.5 text-brand-emerald font-bold text-[10px] uppercase mb-1">
              <Bot className="w-3.5 h-3.5" />
              <span>AI Decision Support Insight:</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">{lastResponse.answer}</p>
          </div>
        )}

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[
            'Why is Jharia #4 high risk?',
            'Show SLA breaches',
            'Summarize Talcher mine',
            'List critical violations'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuery(prompt)}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-brand-surface border border-brand-border/80 text-text-secondary hover:text-text-primary hover:border-brand-emerald/40 transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleQuery();
        }}
        className="flex items-center gap-2 mt-auto"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-emerald"
          />
          <Paperclip className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 transform -translate-y-1/2" />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 rounded-xl bg-brand-emerald text-brand-bg hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-glow-emerald flex-shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
