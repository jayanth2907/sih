import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, FileCheck, AlertCircle, Wrench, ShieldCheck, CheckCircle2 } from 'lucide-react';

const ACTIVITIES = [
  {
    time: "10:15",
    title: "New inspection report uploaded",
    entity: "Jharia #4 (BCCL)",
    type: "upload",
    color: "bg-status-success",
  },
  {
    time: "09:42",
    title: "SLA breached",
    entity: "CASE-2026-JH-881",
    type: "sla",
    color: "bg-status-critical",
  },
  {
    time: "09:30",
    title: "Corrective action updated",
    entity: "Raniganj UG (ECL)",
    type: "action",
    color: "bg-brand-teal",
  },
  {
    time: "09:12",
    title: "Document OCR completed",
    entity: "Talcher OC (MCL)",
    type: "ocr",
    color: "bg-brand-emerald",
  },
  {
    time: "08:47",
    title: "New violation created",
    entity: "Korba West (SECL)",
    type: "violation",
    color: "bg-amber-400",
  },
];

export const RecentActivityTimeline = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col justify-between shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Recent Activity</h3>
          <p className="text-[11px] text-text-secondary">Live updates across all mines</p>
        </div>

        <button
          onClick={() => navigate('/audit')}
          className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-brand-emerald transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3.5 flex-1">
        {ACTIVITIES.map((act, index) => (
          <div key={index} className="flex items-start gap-3 group">
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${act.color} flex-shrink-0`} />
              <span className="text-[11px] font-mono text-text-muted">{act.time}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary group-hover:text-brand-emerald transition-colors truncate">
                {act.title}
              </p>
              <p className="text-[11px] text-text-secondary font-mono truncate">
                {act.entity}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
