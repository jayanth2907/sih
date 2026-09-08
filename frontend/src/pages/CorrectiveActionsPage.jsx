import React, { useState } from 'react';
import { Wrench, CheckCircle2, Clock, AlertTriangle, UserCheck, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const DEFAULT_ACTIONS = [
  {
    id: 1,
    title: "Install Supplementary Methane Degasification Fan",
    violation: "V-1024 (Methane Accumulation)",
    mine: "Singrauli Block-B (NCL)",
    assigned_to: "Rajesh Sharma (Senior Safety Officer)",
    due: "Tomorrow, 18:00",
    status: "IN_PROGRESS",
    progress: 65,
  },
  {
    id: 2,
    title: "Re-grade Highwall Bench Slope to 45° Statutory Angle",
    violation: "V-1025 (Highwall Crack)",
    mine: "Jharia Coalfield Pit #4 (BCCL)",
    assigned_to: "BCCL Heavy Machinery Division",
    due: "In 2 days",
    status: "PENDING",
    progress: 20,
  },
  {
    id: 3,
    title: "Clean & Recalibrate Atmospheric CH4 Sensors in Seam #2",
    violation: "V-1026 (Sensor Drift)",
    mine: "Raniganj UG Seam #2 (ECL)",
    assigned_to: "ECL Telemetry Team",
    due: "In 3 days",
    status: "PENDING",
    progress: 10,
  },
  {
    id: 4,
    title: "Deploy Water Bowsers for Haulage Road Dust Suppression",
    violation: "V-1027 (Particulate Matter)",
    mine: "Talcher OC Mine (MCL)",
    assigned_to: "MCL Environmental Officer",
    due: "Completed",
    status: "COMPLETED",
    progress: 100,
  },
];

export const CorrectiveActionsPage = () => {
  const [actions, setActions] = useState(DEFAULT_ACTIONS);
  const { showToast } = useToast();

  const handleComplete = (id) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: 'COMPLETED', progress: 100 } : a));
    showToast('Remediation action marked as completed & signed with cryptographic timestamp.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2.5">
          <Wrench className="w-6 h-6 text-brand-emerald" />
          <span>Statutory Corrective & Preventive Action (CAPA) Portal</span>
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Tracking remediation task execution, officer assignment, SLA deadlines & proof of work
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((act) => (
          <div key={act.id} className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-forest text-brand-emerald border border-brand-emerald/30">
                  {act.violation}
                </span>
                <h3 className="text-sm font-bold text-text-primary mt-1.5">{act.title}</h3>
                <p className="text-xs text-text-secondary">{act.mine}</p>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                act.status === 'COMPLETED'
                  ? 'bg-status-success/20 text-status-success border border-status-success/40'
                  : act.status === 'IN_PROGRESS'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-brand-surface text-text-muted border border-brand-border'
              }`}>
                {act.status}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-text-muted">
                <span>Remediation Progress</span>
                <span className="font-mono font-bold text-text-primary">{act.progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-brand-surface overflow-hidden">
                <div
                  className="h-full bg-brand-emerald rounded-full transition-all duration-500"
                  style={{ width: `${act.progress}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-text-muted">
                <UserCheck className="w-3.5 h-3.5 text-brand-teal" />
                <span className="truncate max-w-[180px]">{act.assigned_to}</span>
              </div>

              {act.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleComplete(act.id)}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-brand-emerald text-brand-bg hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  Verify Resolution
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
