import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mineService } from '../services/mineService';
import { Building2, Search, Filter, ArrowRight, ShieldAlert, MapPin, Layers, RefreshCw, AlertCircle } from 'lucide-react';
import { getRiskCategory } from '../utils/formatters';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const MinesPage = () => {
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');
  const navigate = useNavigate();

  const fetchMines = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mineService.getMines();
      setMines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load mines:', err);
      setError('Unable to load coal mine records from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMines();
  }, []);

  const filteredMines = mines.filter((mine) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      mine.name?.toLowerCase().includes(q) ||
      mine.mine_code?.toLowerCase().includes(q) ||
      mine.state?.toLowerCase().includes(q) ||
      mine.district?.toLowerCase().includes(q);

    const matchesSub = selectedSubsidiary === 'ALL' || mine.subsidiary === selectedSubsidiary;

    let matchesRisk = true;
    const score = Number(mine.risk_score) || 0;
    if (selectedRiskFilter === 'CRITICAL') {
      matchesRisk = score >= 80;
    } else if (selectedRiskFilter === 'HIGH') {
      matchesRisk = score >= 60 && score < 80;
    } else if (selectedRiskFilter === 'MEDIUM') {
      matchesRisk = score >= 40 && score < 60;
    } else if (selectedRiskFilter === 'LOW') {
      matchesRisk = score < 40;
    }

    return matchesSearch && matchesSub && matchesRisk;
  });

  const subsidiaries = ['ALL', ...new Set(mines.map((m) => m.subsidiary).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-brand-emerald" />
            <span>Monitored Coal Mines</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Real-time compliance, risk indexing & operational health across all CIL subsidiaries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-text-secondary">
            Total Mines: <strong className="text-text-primary font-mono text-brand-emerald">{mines.length}</strong>
          </span>
          <button
            onClick={fetchMines}
            disabled={loading}
            title="Refresh Mines"
            className="p-2 rounded-xl bg-brand-surface border border-brand-border text-text-secondary hover:text-brand-emerald transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-emerald' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by mine name, code (e.g. MINE-A), state, or district..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-emerald"
          />
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        {/* Subsidiary Filter */}
        <select
          value={selectedSubsidiary}
          onChange={(e) => setSelectedSubsidiary(e.target.value)}
          className="w-full md:w-48 px-3 py-2 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-emerald"
        >
          {subsidiaries.map((sub) => (
            <option key={sub} value={sub}>
              {sub === 'ALL' ? 'All Subsidiaries' : sub}
            </option>
          ))}
        </select>

        {/* Risk Filter */}
        <select
          value={selectedRiskFilter}
          onChange={(e) => setSelectedRiskFilter(e.target.value)}
          className="w-full md:w-44 px-3 py-2 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-emerald"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">Critical (≥ 80)</option>
          <option value="HIGH">High (60 – 79)</option>
          <option value="MEDIUM">Medium (40 – 59)</option>
          <option value="LOW">Low (&lt; 40)</option>
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
            onClick={fetchMines}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-status-critical text-white hover:bg-rose-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Mines High-Density Data Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : filteredMines.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No mines match your filter"
          description="Try modifying your search keywords or resetting the subsidiary and risk level filters."
          actionText="Reset Filters"
          onAction={() => {
            setSearch('');
            setSelectedSubsidiary('ALL');
            setSelectedRiskFilter('ALL');
          }}
        />
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-surface/80 text-text-muted uppercase text-[10px] font-bold border-b border-brand-border">
                  <th className="py-3 px-4">Mine Name & Code</th>
                  <th className="py-3 px-4">Subsidiary</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Risk Score</th>
                  <th className="py-3 px-4 text-center">Gov Response</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredMines.map((mine) => {
                  const riskMeta = getRiskCategory(mine.risk_score);

                  return (
                    <tr
                      key={mine.id}
                      onClick={() => navigate(`/mines/${mine.id}`)}
                      className="hover:bg-brand-surface/70 cursor-pointer transition-colors group"
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-sm text-text-primary group-hover:text-brand-emerald transition-colors">
                          {mine.name}
                        </p>
                        <p className="text-[11px] font-mono text-text-muted">{mine.mine_code}</p>
                      </td>

                      {/* Subsidiary */}
                      <td className="py-3.5 px-4 font-semibold text-text-secondary">
                        {mine.subsidiary}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-text-muted" />
                          <span>{mine.district}, {mine.state}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 text-text-secondary">
                        <span className="px-2 py-0.5 rounded bg-brand-surface text-[10px] font-mono border border-brand-border">
                          {mine.mine_type || '—'}
                        </span>
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${riskMeta.bg} ${riskMeta.color} ${riskMeta.border}`}>
                          {mine.risk_score !== undefined && mine.risk_score !== null ? Number(mine.risk_score).toFixed(1) : '—'}
                        </span>
                      </td>

                      {/* Gov Response */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-mono font-bold text-brand-emerald">
                          {mine.governance_response_score !== undefined && mine.governance_response_score !== null
                            ? `${mine.governance_response_score}%`
                            : '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            mine.status === 'CRITICAL'
                              ? 'bg-status-critical/20 text-status-critical border border-status-critical/30'
                              : mine.status === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-status-success/20 text-status-success border border-status-success/30'
                          }`}
                        >
                          {mine.status || 'OPERATIONAL'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/mines/${mine.id}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-xs font-semibold text-brand-emerald hover:bg-brand-forest transition-colors inline-flex items-center gap-1"
                        >
                          <span>Profile</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
