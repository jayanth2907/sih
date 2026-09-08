import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, HelpCircle } from 'lucide-react';
import { getRiskCategory, getStatusBadge } from '../../utils/formatters';

const DEFAULT_ATTENTION_CASES = [
  {
    id: 1,
    mine: "Jharia Coalfield Pit #4 (BCCL)",
    case_id: "CASE-2026-JH-881",
    issue: "Gas accumulation > CMR 2017",
    risk: 91,
    sla: "Breached",
    sla_type: "breached",
    status: "Escalated",
    status_type: "escalated",
    mine_id: 1,
  },
  {
    id: 2,
    mine: "Raniganj UG Seam #2 (ECL)",
    case_id: "CASE-2026-RN-314",
    issue: "Ventilation non-compliance",
    risk: 76,
    sla: "Due in 2d",
    sla_type: "due_soon",
    status: "In Progress",
    status_type: "in_progress",
    mine_id: 2,
  },
  {
    id: 3,
    mine: "Talcher OC Mine (MCL)",
    case_id: "CASE-2026-TL-209",
    issue: "Overburden slope instability",
    risk: 68,
    sla: "Due in 3d",
    sla_type: "normal",
    status: "Open",
    status_type: "open",
    mine_id: 3,
  },
  {
    id: 4,
    mine: "Korba West Pit (SECL)",
    case_id: "CASE-2026-KB-112",
    issue: "Dust suppression inadequate",
    risk: 62,
    sla: "On Track",
    sla_type: "on_track",
    status: "Open",
    status_type: "open",
    mine_id: 4,
  },
];

export const PriorityAttentionTable = ({ attentionData, onSelectCase }) => {
  const navigate = useNavigate();
  const cases = (attentionData && attentionData.length > 0) ? attentionData : DEFAULT_ATTENTION_CASES;

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Priority Attention</h3>
            <p className="text-[11px] text-text-secondary">AI-identified high priority cases requiring action</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/violations')}
          className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-brand-emerald transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table List */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-text-muted uppercase text-[10px] font-bold border-b border-brand-border/60">
              <th className="py-2.5 px-3">Mine</th>
              <th className="py-2.5 px-3">Case ID</th>
              <th className="py-2.5 px-3">Issue</th>
              <th className="py-2.5 px-3 text-center">Risk</th>
              <th className="py-2.5 px-3">SLA</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-2 text-right">Explain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {cases.map((item, idx) => {
              const riskMeta = getRiskCategory(item.risk);
              const statusMeta = getStatusBadge(item.status);

              return (
                <tr
                  key={idx}
                  onClick={() => onSelectCase(item)}
                  className="hover:bg-brand-surface/70 cursor-pointer transition-colors group"
                >
                  {/* Mine Name */}
                  <td className="py-3 px-3 font-semibold text-text-primary group-hover:text-brand-emerald truncate max-w-[170px]">
                    {item.mine || item.mine_name}
                  </td>

                  {/* Case ID */}
                  <td className="py-3 px-3 font-mono text-[11px] text-text-secondary">
                    {item.case_id || item.violation_code}
                  </td>

                  {/* Issue description */}
                  <td className="py-3 px-3 text-text-secondary truncate max-w-[200px]">
                    {item.issue || item.title}
                  </td>

                  {/* Risk Badge */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${riskMeta.bg} ${riskMeta.color} ${riskMeta.border}`}>
                      {item.risk}
                    </span>
                  </td>

                  {/* SLA Badge */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.sla === 'Breached' || item.sla_breached
                          ? 'bg-status-critical/20 text-status-critical border border-status-critical/40'
                          : item.sla?.includes('Due in 2d')
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-brand-surface text-text-secondary border border-brand-border'
                      }`}
                    >
                      {item.sla || 'On Track'}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                      {statusMeta.label}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(item);
                      }}
                      title="Why am I seeing this risk?"
                      className="p-1 rounded-lg text-text-muted hover:text-brand-teal hover:bg-brand-card transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
