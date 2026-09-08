import React, { useState, useEffect } from 'react';
import { Sun, Shield, MapPin, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroBanner = () => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-surface via-brand-card to-brand-surface border border-brand-border p-6 shadow-xl mb-6">
      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-emerald/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-teal/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Headline */}
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-widest uppercase text-brand-teal font-mono">
              COAL INDIA EXECUTIVE SAFETY DIRECTORATE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Governance for <span className="text-brand-emerald">Safer, Smarter Mines</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            Real-time insights. Explainable risks. Accountable actions across monitored subsidiaries.
          </p>
        </div>

        {/* Right Live Time & Status Widget */}
        <div className="flex items-center gap-6 bg-brand-bg/60 border border-brand-border/60 rounded-xl px-5 py-3.5 backdrop-blur-sm self-start lg:self-auto">
          <div className="text-right">
            <p className="text-[11px] text-text-muted font-medium">{dateStr || 'Tuesday, 2 Sept 2026'}</p>
            <p className="text-xl font-bold font-mono text-text-primary tracking-tight">{timeStr || '10:24 AM'}</p>
          </div>

          <div className="h-8 w-px bg-brand-border" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">Good morning,</p>
              <p className="text-[11px] text-text-secondary">Let's keep our mines safe today.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
