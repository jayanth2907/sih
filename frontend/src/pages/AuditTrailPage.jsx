import React, { useState, useEffect, useCallback } from 'react';
import { auditService } from '../services/auditService';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  RefreshCw,
  Hash,
  FileCode2,
  Download,
  Search,
  Filter,
  User,
  Cpu,
  Layers,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  FileText,
  AlertTriangle,
  Flame,
  CheckCheck,
  KeyRound,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

const CATEGORIES = [
  { id: 'ALL', label: 'All Events' },
  { id: 'VIOLATION', label: 'Violations' },
  { id: 'INSPECTION', label: 'Inspections' },
  { id: 'RISK', label: 'Risk / ML' },
  { id: 'MONITORING', label: 'Monitoring / Signals' },
  { id: 'DOCUMENTS', label: 'Documents & OCR' },
  { id: 'SLA', label: 'SLA & Escalations' },
  { id: 'HUMAN_REVIEW', label: 'Human Review' },
  { id: 'SYSTEM', label: 'System Automated' }
];

export const AuditTrailPage = () => {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);

  const { showToast } = useToast();

  const fetchSummary = useCallback(async () => {
    try {
      const data = await auditService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load audit summary:', err);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await auditService.getLogs({
        page: currentPage,
        page_size: 15,
        category: selectedCategory,
        search: searchQuery,
        order: sortOrder
      });
      setEvents(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to load audit events:', err);
      showToast('Unable to load audit ledger events from backend.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, searchQuery, sortOrder, showToast]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    try {
      const res = await auditService.verifyLedger();
      setVerificationResult(res);
      fetchSummary();
      if (res.valid) {
        showToast(`Cryptographic Verification Successful: Checked ${res.events_checked} SHA-256 blocks with zero integrity flaws.`, 'success');
      } else {
        showToast(`Integrity Alert: Chain broken at Event #${res.broken_at_event_id}.`, 'error');
      }
    } catch (err) {
      console.error('Ledger verification failed:', err);
      showToast('Ledger integrity verification failed to reach server.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    showToast(`Copied ${label} to clipboard`, 'info');
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportCsv = () => {
    const url = auditService.exportCsvUrl(selectedCategory, searchQuery);
    window.open(url, '_blank');
    showToast('Exporting filtered audit ledger to CSV...', 'info');
  };

  const getActionBadgeColor = (action, category) => {
    const act = (action || '').toUpperCase();
    if (act.includes('BREACH') || act.includes('ESCALAT') || act.includes('CRITICAL')) {
      return 'bg-brand-crimson/20 text-brand-crimson border-brand-crimson/40';
    }
    if (act.includes('VERIF') || act.includes('CONFIRM') || act.includes('CLOSED')) {
      return 'bg-brand-emerald/20 text-brand-emerald border-brand-emerald/40';
    }
    if (act.includes('RISK') || act.includes('RECALCULAT') || act.includes('SIGNAL')) {
      return 'bg-brand-amber/20 text-brand-amber border-brand-amber/40';
    }
    if (act.includes('DOCUMENT') || act.includes('OCR')) {
      return 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40';
    }
    return 'bg-brand-forest text-brand-teal border-brand-emerald/30';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-forest border border-brand-emerald/40 flex items-center justify-center text-brand-emerald shadow-glow-emerald">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span>Governance Audit Trail & Integrity Ledger</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Traceable, hash-chained record of consequential governance actions across KhanDrishti.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-surface border border-brand-border text-text-secondary hover:text-text-primary text-xs font-semibold hover:border-brand-border/80 transition-all shadow-sm"
            title="Download CSV of current filtered ledger"
          >
            <Download className="w-4 h-4 text-brand-teal" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleVerifyLedger}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-forest border border-brand-emerald/50 text-brand-emerald font-bold text-xs hover:bg-brand-emerald hover:text-brand-bg transition-all shadow-glow-emerald active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying Chain...' : 'Verify Ledger'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Events */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Events</span>
            <Layers className="w-4 h-4 text-brand-teal" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-text-primary mt-1">
            {summary?.total_events ?? totalCount}
          </p>
          <span className="text-[10px] text-text-secondary">Immutable append-only</span>
        </div>

        {/* Human Actions */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Human Actions</span>
            <User className="w-4 h-4 text-brand-emerald" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-brand-emerald mt-1">
            {summary?.human_actions_count ?? '-'}
          </p>
          <span className="text-[10px] text-text-secondary">Inspector & officer actions</span>
        </div>

        {/* System Actions */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">System Actions</span>
            <Cpu className="w-4 h-4 text-brand-cyan" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-brand-cyan mt-1">
            {summary?.system_actions_count ?? '-'}
          </p>
          <span className="text-[10px] text-text-secondary">AI engines & SLA daemons</span>
        </div>

        {/* Escalations */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Escalations</span>
            <Flame className="w-4 h-4 text-brand-crimson" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-brand-crimson mt-1">
            {summary?.escalations_count ?? '-'}
          </p>
          <span className="text-[10px] text-text-secondary">SLA breach events</span>
        </div>

        {/* Ledger Integrity Card */}
        <div className="col-span-2 md:col-span-1 bg-brand-card border border-brand-border rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Ledger Integrity</span>
            <Lock className="w-4 h-4 text-brand-emerald" />
          </div>
          <div className="mt-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold font-mono border ${
              summary?.integrity_status === 'VERIFIED'
                ? 'bg-brand-forest text-brand-emerald border-brand-emerald/40'
                : 'bg-brand-crimson/20 text-brand-crimson border-brand-crimson/40'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{summary?.integrity_status || 'VERIFIED'}</span>
            </span>
          </div>
          <div className="text-[10px] text-text-muted mt-1 font-mono truncate" title={summary?.latest_hash}>
            Hash: {summary?.latest_hash ? `${summary.latest_hash.substring(0, 10)}…` : 'Genesis'}
          </div>
        </div>
      </div>

      {/* Cryptographic Proof Banner */}
      {verificationResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
          verificationResult.valid
            ? 'bg-brand-forest/40 border-brand-emerald/50 text-text-primary'
            : 'bg-brand-crimson/20 border-brand-crimson/60 text-brand-crimson'
        }`}>
          {verificationResult.valid ? (
            <ShieldCheck className="w-5 h-5 text-brand-emerald flex-shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-brand-crimson flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">
                {verificationResult.valid
                  ? 'SHA-256 Ledger Cryptographic Hash-Chain Verified'
                  : 'Ledger Integrity Tampering Detected!'}
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                {formatDateTime(verificationResult.verified_at)}
              </span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              {verificationResult.valid ? (
                <>
                  Verified <strong>{verificationResult.events_checked}</strong> consecutive audit events starting from Genesis block #<strong>{verificationResult.first_event_id}</strong> up to #<strong>{verificationResult.last_event_id}</strong>. Every state transition hash strictly equals <code className="font-mono bg-brand-surface px-1.5 py-0.5 rounded text-brand-emerald">SHA256(prev_hash + canonical_event_payload)</code>.
                </>
              ) : (
                <>
                  Integrity violation detected at Block #<strong>{verificationResult.broken_at_event_id}</strong>. The stored payload hash does not match computed SHA-256 digest.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Action, Actor, Mine, Entity ID, or Hash prefix..."
              className="w-full bg-brand-surface border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-brand-emerald focus:outline-none transition-colors"
            />
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-text-secondary whitespace-nowrap">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs font-semibold text-text-primary focus:border-brand-emerald focus:outline-none transition-colors"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First (Genesis)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-brand-border/40">
          <span className="text-[11px] font-bold text-text-muted mr-1.5 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-brand-forest text-brand-emerald border border-brand-emerald/40 font-bold shadow-sm'
                  : 'bg-brand-surface text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Event Table */}
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-surface/80 text-text-muted uppercase text-[10px] font-bold border-b border-brand-border">
                <th className="py-3 px-4">Event #</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Governance Action</th>
                <th className="py-3 px-4">Entity Context</th>
                <th className="py-3 px-4">Mine / Location</th>
                <th className="py-3 px-4">Block Hash (SHA-256)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted font-sans text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-emerald mb-2" />
                    Loading tamper-evident ledger events from backend...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted font-sans text-xs">
                    No governance audit events match your filter criteria.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-brand-surface/70 transition-colors cursor-pointer group"
                  >
                    {/* Event ID */}
                    <td className="py-3 px-4 font-bold text-brand-emerald whitespace-nowrap">
                      #{evt.id}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-text-secondary text-[11px] whitespace-nowrap">
                      {formatDateTime(evt.timestamp)}
                    </td>

                    {/* Actor & Role */}
                    <td className="py-3 px-4 font-sans max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${
                          evt.is_system
                            ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40'
                            : 'bg-brand-emerald/20 text-brand-emerald border-brand-emerald/40'
                        }`}>
                          {evt.is_system ? <Cpu className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                          {evt.actor_type}
                        </span>
                        <span className="font-semibold text-text-primary text-xs truncate">
                          {evt.performed_by_name}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted font-mono truncate mt-0.5">
                        {evt.performed_by_role}
                      </p>
                    </td>

                    {/* Governance Action */}
                    <td className="py-3 px-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border inline-block ${getActionBadgeColor(evt.action, evt.category)}`}>
                        {evt.action}
                      </span>
                    </td>

                    {/* Entity Context */}
                    <td className="py-3 px-4 text-text-secondary font-sans">
                      <span className="font-semibold text-text-primary text-xs">
                        {evt.entity_type}
                      </span>{' '}
                      <span className="font-mono text-brand-teal text-[11px]">
                        #{evt.entity_id}
                      </span>
                    </td>

                    {/* Mine Context */}
                    <td className="py-3 px-4 text-text-secondary text-xs font-sans max-w-[150px] truncate" title={evt.mine_name}>
                      {evt.mine_name}
                    </td>

                    {/* Hash */}
                    <td className="py-3 px-4 text-[11px] text-brand-emerald font-mono max-w-[130px] truncate" title={evt.hash}>
                      {evt.hash?.substring(0, 16)}…
                    </td>

                    {/* Details Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(evt);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-brand-surface border border-brand-border text-brand-teal hover:bg-brand-forest hover:text-brand-emerald font-sans text-xs font-bold transition-all shadow-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-brand-surface/60 border-t border-brand-border p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-text-muted font-sans">
            Showing Page <span className="font-bold text-text-primary font-mono">{currentPage}</span> of{' '}
            <span className="font-bold text-text-primary font-mono">{totalPages}</span> ({totalCount} total events)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="px-3 py-1.5 rounded-lg bg-brand-card border border-brand-border text-text-primary font-semibold disabled:opacity-40 hover:bg-brand-surface transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="px-2 font-mono font-bold text-brand-emerald">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg bg-brand-card border border-brand-border text-text-primary font-semibold disabled:opacity-40 hover:bg-brand-surface transition-all flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Event Details Drawer / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-brand-card border border-brand-border rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-brand-border flex items-center justify-between bg-brand-surface/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-forest border border-brand-emerald/40 flex items-center justify-center text-brand-emerald">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-text-primary">
                      Audit Event #{selectedEvent.id}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getActionBadgeColor(selectedEvent.action, selectedEvent.category)}`}>
                      {selectedEvent.action}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted font-mono mt-0.5">
                    {formatDateTime(selectedEvent.timestamp)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Actor & Entity Grid */}
              <div className="grid grid-cols-2 gap-3 bg-brand-surface/40 border border-brand-border p-3.5 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted font-mono">Actor & Role</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${
                      selectedEvent.is_system
                        ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40'
                        : 'bg-brand-emerald/20 text-brand-emerald border-brand-emerald/40'
                    }`}>
                      {selectedEvent.actor_type}
                    </span>
                    <span className="font-semibold text-text-primary text-xs">{selectedEvent.performed_by_name}</span>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono block mt-0.5">{selectedEvent.performed_by_role}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted font-mono">Scope & Location</span>
                  <p className="font-semibold text-text-primary text-xs mt-1">{selectedEvent.mine_name}</p>
                  <p className="text-[10px] text-brand-teal font-mono mt-0.5">
                    Target: {selectedEvent.entity_type} #{selectedEvent.entity_id}
                  </p>
                </div>
              </div>

              {/* Before / After State Transition */}
              {(selectedEvent.before_state || selectedEvent.after_state) && (
                <div className="border border-brand-border rounded-xl p-3.5 bg-brand-surface/50">
                  <span className="text-[10px] uppercase font-bold text-text-muted font-mono block mb-2">
                    State Machine Transition
                  </span>
                  <div className="flex items-center justify-between gap-3 bg-brand-card p-2.5 rounded-lg border border-brand-border">
                    <div className="flex-1">
                      <span className="text-[9px] uppercase font-bold text-text-muted block">Before State</span>
                      <span className="font-mono font-bold text-brand-amber text-xs">
                        {selectedEvent.before_state || 'INITIAL_STATE'}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-brand-teal flex-shrink-0" />
                    <div className="flex-1 text-right">
                      <span className="text-[9px] uppercase font-bold text-text-muted block">After State</span>
                      <span className="font-mono font-bold text-brand-emerald text-xs">
                        {selectedEvent.after_state || 'CONFIRMED'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Formatted Event Metadata */}
              <div className="border border-brand-border rounded-xl p-3.5 bg-brand-surface/30 space-y-2">
                <span className="text-[10px] uppercase font-bold text-text-muted font-mono block">
                  Event Metadata & Traceability Attributes
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(selectedEvent.details || {}).map(([key, val]) => {
                    if (typeof val === 'object' && val !== null) {
                      return (
                        <div key={key} className="col-span-2 bg-brand-card/80 p-2 rounded border border-brand-border">
                          <span className="font-mono text-brand-teal font-bold">{key}:</span>
                          <pre className="text-[10px] text-text-secondary mt-1 font-mono overflow-x-auto">
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="bg-brand-card/80 p-2 rounded border border-brand-border">
                        <span className="font-mono text-text-muted block text-[10px] uppercase">{key.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-text-primary font-semibold truncate block mt-0.5">
                          {String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cryptographic Hash Chain Box */}
              <div className="border border-brand-emerald/30 bg-brand-forest/20 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-brand-emerald font-mono flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Cryptographic Ledger Block Proof
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">SHA-256</span>
                </div>

                <div className="space-y-1.5 font-mono text-[10px]">
                  <div>
                    <span className="text-text-muted block">Previous Block Hash:</span>
                    <div className="flex items-center justify-between bg-brand-card p-1.5 rounded border border-brand-border">
                      <span className="text-text-secondary truncate flex-1">{selectedEvent.previous_hash}</span>
                      <button
                        onClick={() => handleCopy(selectedEvent.previous_hash, 'Previous Hash')}
                        className="text-brand-teal hover:text-brand-emerald ml-2"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-text-muted block">Current Block Hash:</span>
                    <div className="flex items-center justify-between bg-brand-card p-1.5 rounded border border-brand-border">
                      <span className="text-brand-emerald font-bold truncate flex-1">{selectedEvent.hash}</span>
                      <button
                        onClick={() => handleCopy(selectedEvent.hash, 'Current Hash')}
                        className="text-brand-teal hover:text-brand-emerald ml-2"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-text-muted leading-tight font-sans">
                  * Hash-chained tamper-evident audit ledger: unauthorized modification becomes detectable through chain verification.
                </p>
              </div>

              {/* Raw JSON Accordion */}
              <div>
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="w-full py-2 px-3 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-between text-text-secondary hover:text-text-primary text-xs font-semibold"
                >
                  <span className="flex items-center gap-1.5 font-mono">
                    <FileCode2 className="w-3.5 h-3.5 text-brand-teal" /> Canonical Event Payload (JSON)
                  </span>
                  {showRawJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showRawJson && (
                  <pre className="mt-2 p-3 bg-brand-surface rounded-lg border border-brand-border text-[10px] font-mono text-brand-teal overflow-x-auto max-h-48">
                    {JSON.stringify(selectedEvent, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-brand-border bg-brand-surface/40 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-brand-surface border border-brand-border text-text-primary text-xs font-bold hover:bg-brand-border transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

