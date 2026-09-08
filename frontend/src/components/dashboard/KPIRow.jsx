import React from 'react';
import { Layers, AlertTriangle, FileSpreadsheet, Clock, TrendingUp, TrendingDown } from 'lucide-react';

export const KPIRow = ({ summary }) => {
  // Default values matching reference if summary is loading
  const totalMines = summary?.total_mines ?? 24;
  const criticalCases = summary?.critical_violations ?? summary?.critical_cases ?? 12;
  const openViolations = summary?.open_violations ?? 137;
  const slaBreaches = summary?.sla_breaches ?? 18;

  const kpis = [
    {
      label: 'Total Mines',
      value: totalMines,
      trend: '↑ 2',
      trendType: 'positive',
      subtext: 'Across 3 subsidiaries',
      icon: Layers,
      iconBg: 'bg-brand-forest/60 text-brand-emerald border-brand-emerald/30',
    },
    {
      label: 'Critical Cases',
      value: criticalCases,
      trend: '↑ 3',
      trendType: 'negative',
      subtext: 'Require immediate attention',
      icon: AlertTriangle,
      iconBg: 'bg-status-critical/15 text-status-critical border-status-critical/30 shadow-glow-critical',
    },
    {
      label: 'Open Violations',
      value: openViolations,
      trend: '↓ 8',
      trendType: 'positive',
      subtext: 'Across all mines',
      icon: FileSpreadsheet,
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      label: 'SLA Breaches',
      value: slaBreaches,
      trend: '↑ 4',
      trendType: 'negative',
      subtext: 'Pending resolution',
      icon: Clock,
      iconBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div
            key={index}
            className="bg-brand-card border border-brand-border rounded-2xl p-4 flex items-center justify-between hover:border-brand-border-light transition-all shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${kpi.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>

              <div>
                <p className="text-xs text-text-secondary font-medium">{kpi.label}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-text-primary tracking-tight font-mono">
                    {kpi.value}
                  </span>
                  <span
                    className={`text-xs font-semibold flex items-center ${
                      kpi.trendType === 'positive' ? 'text-brand-emerald' : 'text-status-critical'
                    }`}
                  >
                    {kpi.trend}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">{kpi.subtext}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
