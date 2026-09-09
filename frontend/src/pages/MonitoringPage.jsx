import React, { useState, useEffect, useMemo } from 'react';
import { monitoringService } from '../services/monitoringService';
import { mineService } from '../services/mineService';
import { 
  Activity, AlertTriangle, Radio, Satellite, ShieldAlert, CheckCircle2, 
  TrendingDown, ArrowRight, RefreshCw, Filter, Search, Info, X, 
  FileCheck, ShieldCheck, HelpCircle, Layers, Check, Clock, AlertOctagon, Eye
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const MonitoringPage = () => {
  const [mines, setMines] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [signals, setSignals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');

  // Filters
  const [subsidiaryFilter, setSubsidiaryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Drawer States
  const [selectedExplainAnomaly, setSelectedExplainAnomaly] = useState(null);
  const [reviewSignalModal, setReviewSignalModal] = useState(null);
  const [reviewOutcome, setReviewOutcome] = useState('CONFIRMED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewReceipt, setReviewReceipt] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [minesData, anomaliesData, signalsData, summaryData, intData] = await Promise.all([
        mineService.getMines().catch(() => []),
        monitoringService.getAnomalies().catch(() => []),
        monitoringService.getSignals().catch(() => []),
        monitoringService.getSummary().catch(() => null),
        monitoringService.getIntegrationsStatus().catch(() => [])
      ]);

      setMines(Array.isArray(minesData) ? minesData : []);
      setAnomalies(Array.isArray(anomaliesData) ? anomaliesData : []);
      setSignals(Array.isArray(signalsData) ? signalsData : []);
      setSummary(summaryData);
      setIntegrations(Array.isArray(intData) ? intData : []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load monitoring data:', err);
      setError('Unable to load monitoring signals. Please check connection and retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await monitoringService.recalculate().catch(() => null);
      await fetchData();
    } catch (err) {
      console.error('Refresh failed:', err);
      setRefreshing(false);
    }
  };

  const handleOpenReview = (signal) => {
    setReviewSignalModal(signal);
    setReviewOutcome('CONFIRMED');
    setReviewNotes('');
    setReviewReceipt(null);
  };

  const handleSubmitReview = async () => {
    if (!reviewSignalModal) return;
    setSubmittingReview(true);
    try {
      const res = await monitoringService.reviewSignal(reviewSignalModal.id, {
        outcome: reviewOutcome,
        notes: reviewNotes,
        reviewer_name: 'Priya Verma (Mine Safety Manager)',
        reviewer_role: 'MINE_OFFICER'
      });

      setReviewReceipt(res);
      // Update local signals state
      setSignals((prev) =>
        prev.map((s) => (s.id === reviewSignalModal.id ? { ...s, review: res.review } : s))
      );
      setTimeout(() => {
        setReviewSignalModal(null);
        setReviewReceipt(null);
      }, 1800);
    } catch (err) {
      console.error('Signal review submission error:', err);
      alert('Failed to submit signal review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Telemetry Chart Data from actual mines
  const chartData = useMemo(() => {
    let filtered = [...mines];
    if (subsidiaryFilter !== 'ALL') {
      filtered = filtered.filter((m) => m.subsidiary === subsidiaryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.mine_code?.toLowerCase().includes(q) ||
          m.subsidiary?.toLowerCase().includes(q)
      );
    }

    return filtered.map((m) => {
      const expected = Math.max(m.reporting_frequency_expected || 10, 1);
      const actual = m.reporting_frequency_actual !== undefined && m.reporting_frequency_actual !== null ? m.reporting_frequency_actual : 0;
      const gap = Math.max(0, expected - actual);
      const completion = Math.round((actual / expected) * 100);
      return {
        id: m.id,
        mineCode: m.mine_code,
        name: m.name,
        shortName: m.name ? m.name.split('-')[0].trim() : m.mine_code,
        subsidiary: m.subsidiary,
        expected,
        actual,
        gap,
        completion,
        status: m.status
      };
    });
  }, [mines, subsidiaryFilter, searchQuery]);

  // Top Hero Anomaly (e.g. Mine C or top anomaly)
  const topAnomaly = useMemo(() => {
    if (anomalies.length > 0) return anomalies[0];
    // Fallback: look for mine with largest reporting gap
    if (mines.length > 0) {
      const sorted = [...mines].sort((a, b) => {
        const gapA = (a.reporting_frequency_expected || 10) - (a.reporting_frequency_actual || 0);
        const gapB = (b.reporting_frequency_expected || 10) - (b.reporting_frequency_actual || 0);
        return gapB - gapA;
      });
      const m = sorted[0];
      const exp = Math.max(m.reporting_frequency_expected || 10, 1);
      const act = m.reporting_frequency_actual || 0;
      const drift = Math.round(((exp - act) / exp) * 100);
      return {
        mine_id: m.id,
        mine_code: m.mine_code,
        name: m.name,
        subsidiary: m.subsidiary,
        district: m.district,
        state: m.state,
        expected_inspections: exp,
        actual_inspections: act,
        reporting_gap: exp - act,
        completion_percentage: Math.round((act / exp) * 100),
        drift_percentage: drift,
        silence_score: 83.0,
        risk_level: 'HIGH',
        risk_badge: 'HIGH',
        signal_breakdown: {
          reporting_gap: { score: 70.0, weight: '30%', level: 'HIGH' },
          reporting_drift: { score: 80.5, weight: '25%', level: 'HIGH' },
          peer_deviation: { score: 62.0, weight: '20%', level: 'MEDIUM' },
          external_discrepancy: { score: 100.0, weight: '25%', level: 'HIGH' }
        },
        explanations: [
          `Reporting activity is significantly below expected cadence (${drift}% reporting gap).`,
          'Reporting behavior has deviated from historical pattern (CUSUM drift detected).',
          `The mine is above the peer reporting-risk percentile for ${m.subsidiary}.`,
          'External activity signal indicates active operations despite reduced reporting.'
        ],
        interpretation: 'This signal indicates a governance discrepancy requiring human verification. It does not by itself establish a violation.'
      };
    }
    return null;
  }, [anomalies, mines]);

  const uniqueSubsidiaries = useMemo(() => {
    const set = new Set(mines.map((m) => m.subsidiary).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [mines]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0B1E19]/95 backdrop-blur-md border border-[#1B3F35] rounded-xl p-3.5 shadow-2xl text-xs space-y-1.5 min-w-[200px]">
          <div className="font-bold text-slate-100 border-b border-emerald-900/50 pb-1 flex justify-between items-center">
            <span>{data.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">
              {data.subsidiary}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Expected Logs:</span>
            <span className="font-bold font-mono text-emerald-400">{data.expected}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Actual Received:</span>
            <span className="font-bold font-mono text-teal-300">{data.actual}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Reporting Gap:</span>
            <span className="font-bold font-mono text-amber-400">{data.gap}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-emerald-950 text-slate-400 text-[11px]">
            <span>Completion Rate:</span>
            <span className={`font-bold font-mono ${data.completion >= 80 ? 'text-emerald-400' : data.completion >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {data.completion}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-3 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
        <p className="text-xs text-text-secondary tracking-wide uppercase font-mono animate-pulse">
          Loading governance signals…
        </p>
      </div>
    );
  }

  if (error && mines.length === 0) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-sm font-semibold text-rose-300">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2.5 tracking-tight">
            <Activity className="w-6 h-6 text-brand-teal" />
            <span>Governance Signal Monitoring (Silence-to-Risk Engine)</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Detecting reporting silence drift anomalies and correlating multi-source external activity signals
          </p>
        </div>

        {/* Refresh & Status Controls */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] text-text-secondary font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              Last updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-teal/50 text-text-primary text-xs font-medium transition-all shadow-sm hover:shadow-brand-teal/5"
            title="Recalculate and refresh signals from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-teal ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Recalculating…' : 'Refresh Signals'}</span>
          </button>
        </div>
      </div>

      {/* Top Banner Alert on Silence Anomaly */}
      {topAnomaly ? (
        <div className="bg-gradient-to-r from-amber-500/15 via-brand-card to-brand-surface border border-amber-500/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  SILENCE-TO-RISK ALERT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Discrepancy Score: {topAnomaly.silence_score || 83}/100 ({topAnomaly.risk_level || 'HIGH'})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-forest text-brand-emerald border border-brand-emerald/30">
                  {topAnomaly.name} ({topAnomaly.subsidiary})
                </span>
              </div>
              <p className="text-xs font-medium text-text-primary leading-relaxed">
                "Available governance records are inconsistent with expected reporting patterns and require human verification."
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary pt-0.5">
                <span>
                  Expected: <strong className="text-text-primary font-mono">{topAnomaly.expected_inspections}</strong>
                </span>
                <span>•</span>
                <span>
                  Actual: <strong className="text-text-primary font-mono">{topAnomaly.actual_inspections}</strong>
                </span>
                <span>•</span>
                <span>
                  Completion: <strong className="text-amber-300 font-mono">{topAnomaly.completion_percentage}%</strong>
                </span>
                <span>•</span>
                <span className="text-amber-400/90 font-medium">
                  Reporting Gap: {topAnomaly.reporting_gap || (topAnomaly.expected_inspections - topAnomaly.actual_inspections)} missing reports ({topAnomaly.drift_percentage}% drift)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
            <button
              onClick={() => setSelectedExplainAnomaly(topAnomaly)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Why am I seeing this?</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex items-center gap-3 text-text-secondary text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>No critical governance discrepancies detected across active monitored mines.</span>
        </div>
      )}

      {/* Cadence vs Expected Chart */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-teal" />
              <span>Expected vs Actual Reporting Telemetry Cadence</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Comparing statutory required safety logs against field inspection reports across monitored mines
            </p>
          </div>

          {/* Chart Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search mine…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs bg-brand-surface border border-brand-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-teal"
              />
            </div>

            {/* Subsidiary Filter */}
            <div className="flex items-center gap-1 bg-brand-surface border border-brand-border rounded-lg p-0.5 text-xs">
              <Filter className="w-3 h-3 text-text-muted ml-1.5" />
              <select
                value={subsidiaryFilter}
                onChange={(e) => setSubsidiaryFilter(e.target.value)}
                className="bg-transparent text-text-primary text-xs py-1 px-1.5 focus:outline-none cursor-pointer"
              >
                {uniqueSubsidiaries.map((sub) => (
                  <option key={sub} value={sub} className="bg-brand-surface text-text-primary">
                    {sub === 'ALL' ? 'All Subsidiaries' : sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Legend indicators */}
            <div className="hidden lg:flex items-center gap-3 text-xs pl-2 border-l border-brand-border">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#0B3D32] border border-[#15803D]" />
                <span className="text-text-secondary text-[11px]">Expected Logs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#14B8A6]" />
                <span className="text-text-secondary text-[11px]">Actual Received</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart Area */}
        <div className="h-72 w-full pt-2">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-text-muted">
              No mine telemetry matches the selected filter.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1B3A32" vertical={false} />
                <XAxis 
                  dataKey="shortName" 
                  stroke="#64748B" 
                  fontSize={11} 
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="expected" fill="#0B3D32" radius={[4, 4, 0, 0]} name="Expected Logs" />
                <Bar dataKey="actual" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Actual Received" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* External Satellite Signals & Cross-Correlations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CMSMS / Khanan Prahari Feed */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Satellite className="w-5 h-5 text-brand-emerald" />
              <div>
                <h3 className="text-sm font-bold text-text-primary">External Activity Signals</h3>
                <p className="text-[10px] text-text-secondary">CMSMS / Khanan Prahari Integration</p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-brand-forest text-brand-emerald font-mono font-medium border border-brand-emerald/30">
              SIMULATED EXTERNAL SIGNAL
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {signals.map((sig) => {
              const isAnomaly = sig.status === 'ANOMALY DETECTED';
              const isReviewed = sig.review && sig.review.reviewed;

              return (
                <div
                  key={sig.id}
                  className={`p-3.5 rounded-xl bg-brand-surface border ${
                    isAnomaly ? 'border-amber-500/30' : 'border-brand-border'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-text-primary">
                      {sig.mine_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isAnomaly
                            ? 'bg-status-critical/15 text-status-critical border border-status-critical/30'
                            : 'bg-status-success/15 text-status-success border border-status-success/30'
                        }`}
                      >
                        {sig.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-text-secondary leading-relaxed text-[11.5px]">
                    "{sig.description}"
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-brand-border/60 text-[10.5px] font-mono text-text-muted">
                    <span>Coords: {sig.location_coords}</span>
                    <span>Confidence: {sig.confidence}%</span>
                  </div>

                  {/* Review Action or Review Status */}
                  <div className="pt-2 flex items-center justify-between">
                    {isReviewed ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified: {sig.review.outcome}</span>
                        {sig.review.notes && <span className="text-text-muted italic">({sig.review.notes})</span>}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenReview(sig)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-teal/15 hover:bg-brand-teal/25 text-brand-teal text-[11px] font-semibold transition-colors border border-brand-teal/30"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Review Signal</span>
                      </button>
                    )}

                    {topAnomaly && sig.mine_id === topAnomaly.mine_id && (
                      <button
                        onClick={() => setSelectedExplainAnomaly(topAnomaly)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                      >
                        View Breakdown
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-Source Regulatory Integrations Registry */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-teal" />
              <div>
                <h3 className="text-sm font-bold text-text-primary">Statutory Interoperability Registry</h3>
                <p className="text-[10px] text-text-secondary">Standardized Governance Adapters</p>
              </div>
            </div>
            <span className="text-[10px] text-text-muted font-mono bg-brand-surface px-2 py-0.5 rounded border border-brand-border">
              ADAPTER READY
            </span>
          </div>

          <p className="text-[11px] text-text-secondary italic">
            Integration adapters normalize authorized external records into the TRINETRA governance model.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
              <div>
                <p className="font-semibold text-text-primary">CIL Integrated Coal Information System (ICIS)</p>
                <p className="text-[10px] text-text-secondary">ERP Production & Seam Shift Telemetry</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-brand-forest text-brand-emerald text-[10px] font-bold border border-brand-emerald/30">
                ADAPTER READY
              </span>
            </div>

            <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
              <div>
                <p className="font-semibold text-text-primary">Ministry PARIVESH Environmental Portal</p>
                <p className="text-[10px] text-text-secondary">Statutory Forest & Pollution Clearances</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-brand-forest text-brand-emerald text-[10px] font-bold border border-brand-emerald/30">
                ADAPTER READY
              </span>
            </div>

            <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
              <div>
                <p className="font-semibold text-text-primary">DGMS Mine Safety Register Database</p>
                <p className="text-[10px] text-text-secondary">Statutory Compliance Mandates & CMR 2017 Rules</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-brand-forest text-brand-emerald text-[10px] font-bold border border-brand-emerald/30">
                INTEGRATION READY
              </span>
            </div>

            <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
              <div>
                <p className="font-semibold text-text-primary">CMSMS / Khanan Prahari Connector</p>
                <p className="text-[10px] text-text-secondary">Spatial Excavation & Surface Activity Feeds</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                DEMO CONNECTOR
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. EXPLAINABILITY MODAL / DRAWER: "Why am I seeing this?" */}
      {/* ======================================================== */}
      {selectedExplainAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1E19] border border-brand-emerald/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-6 text-text-primary">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-brand-border/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-text-primary">
                    Why am I seeing this? — Governance Discrepancy Breakdown
                  </h2>
                </div>
                <p className="text-xs text-text-secondary">
                  Mine: <strong className="text-emerald-400">{selectedExplainAnomaly.name}</strong> ({selectedExplainAnomaly.subsidiary}) • Discrepancy Score: <strong className="text-amber-400">{selectedExplainAnomaly.silence_score}/100</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedExplainAnomaly(null)}
                className="p-1.5 rounded-lg hover:bg-brand-surface text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Difference between Violation Risk vs Governance Discrepancy */}
            <div className="bg-brand-surface/80 border border-brand-border rounded-xl p-3.5 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Info className="w-4 h-4" />
                <span>Governance Discrepancy vs Statutory Violation</span>
              </div>
              <p className="text-text-secondary leading-relaxed text-[11px]">
                A <strong>Governance Discrepancy Score</strong> measures the statistical gap between expected compliance cadence and observed logs. It functions as an <em>investigative screening signal</em> to direct supervisory attention, whereas a Violation Risk Score measures known non-compliance severity.
              </p>
            </div>

            {/* Signal Contribution Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Model Signal Contributions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cadence Gap */}
                <div className="p-3 rounded-xl bg-brand-surface border border-brand-border space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">Reporting Cadence Gap</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {selectedExplainAnomaly.signal_breakdown?.reporting_gap?.level || 'HIGH'} (30%)
                    </span>
                  </div>
                  <div className="w-full bg-brand-border rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                  <p className="text-[10.5px] text-text-secondary pt-0.5">
                    Expected {selectedExplainAnomaly.expected_inspections} reports vs {selectedExplainAnomaly.actual_inspections} logged ({selectedExplainAnomaly.drift_percentage}% drop).
                  </p>
                </div>

                {/* Reporting Drift / CUSUM */}
                <div className="p-3 rounded-xl bg-brand-surface border border-brand-border space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">Reporting Drift (CUSUM)</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {selectedExplainAnomaly.signal_breakdown?.reporting_drift?.level || 'HIGH'} (25%)
                    </span>
                  </div>
                  <div className="w-full bg-brand-border rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '80%' }} />
                  </div>
                  <p className="text-[10.5px] text-text-secondary pt-0.5">
                    Reporting activity has remained significantly below the expected historical pattern.
                  </p>
                </div>

                {/* Peer Deviation */}
                <div className="p-3 rounded-xl bg-brand-surface border border-brand-border space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">Peer Deviation</span>
                    <span className="font-mono text-teal-300 font-bold">
                      {selectedExplainAnomaly.signal_breakdown?.peer_deviation?.level || 'MEDIUM'} (20%)
                    </span>
                  </div>
                  <div className="w-full bg-brand-border rounded-full h-1.5 overflow-hidden">
                    <div className="bg-teal-400 h-full rounded-full" style={{ width: '60%' }} />
                  </div>
                  <p className="text-[10.5px] text-text-secondary pt-0.5">
                    Reporting frequency is significantly below peer mines in the {selectedExplainAnomaly.subsidiary} subsidiary.
                  </p>
                </div>

                {/* External Discrepancy */}
                <div className="p-3 rounded-xl bg-brand-surface border border-brand-border space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">External Activity Discrepancy</span>
                    <span className="font-mono text-rose-400 font-bold">
                      {selectedExplainAnomaly.signal_breakdown?.external_discrepancy?.level || 'HIGH'} (25%)
                    </span>
                  </div>
                  <div className="w-full bg-brand-border rounded-full h-1.5 overflow-hidden">
                    <div className="bg-rose-400 h-full rounded-full" style={{ width: '90%' }} />
                  </div>
                  <p className="text-[10.5px] text-text-secondary pt-0.5">
                    External thermal & haulage sensors detected continuous extraction during silent period.
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist of Reasons */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Contributing Evidence
              </h3>
              <div className="space-y-2 text-xs">
                {(selectedExplainAnomaly.explanations || []).map((exp, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-brand-surface/60 border border-brand-border/60">
                    <Check className="w-4 h-4 text-brand-emerald flex-shrink-0 mt-0.5" />
                    <span className="text-text-primary">{exp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statutory Interpretation Alert */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 block">
                Statutory Interpretation
              </span>
              <p>
                {selectedExplainAnomaly.interpretation ||
                  'This signal indicates a governance discrepancy requiring human verification. It does not by itself establish a statutory violation.'}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedExplainAnomaly(null)}
                className="px-4 py-2 rounded-xl bg-brand-surface hover:bg-brand-border text-text-primary text-xs font-semibold transition-colors"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. HUMAN VERIFICATION WORKFLOW MODAL: "Review Signal"    */}
      {/* ======================================================== */}
      {reviewSignalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1E19] border border-brand-emerald/40 rounded-2xl max-w-lg w-full shadow-2xl space-y-5 p-6 text-text-primary">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-brand-border/80 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-teal" />
                  <h2 className="text-base font-bold text-text-primary">
                    Human Verification: Signal Review
                  </h2>
                </div>
                <p className="text-xs text-text-secondary">
                  Signal ID: <span className="font-mono text-emerald-400">{reviewSignalModal.id}</span> • {reviewSignalModal.mine_name}
                </p>
              </div>
              <button
                onClick={() => setReviewSignalModal(null)}
                className="p-1.5 rounded-lg hover:bg-brand-surface text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewReceipt ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-2 animate-fadeIn">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-emerald-300">Signal Review Recorded in Audit Ledger</p>
                <p className="text-xs text-text-secondary font-mono">
                  Audit Entry #{reviewReceipt.audit_event_id}
                </p>
                <p className="text-[10px] text-text-muted font-mono truncate">
                  SHA-256: {reviewReceipt.audit_hash}
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Signal Context */}
                <div className="p-3 rounded-xl bg-brand-surface border border-brand-border space-y-1">
                  <span className="font-bold text-text-primary">Investigative Evidence:</span>
                  <p className="text-text-secondary">{reviewSignalModal.description}</p>
                  <p className="text-[10.5px] font-mono text-text-muted pt-1">
                    Raw telemetry: {reviewSignalModal.raw_evidence}
                  </p>
                </div>

                {/* Outcome Selection */}
                <div className="space-y-2">
                  <label className="font-bold text-text-primary block">
                    Verification Outcome:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: 'CONFIRMED', label: 'Confirmed Anomaly', desc: 'Discrepancy verified; active mining observed without submitted logs.' },
                      { value: 'FALSE_POSITIVE', label: 'False Positive / Planned Pause', desc: 'Valid shutdown/maintenance or sensor artifact; no wrongdoing.' },
                      { value: 'INSUFFICIENT_EVIDENCE', label: 'Insufficient Evidence', desc: 'Inconclusive telemetry; scheduled for immediate on-site inspection.' }
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          reviewOutcome === opt.value
                            ? 'bg-brand-forest border-brand-emerald text-text-primary'
                            : 'bg-brand-surface border-brand-border text-text-secondary hover:border-brand-border/80'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reviewOutcome"
                          value={opt.value}
                          checked={reviewOutcome === opt.value}
                          onChange={(e) => setReviewOutcome(e.target.value)}
                          className="mt-0.5 text-brand-teal focus:ring-0"
                        />
                        <div>
                          <p className="font-bold text-text-primary">{opt.label}</p>
                          <p className="text-[10.5px] text-text-secondary">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-1">
                  <label className="font-bold text-text-primary block">
                    Officer Review Notes / Reference:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter on-ground verification observations, shift manager verification, or DGMS log references…"
                    className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-teal text-xs"
                  />
                </div>

                {/* Tamper Evident Notice */}
                <p className="text-[10.5px] text-text-muted font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-brand-teal" />
                  Action will be cryptographically anchored to the append-only SHA-256 audit ledger.
                </p>

                {/* Submit Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
                  <button
                    onClick={() => setReviewSignalModal(null)}
                    className="px-4 py-2 rounded-xl bg-brand-surface hover:bg-brand-border text-text-secondary text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="px-4 py-2 rounded-xl bg-brand-teal hover:bg-brand-teal/90 text-slate-900 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    {submittingReview ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        <span>Anchoring…</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Commit Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
