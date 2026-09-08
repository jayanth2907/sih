import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { violationService } from '../services/violationService';
import { riskService } from '../services/riskService';
import { useToast } from '../context/ToastContext';
import {
  AlertOctagon,
  ArrowLeft,
  Clock,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Send,
  FileCheck,
  UserCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { getRiskCategory, getStatusBadge, getSeverityBadge, formatDateTime } from '../utils/formatters';

const STATUS_ORDER = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export const ViolationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [violation, setViolation] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vData, xData] = await Promise.all([
          violationService.getViolationById(id).catch(() => null),
          riskService.explainViolation(id).catch(() => null),
        ]);
        if (vData) setViolation(vData);
        if (xData) setExplanation(xData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleStatusTransition = async (nextStatus) => {
    setIsUpdating(true);
    try {
      await violationService.updateStatus(id, nextStatus);
      setViolation((prev) => ({ ...prev, status: nextStatus }));
      showToast(`Violation status transitioned to ${nextStatus}`, 'success');
    } catch (err) {
      showToast(`Simulated status update to ${nextStatus}`, 'info');
      setViolation((prev) => ({ ...prev, status: nextStatus }));
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-text-muted">
        <p className="text-sm font-semibold">Loading case records & ML explainability...</p>
      </div>
    );
  }

  const v = violation || {
    id: id,
    violation_code: `V-${id || '1024'}`,
    title: "Methane Gas Accumulation Exceeds Statutory Thresholds",
    description: "Multi-point telemetry detected CH4 concentrations at 1.45% in active working seam #4, exceeding DGMS statutory limit of 0.75%.",
    severity: "CRITICAL",
    status: "OPEN",
    priority_score: 87.85,
    due_at: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    is_escalated: false,
  };

  const riskMeta = getRiskCategory(v.priority_score || 50);
  const statusMeta = getStatusBadge(v.status);
  const sevMeta = getSeverityBadge(v.severity);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate('/violations')}
        className="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-brand-emerald transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Violations Board</span>
      </button>

      {/* Main Header Card */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-brand-forest text-brand-emerald border border-brand-emerald/30">
                {v.violation_code}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sevMeta.bg} ${sevMeta.color} ${sevMeta.border}`}>
                {sevMeta.label}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                {statusMeta.label}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
              {v.title}
            </h1>
            <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
              {v.description}
            </p>
          </div>

          {/* Unified Risk Score Metric */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4 text-center min-w-[130px] self-start md:self-auto">
            <span className="text-[10px] font-bold text-text-muted uppercase">Unified Risk</span>
            <p className={`text-3xl font-extrabold font-mono mt-1 ${riskMeta.color}`}>
              {v.priority_score || 87.85}
            </p>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${riskMeta.bg} ${riskMeta.color}`}>
              {riskMeta.label}
            </span>
          </div>
        </div>

        {/* SLA Status & Governance Lifeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-brand-border/60 text-xs">
          <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-text-muted text-[10px] uppercase font-bold">Statutory SLA Window</p>
              <p className="text-text-primary font-mono font-semibold">{formatDateTime(v.due_at)}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-brand-teal flex-shrink-0" />
            <div>
              <p className="text-text-muted text-[10px] uppercase font-bold">Assigned Mine Officer</p>
              <p className="text-text-primary font-semibold">Rajesh Sharma (Senior Safety Officer)</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-brand-emerald flex-shrink-0" />
            <div>
              <p className="text-text-muted text-[10px] uppercase font-bold">Governing Safety Code</p>
              <p className="text-brand-emerald font-mono font-bold">DGMS CMR 2017 Reg 128</p>
            </div>
          </div>
        </div>
      </div>

      {/* State Machine Status Transition Workflow */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
          <RotateCw className="w-4 h-4 text-brand-emerald" />
          <span>Statutory Governance State Machine Transition</span>
        </h3>

        {/* Step Progress Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STATUS_ORDER.map((st, idx) => {
            const isCurrent = v.status === st;
            const currentIndex = STATUS_ORDER.indexOf(v.status);
            const isPassed = currentIndex >= idx;

            return (
              <button
                key={st}
                disabled={isUpdating}
                onClick={() => handleStatusTransition(st)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-brand-forest border-brand-emerald text-brand-emerald font-bold shadow-glow-emerald'
                    : isPassed
                    ? 'bg-brand-surface border-brand-emerald/30 text-text-primary'
                    : 'bg-brand-surface/40 border-brand-border text-text-muted hover:border-brand-border-light'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-brand-border text-[9px] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                  )}
                </div>
                <p className="text-[11px] uppercase tracking-wider">{st.replace('_', ' ')}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* SHAP Feature Attribution Factors */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-teal" />
            <span>SHAP Explainable AI Feature Attribution</span>
          </h3>
          <span className="text-[10px] font-mono text-text-muted">Model: xgboost-v1.2-shap</span>
        </div>

        <div className="space-y-2">
          {(explanation?.primary_reasons || [
            { factor: "4 similar statutory violations logged in past 30 days", impact: "+20 pts" },
            { factor: "Field reporting frequency decreased 75% (Silence Drift)", impact: "+19 pts" },
            { factor: "Mine risk profile is in 92nd percentile amongst peer mines", impact: "+15 pts" },
            { factor: "External satellite signal detected active mining vs zero field reports", impact: "+12 pts" },
          ]).map((r, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between text-xs">
              <span className="text-text-primary">{r.factor}</span>
              <span className="font-mono font-bold text-status-critical px-2 py-0.5 rounded bg-status-critical/15 border border-status-critical/30">
                {r.impact}
              </span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-brand-forest/40 border border-brand-emerald/30 text-xs">
          <p className="font-bold text-brand-emerald mb-0.5">Recommended Enforcement Protocol:</p>
          <p className="text-text-secondary">
            {explanation?.recommended_action || "CRITICAL ESCALATION: Dispatch DGMS Regional Inspector & halt operations in affected seam within 24h."}
          </p>
        </div>
      </div>
    </div>
  );
};
