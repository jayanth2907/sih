import React from 'react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, BarChart2, ShieldCheck, CheckCircle2 } from 'lucide-react';

const FLEET_RISK_DATA = [
  { day: 'D-10', score: 56 },
  { day: 'D-8', score: 58 },
  { day: 'D-6', score: 57 },
  { day: 'D-4', score: 60 },
  { day: 'D-2', score: 59 },
  { day: 'Today', score: 61.7 },
];

const CADENCE_DATA = [
  { name: 'W1', value: 85 },
  { name: 'W2', value: 70 },
  { name: 'W3', value: 90 },
  { name: 'W4', value: 65 },
  { name: 'W5', value: 80 },
  { name: 'W6', value: 78 },
];

export const DashboardAnalytics = ({ summary }) => {
  const govResponseScore = summary?.governance_response_score || 72;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* 1. Corporate Fleet Risk Index */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-emerald" />
            <span className="text-xs font-bold text-text-primary">Corporate Fleet Risk Index</span>
          </div>
          <span className="text-[10px] text-text-muted">Last 30 days</span>
        </div>

        <div className="flex items-baseline justify-between my-1">
          <div>
            <span className="text-2xl font-extrabold font-mono text-text-primary tracking-tight">61.7</span>
            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold mt-0.5">
              <span>↑ 4.2%</span>
              <span className="text-text-muted font-normal">vs previous 30-day baseline</span>
            </div>
          </div>
        </div>

        {/* Sparkline chart */}
        <div className="h-16 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FLEET_RISK_DATA}>
              <defs>
                <linearGradient id="riskGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#riskGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Mine Reporting Cadence */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-brand-teal" />
            <span className="text-xs font-bold text-text-primary">Mine Reporting Cadence</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-forest text-brand-emerald font-semibold">
            On schedule
          </span>
        </div>

        <div className="flex items-baseline justify-between my-1">
          <div>
            <span className="text-2xl font-extrabold font-mono text-text-primary tracking-tight">78%</span>
            <p className="text-[11px] text-text-muted mt-0.5">Ingestion telemetry vs expected</p>
          </div>
        </div>

        {/* Mini Bar Chart */}
        <div className="h-16 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CADENCE_DATA}>
              <Bar dataKey="value" fill="#14B8A6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Governance Response Score */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-emerald" />
            <span className="text-xs font-bold text-text-primary">Governance Response Score</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-text-primary tracking-tight">
              {govResponseScore}
            </span>
            <span className="text-xs font-semibold text-brand-emerald">↑ 6%</span>
          </div>

          <p className="text-[11px] font-medium text-brand-emerald">Improving trend</p>
          <p className="text-[10px] text-text-muted">Better compliance. Safer operations.</p>
        </div>

        {/* Circular Ring Gauge */}
        <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-brand-surface"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-brand-emerald stroke-current transition-all duration-1000 ease-out"
              strokeDasharray={`${govResponseScore}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-xs font-bold font-mono text-text-primary">
            {govResponseScore}%
          </span>
        </div>
      </div>
    </div>
  );
};
