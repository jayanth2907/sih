import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { violationService } from '../services/violationService';
import { AlertOctagon, Search, Filter, HelpCircle, ArrowRight, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { getRiskCategory, getStatusBadge, getSeverityBadge, formatDateTime } from '../utils/formatters';
import { WhyThisRiskDrawer } from '../components/risk/WhyThisRiskDrawer';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const ViolationsPage = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedCaseForDrawer, setSelectedCaseForDrawer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const fetchViolations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await violationService.getViolations();
      setViolations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch violations:', err);
      setError('Unable to load statutory violations from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const filteredViolations = violations.filter((v) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.violation_code?.toLowerCase().includes(q) ||
      v.title?.toLowerCase().includes(q) ||
      v.description?.toLowerCase().includes(q);

    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ESCALATED') {
        matchesStatus = v.is_escalated === true || v.status?.toUpperCase() === 'ESCALATED';
      } else {
        matchesStatus = v.status?.toUpperCase() === statusFilter.toUpperCase();
      }
    }

    const matchesSev = severityFilter === 'ALL' || v.severity?.toUpperCase() === severityFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesSev;
  });

  const handleOpenDrawer = (item, e) => {
    e.stopPropagation();
    setSelectedCaseForDrawer({
      id: item.id,
      violation_code: item.violation_code,
      case_id: item.violation_code,
      risk: item.priority_score,
      mine: `Mine ID #${item.mine_id}`,
      issue: item.title,
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 text-status-critical" />
            <span>Violations & Compliance Case Management</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Tracking statutory breaches, multi-factor risk prioritization, SLA timelines & remediation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-text-secondary">
            Total Cases: <strong className="text-text-primary font-mono text-status-critical">{violations.length}</strong>
          </span>
          <button
            onClick={fetchViolations}
            disabled={loading}
            title="Refresh Violations"
            className="p-2 rounded-xl bg-brand-surface border border-brand-border text-text-secondary hover:text-brand-emerald transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-emerald' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search violation code (e.g. VIOL-2026-001, V-1024), title, or description..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-emerald"
          />
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-44 px-3 py-2 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-emerald"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="VERIFIED">Verified</option>
          <option value="CLOSED">Closed</option>
          <option value="ESCALATED">Escalated</option>
        </select>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-full md:w-44 px-3 py-2 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-emerald"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 rounded-2xl bg-status-critical/15 border border-status-critical/40 flex items-center justify-between">
          <div className="flex items-center gap-3 text-status-critical text-xs font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchViolations}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-status-critical text-white hover:bg-rose-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Violations Table */}
      {loading ? (
        <TableSkeleton rows={4} cols={7} />
      ) : filteredViolations.length === 0 ? (
        <EmptyState
          icon={AlertOctagon}
          title="No violations match your filter"
          description="There are no statutory violation cases matching your current search or filter criteria."
          actionText="Reset Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('ALL');
            setSeverityFilter('ALL');
          }}
        />
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-surface/80 text-text-muted uppercase text-[10px] font-bold border-b border-brand-border">
                  <th className="py-3 px-4">Case Code</th>
                  <th className="py-3 px-4">Violation Details</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4 text-center">Risk Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date / SLA</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredViolations.map((v) => {
                  const riskMeta = getRiskCategory(v.priority_score);
                  const statusMeta = getStatusBadge(v.status);
                  const sevMeta = getSeverityBadge(v.severity);

                  return (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/violations/${v.id}`)}
                      className="hover:bg-brand-surface/70 cursor-pointer transition-colors group"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-teal group-hover:text-brand-emerald transition-colors">
                        {v.violation_code}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 max-w-[340px]">
                        <p className="font-bold text-text-primary truncate">{v.title}</p>
                        {v.description && (
                          <p className="text-[11px] text-text-secondary truncate mt-0.5">{v.description}</p>
                        )}
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${sevMeta.bg} ${sevMeta.color} ${sevMeta.border}`}>
                          {sevMeta.label}
                        </span>
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${riskMeta.bg} ${riskMeta.color} ${riskMeta.border}`}>
                          {v.priority_score !== undefined && v.priority_score !== null ? Number(v.priority_score).toFixed(1) : '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 text-text-secondary">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-text-muted" />
                          <span>{formatDateTime(v.due_at)}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleOpenDrawer(v, e)}
                            title="SHAP Feature Attribution"
                            className="p-1.5 rounded-lg bg-brand-surface border border-brand-border text-text-muted hover:text-brand-teal hover:border-brand-teal/40 transition-colors"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/violations/${v.id}`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-xs font-semibold text-brand-emerald hover:bg-brand-forest transition-colors flex items-center gap-1"
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SHAP Explainability Drawer */}
      <WhyThisRiskDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedCase={selectedCaseForDrawer}
      />
    </div>
  );
};
