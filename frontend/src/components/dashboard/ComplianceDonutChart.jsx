import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldAlert } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';

const DEFAULT_DATA = [
  { name: 'Critical', value: 0, color: '#F43F5E' },
  { name: 'High', value: 0, color: '#F97316' },
  { name: 'Medium', value: 0, color: '#EAB308' },
  { name: 'Low', value: 0, color: '#22C55E' },
];

export const ComplianceDonutChart = () => {
  const [data, setData] = useState(DEFAULT_DATA);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchBreakdown = async () => {
      try {
        const res = await dashboardService.getSummary();
        if (mounted && res && res.severity_breakdown) {
          setData(res.severity_breakdown);
          const computedTotal = res.severity_breakdown.reduce((acc, curr) => acc + curr.value, 0);
          setTotal(computedTotal);
        }
      } catch (err) {
        console.error('Failed to load compliance summary:', err);
      }
    };
    fetchBreakdown();
    return () => {
      mounted = false;
    };
  }, []);

  const chartData = total > 0 ? data : [{ name: 'No Violations', value: 1, color: '#334155' }];

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
        <span className="text-[10px] text-text-muted">Live Status</span>
      </div>

      {/* Chart & Center Stat */}
      <div className="flex items-center justify-between gap-2 my-auto">
        {/* Donut Chart */}
        <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={62}
                paddingAngle={total > 0 ? 3 : 0}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
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
          {data.map((item, idx) => (
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

