import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { mineService } from '../services/mineService';
import {
  BarChart3, TrendingUp, ShieldCheck, CheckCircle2, Calendar, Filter,
  Download, RefreshCw, Layers, AlertTriangle, AlertOctagon, HelpCircle,
  ExternalLink, ArrowUpRight, ArrowDownRight, Clock, Info, Check, ShieldAlert,
  ChevronRight, Building2, Eye, Shield
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend, Cell
} from 'recharts';

export const AnalyticsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read initial range from URL query param or fallback to '30D'
  const initialRange = (searchParams.get('range') || '30d').toUpperCase();
  const [timeRange, setTimeRange] = useState(['7D', '30D', '90D', '1Y'].includes(initialRange) ? initialRange : '30D');
  const [subsidiaryFilter, setSubsidiaryFilter] = useState('ALL');
  const [mineIdFilter, setMineIdFilter] = useState('ALL');

  const [analyticsData, setAnalyticsData] = useState(null);
  const [minesList, setMinesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Sync timeRange with URL param
  const handleRangeChange = (range) => {
    setTimeRange(range);
    setSearchParams({ range: range.toLowerCase() });
  };

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setError(null);
      const mId = mineIdFilter !== 'ALL' ? Number(mineIdFilter) : null;
      const [data, minesRes] = await Promise.all([
        analyticsService.getOverview(timeRange, subsidiaryFilter, mId),
        mineService.getMines().catch(() => [])
      ]);

      setAnalyticsData(data);
      setMinesList(Array.isArray(minesRes) ? minesRes : []);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Unable to load analytics for the selected period.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, subsidiaryFilter, mineIdFilter]);

  const availableSubsidiaries = useMemo(() => {
    if (analyticsData?.available_subsidiaries) {
      return analyticsData.available_subsidiaries;
    }
    const set = new Set(minesList.map((m) => m.subsidiary).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [analyticsData, minesList]);

  // Color palette for subsidiaries
  const SUB_COLORS = {
    BCCL: '#F43F5E',
    ECL: '#FB923C',
    NCL: '#F59E0B',
    MCL: '#10B981',
    SECL: '#06B6D4',
    CCL: '#8B5CF6',
    SelectedMine: '#38BDF8'
  };

  // Custom Tooltip for Risk Trajectory
  const CustomTrajectoryTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B1E19]/95 backdrop-blur-md border border-[#1B3F35] rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
          <p className="font-bold text-slate-100 border-b border-emerald-900/50 pb-1 flex justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-text-muted font-mono">{timeRange} Window</span>
          </p>
          <div className="space-y-1 pt-0.5">
            {payload.map((entry) => (
              <div key={entry.dataKey} className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.dataKey === 'SelectedMine' ? 'Selected Mine' : entry.dataKey}:
                </span>
                <span className="font-bold font-mono text-slate-100">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for SLA Performance
  const CustomSlaTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0B1E19]/95 backdrop-blur-md border border-[#1B3F35] rounded-xl p-3 shadow-2xl text-xs space-y-1 min-w-[160px]">
          <p className="font-bold text-slate-100">{data.name}</p>
          <div className="flex justify-between text-slate-300">
            <span>Remediations:</span>
            <span className="font-bold font-mono text-emerald-400">{data.count}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Percentage:</span>
            <span className="font-bold font-mono text-teal-300">{data.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleExportCsv = () => {
    const mId = mineIdFilter !== 'ALL' ? Number(mineIdFilter) : null;
    const url = analyticsService.exportCsvUrl(timeRange, subsidiaryFilter, mId);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2.5 tracking-tight">
            <BarChart3 className="w-6 h-6 text-brand-emerald" />
            <span>Governance Analytics & Peer Benchmarking</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Enterprise compliance intelligence, subsidiary risk trajectories, and SLA fulfillment metrics
          </p>
        </div>

        {/* Global Controls: Time Range & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-brand-surface p-1 rounded-xl border border-brand-border text-xs">
            {['7D', '30D', '90D', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => handleRangeChange(range)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-brand-emerald text-brand-bg shadow-glow-emerald font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-teal text-text-primary text-xs font-semibold transition-all shadow-sm"
            title="Export CSV breakdown"
          >
            <Download className="w-3.5 h-3.5 text-brand-teal" />
            <span>Export CSV</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="p-1.5 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-teal text-text-secondary hover:text-text-primary transition-all shadow-sm"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 text-brand-teal ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Slicing Bar (Subsidiary & Mine Cohort) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-card border border-brand-border rounded-2xl p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-text-secondary">
            <Filter className="w-3.5 h-3.5 text-brand-teal" />
            <span>Cohort Slicing:</span>
          </div>

          {/* Subsidiary Dropdown */}
          <div className="flex items-center gap-1 bg-brand-surface border border-brand-border rounded-xl px-2.5 py-1">
            <span className="text-text-muted text-[11px]">Subsidiary:</span>
            <select
              value={subsidiaryFilter}
              onChange={(e) => setSubsidiaryFilter(e.target.value)}
              className="bg-transparent text-text-primary text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {availableSubsidiaries.map((sub) => (
                <option key={sub} value={sub} className="bg-brand-surface text-text-primary">
                  {sub === 'ALL' ? 'All Subsidiaries (CIL)' : sub}
                </option>
              ))}
            </select>
          </div>

          {/* Mine Selector Dropdown */}
          <div className="flex items-center gap-1 bg-brand-surface border border-brand-border rounded-xl px-2.5 py-1">
            <span className="text-text-muted text-[11px]">Mine:</span>
            <select
              value={mineIdFilter}
              onChange={(e) => setMineIdFilter(e.target.value)}
              className="bg-transparent text-text-primary text-xs font-semibold focus:outline-none cursor-pointer max-w-[200px]"
            >
              <option value="ALL" className="bg-brand-surface text-text-primary">
                All Monitored Mines (10)
              </option>
              {minesList.map((m) => (
                <option key={m.id} value={m.id} className="bg-brand-surface text-text-primary">
                  {m.name} ({m.subsidiary})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notice Badge */}
        <span className="text-[10px] font-mono text-text-muted bg-brand-surface px-2 py-0.5 rounded-full border border-brand-border">
          {analyticsData?.dataset_notice || 'Demo Analytics Dataset (Fixed Seed 26024)'}
        </span>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Governance Response Score */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-text-muted text-[11px]">
            <span>Governance Response Score</span>
            <ShieldCheck className="w-4 h-4 text-brand-emerald" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold font-mono text-brand-emerald">
              {analyticsData?.governance_response_score?.score ?? 86.4}
            </p>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-forest text-brand-emerald border border-brand-emerald/30">
              {analyticsData?.governance_response_score?.grade ?? 'A- (STRONG)'}
            </span>
          </div>
          <p className="text-[10px] text-text-muted">
            SLA Rate: {analyticsData?.governance_response_score?.components?.sla_compliance_rate ?? 88.2}%
          </p>
        </div>

        {/* Monitored Mines */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-text-muted text-[11px]">
            <span>Active Mines Monitored</span>
            <Building2 className="w-4 h-4 text-brand-teal" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-text-primary">
            {analyticsData?.total_monitored_mines ?? 10}
          </p>
          <p className="text-[10px] text-text-muted font-mono">
            {timeRange} active evaluation window
          </p>
        </div>

        {/* Reporting Cadence Compliance */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-text-muted text-[11px]">
            <span>Reporting Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-teal-400">
            {analyticsData?.reporting_compliance?.completion_percentage ?? 82.4}%
          </p>
          <p className="text-[10px] text-text-muted">
            {analyticsData?.reporting_compliance?.actual_logs ?? 62} / {analyticsData?.reporting_compliance?.expected_logs ?? 100} Logs Filed
          </p>
        </div>

        {/* High Risk Mines in Cohort */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-text-muted text-[11px]">
            <span>Critical Escalation Cohort</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-rose-400">
            {analyticsData?.peer_standing?.find((p) => p.status_color === 'rose')?.count ?? 3} Mines
          </p>
          <p className="text-[10px] text-text-muted">
            {analyticsData?.peer_standing?.find((p) => p.status_color === 'rose')?.percentage ?? 30.0}% of cohort
          </p>
        </div>
      </div>

      {/* Trajectory Line Chart */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-emerald" />
              <span>Subsidiary Risk Trajectory ({timeRange} Temporal Drift)</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Multi-period aggregate risk trajectories across Coal India subsidiaries ({analyticsData?.range || timeRange} interval)
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-text-muted">
              Loading {timeRange} risk trajectory data…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData?.risk_trajectory || analyticsData?.risk_trajectories || []} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1D3A32" opacity={0.5} />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} domain={[10, 100]} tickLine={false} />
                <Tooltip content={<CustomTrajectoryTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                {/* Trajectory lines for each subsidiary */}
                {Object.keys(SUB_COLORS)
                  .filter((sub) => sub !== 'SelectedMine')
                  .map((sub) => {
                    // Only show if subsidiary matches filter or all
                    if (subsidiaryFilter !== 'ALL' && subsidiaryFilter !== sub) return null;
                    return (
                      <Line
                        key={sub}
                        type="monotone"
                        dataKey={sub}
                        stroke={SUB_COLORS[sub] || '#14B8A6'}
                        strokeWidth={2.2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    );
                  })}

                {/* If selected mine, render prominent line */}
                {mineIdFilter !== 'ALL' && (
                  <Line
                    type="monotone"
                    dataKey="SelectedMine"
                    name="Selected Mine Trajectory"
                    stroke="#38BDF8"
                    strokeWidth={3.5}
                    dot={{ r: 5, fill: '#38BDF8' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Middle Grid: SLA Compliance & Peer Standing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statutory SLA Compliance Distribution */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Statutory SLA Compliance Distribution</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Remediation resolution breakdown within statutory windows ({timeRange} period)
            </p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData?.sla_performance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1D3A32" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomSlaTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(analyticsData?.sla_performance || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#10B981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* National Coalfield Peer Standing (Exact Mathematical Cohorts) */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-text-primary">National Coalfield Peer Standing</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Synthetic peer benchmark across active monitored mine cohort ({analyticsData?.total_monitored_mines || 10} mines)
            </p>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {(analyticsData?.peer_standing || []).map((peer, idx) => {
              const isRose = peer.status_color === 'rose';
              const isEmerald = peer.status_color === 'emerald';

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl bg-brand-surface border ${
                    isRose ? 'border-rose-500/30' : isEmerald ? 'border-emerald-500/30' : 'border-brand-border'
                  } flex items-center justify-between gap-2`}
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-text-primary">{peer.tier}</p>
                    <p className="text-text-muted text-[10.5px]">{peer.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0 font-mono">
                    <p
                      className={`font-bold text-sm ${
                        isRose ? 'text-rose-400' : isEmerald ? 'text-emerald-400' : 'text-teal-300'
                      }`}
                    >
                      {peer.count} Mines
                    </p>
                    <span className="text-[10px] text-text-muted">({peer.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lower Grid: Violation Severity Distribution & Recurring Violations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Violation Severity Distribution */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Violation Severity Distribution</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Breakdown of recorded non-compliances by severity tier ({timeRange} period)
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {(analyticsData?.severity_distribution || []).map((sev) => (
              <div key={sev.severity} className="p-3 rounded-xl bg-brand-surface border border-brand-border space-y-1 text-center">
                <span className="text-[10px] font-mono font-bold text-text-muted uppercase">
                  {sev.severity}
                </span>
                <p className="text-lg font-extrabold font-mono" style={{ color: sev.fill }}>
                  {sev.count}
                </p>
                <p className="text-[10px] text-text-muted font-mono">{sev.percentage}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recurring Violation Patterns */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Recurring Violation Patterns</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Identified repeated statutory non-compliances by mine and regulation category
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            {(analyticsData?.recurring_violations || []).map((rec, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary">{rec.mine_name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-card text-brand-teal border border-brand-border/60">
                      {rec.subsidiary}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary">{rec.category}</p>
                </div>

                <div className="text-right flex-shrink-0 font-mono">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    {rec.occurrences} occurrences ({rec.trend})
                  </span>
                  <p className="text-[10px] text-text-muted mt-0.5">Latest: {rec.latest_date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranked High-Risk Coal Mines Table */}
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-sm space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Ranked Coalfield Risk Registry</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Composite priority risk ranking across active coal mining operations
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-surface/90 text-text-muted uppercase text-[10px] font-bold border-b border-brand-border">
                <th className="py-3 px-3 text-center">Rank</th>
                <th className="py-3 px-3">Mine Code & Name</th>
                <th className="py-3 px-3">Subsidiary</th>
                <th className="py-3 px-3">State / District</th>
                <th className="py-3 px-3 text-center">Risk Score</th>
                <th className="py-3 px-3 text-center">Open Cases</th>
                <th className="py-3 px-3 text-center">SLA Breaches</th>
                <th className="py-3 px-3 text-center">Reporting %</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {(analyticsData?.ranked_mines || []).map((m) => (
                <tr key={m.id} className="hover:bg-brand-surface/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono font-bold text-text-muted">
                    #{m.rank}
                  </td>

                  <td className="py-3 px-3">
                    <p className="font-semibold text-text-primary">{m.name}</p>
                    <span className="text-[10px] font-mono text-text-muted">{m.mine_code}</span>
                  </td>

                  <td className="py-3 px-3 font-semibold text-brand-teal">
                    {m.subsidiary}
                  </td>

                  <td className="py-3 px-3 text-text-secondary">
                    {m.district}, {m.state}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${
                        m.risk_score >= 80
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : m.risk_score >= 60
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {m.risk_score}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold text-text-primary">
                    {m.open_violations}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">
                    {m.sla_breaches}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold text-text-secondary">
                    {m.reporting_compliance}%
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => navigate(`/mines/${m.id}`)}
                      className="px-2.5 py-1 rounded-lg bg-brand-surface border border-brand-border text-[11px] font-semibold text-brand-emerald hover:bg-brand-forest transition-colors inline-flex items-center gap-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
