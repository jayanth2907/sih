import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldAlert } from 'lucide-react';

const DATA = [
  { name: 'Critical', value: 12, color: '#F43F5E' },
  { name: 'High', value: 38, color: '#F97316' },
  { name: 'Medium', value: 52, color: '#EAB308' },
  { name: 'Low', value: 35, color: '#22C55E' },
];

export const ComplianceDonutChart = () => {
  const total = DATA.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col justify-between shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-forest flex items-center justify-center text-brand-emerald">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">Compliance Analytics</h3>
        </div>
        <span className="text-[10px] text-text-muted">This Month</span>
      </div>

      {/* Chart & Center Stat */}
      <div className="flex items-center justify-between gap-2 my-auto">
        {/* Donut Chart */}
        <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DATA}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={62}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-xl font-extrabold font-mono text-text-primary leading-none">
              {total}
            </span>
            <span className="text-[9px] text-text-muted mt-0.5 leading-none">Open Violations</span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="space-y-2 flex-1 pl-2">
          {DATA.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-text-secondary">{item.name}</span>
              </div>
              <span className="font-bold font-mono text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
