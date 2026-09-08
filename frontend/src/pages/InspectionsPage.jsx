import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectionService } from '../services/inspectionService';
import { mineService } from '../services/mineService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ClipboardCheck,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowUpDown,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileText,
  User,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const InspectionsPage = () => {
  const [inspections, setInspections] = useState([]);
  const [mines, setMines] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search, Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mineFilter, setMineFilter] = useState('ALL');
  const [syncFilter, setSyncFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals / Drawers
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // New Inspection Form State
  const [formData, setFormData] = useState({
    mine_id: '',
    gps_lat: '24.2012',
    gps_lng: '82.6644',
    notes: '',
    is_offline_sync: false,
    has_observation: false,
    observation_regulation_id: '1',
    observation_severity: 'HIGH',
    observation_desc: '',
    observation_is_violation: true,
  });

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 1. Fetch initial data (inspections, mines, regulations)
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inspData, mineData, regData] = await Promise.all([
        inspectionService.getInspections().catch(() => []),
        mineService.getMines().catch(() => []),
        inspectionService.getRegulations().catch(() => []),
      ]);

      setInspections(Array.isArray(inspData) ? inspData : []);
      setMines(Array.isArray(mineData) ? mineData : []);
      setRegulations(Array.isArray(regData) ? regData : []);

      // Default first mine in form if empty
      if (mineData && mineData.length > 0 && !formData.mine_id) {
        setFormData(prev => ({
          ...prev,
          mine_id: mineData[0].id,
          gps_lat: String(mineData[0].lat || '24.2012'),
          gps_lng: String(mineData[0].lng || '82.6644'),
        }));
      }
    } catch (err) {
      console.error('Failed to load inspections:', err);
      setError('Unable to load inspection telemetry from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Efficient Mine Lookup Map
  const mineMap = useMemo(() => {
    const map = {};
    mines.forEach((m) => {
      map[m.id] = m;
    });
    return map;
  }, [mines]);

  // Handle Mine Change in Modal to auto-fill default GPS
  const handleMineChange = (mId) => {
    const selected = mineMap[mId];
    setFormData(prev => ({
      ...prev,
      mine_id: mId,
      gps_lat: selected?.lat ? String(selected.lat) : prev.gps_lat,
      gps_lng: selected?.lng ? String(selected.lng) : prev.gps_lng,
    }));
  };

  // 3. Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.mine_id) errors.mine_id = 'Mine selection is required';
    
    const lat = parseFloat(formData.gps_lat);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.gps_lat = 'Latitude must be between -90 and 90';
    }

    const lng = parseFloat(formData.gps_lng);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.gps_lng = 'Longitude must be between -180 and 180';
    }

    if (!formData.notes.trim()) {
      errors.notes = 'Inspection notes are recommended for statutory audit compliance';
    }

    if (formData.has_observation && !formData.observation_desc.trim()) {
      errors.observation_desc = 'Observation description is required when adding an observation';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 4. Submit New Inspection Log
  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const observationsPayload = [];
      if (formData.has_observation && formData.observation_desc.trim()) {
        observationsPayload.push({
          regulation_id: Number(formData.observation_regulation_id) || 1,
          severity: formData.observation_severity || 'HIGH',
          description: formData.observation_desc,
          is_violation: formData.observation_is_violation,
          evidence_url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
        });
      }

      const payload = {
        mine_id: Number(formData.mine_id),
        gps_lat: parseFloat(formData.gps_lat),
        gps_lng: parseFloat(formData.gps_lng),
        notes: formData.notes,
        is_offline_sync: Boolean(formData.is_offline_sync),
        observations: observationsPayload,
      };

      // Inspector ID from current auth user (defaults to 1)
      const inspectorId = user?.id || 1;
      await inspectionService.createInspection(payload, inspectorId);

      showToast('New statutory field inspection logged & synchronized successfully.', 'success');
      setIsNewModalOpen(false);

      // Reset form
      setFormData(prev => ({
        ...prev,
        notes: '',
        has_observation: false,
        observation_desc: '',
      }));
      setFormErrors({});

      // Refetch immediately
      const refreshed = await inspectionService.getInspections();
      setInspections(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      console.error('Inspection submit error:', err);
      showToast('Failed to submit inspection. Please check form entries.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Filter & Search Logic
  const filteredInspections = useMemo(() => {
    return inspections.filter((ins) => {
      const q = search.toLowerCase().trim();
      const m = mineMap[ins.mine_id];
      const mineName = (m?.name || '').toLowerCase();
      const mineCode = (m?.mine_code || '').toLowerCase();
      const inspNum = (ins.inspection_number || '').toLowerCase();
      const notes = (ins.notes || '').toLowerCase();
      const status = (ins.status || '').toLowerCase();
      const inspIdStr = String(ins.inspector_id || '');

      const matchesSearch =
        !q ||
        inspNum.includes(q) ||
        mineName.includes(q) ||
        mineCode.includes(q) ||
        notes.includes(q) ||
        status.includes(q) ||
        inspIdStr.includes(q);

      const matchesStatus = statusFilter === 'ALL' || (ins.status || '').toUpperCase() === statusFilter.toUpperCase();
      const matchesMine = mineFilter === 'ALL' || String(ins.mine_id) === String(mineFilter);
      
      let matchesSync = true;
      if (syncFilter === 'ONLINE') matchesSync = ins.is_offline_sync === false;
      if (syncFilter === 'OFFLINE') matchesSync = ins.is_offline_sync === true;

      return matchesSearch && matchesStatus && matchesMine && matchesSync;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.created_at || a.inspection_time || 0);
        const dateB = new Date(b.created_at || b.inspection_time || 0);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (sortBy === 'status') {
        const stA = a.status || '';
        const stB = b.status || '';
        return sortOrder === 'asc' ? stA.localeCompare(stB) : stB.localeCompare(stA);
      }
      if (sortBy === 'number') {
        const numA = a.inspection_number || '';
        const numB = b.inspection_number || '';
        return sortOrder === 'asc' ? numA.localeCompare(numB) : numB.localeCompare(numA);
      }
      return 0;
    });
  }, [inspections, search, statusFilter, mineFilter, syncFilter, sortBy, sortOrder, mineMap]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage) || 1;
  const paginatedInspections = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInspections.slice(start, start + itemsPerPage);
  }, [filteredInspections, currentPage, itemsPerPage]);

  const handleOpenDetails = (ins, e) => {
    if (e) e.stopPropagation();
    setSelectedInspection(ins);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-brand-emerald" />
            <span>Field Inspection & Offline Sync Hub</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Real-time field inspection logs, offline mobile sync telemetry & observation records
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            title="Refresh Inspection Data"
            className="p-2 rounded-xl bg-brand-surface border border-brand-border text-text-secondary hover:text-brand-emerald hover:border-brand-emerald/40 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-emerald' : ''}`} />
          </button>

          {/* New Inspection Button */}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-emerald text-brand-bg font-bold text-xs hover:bg-emerald-400 transition-colors shadow-glow-emerald"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Inspection Log</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by inspection #, mine name/code, inspector, or notes..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-emerald"
          />
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        {/* Mine Filter */}
        <select
          value={mineFilter}
          onChange={(e) => {
            setMineFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full md:w-48 px-3 py-2 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-emerald"
        >
          <option value="ALL">All Mines</option>
          {mines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.mine_code})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full md:w-36 px-3 py-2 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-emerald"
        >
          <option value="ALL">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PENDING">Pending</option>
        </select>

        {/* Sync Source Filter */}
        <select
          value={syncFilter}
          onChange={(e) => {
            setSyncFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full md:w-36 px-3 py-2 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-emerald"
        >
          <option value="ALL">All Sources</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline Synced</option>
        </select>
      </div>

      {/* Error Banner */}
      {error && !loading && (
        <div className="p-4 rounded-2xl bg-status-critical/15 border border-status-critical/40 flex items-center justify-between">
          <div className="flex items-center gap-3 text-status-critical text-xs font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-status-critical text-white hover:bg-rose-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Inspections Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={9} />
      ) : filteredInspections.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No inspections found"
          description={
            inspections.length === 0
              ? "No statutory inspections have been recorded yet in the database."
              : "No records match your active search or filter criteria."
          }
          actionText={inspections.length === 0 ? "Create New Inspection" : "Reset Filters"}
          onAction={() => {
            if (inspections.length === 0) {
              setIsNewModalOpen(true);
            } else {
              setSearch('');
              setStatusFilter('ALL');
              setMineFilter('ALL');
              setSyncFilter('ALL');
            }
          }}
        />
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-surface/80 text-text-muted uppercase text-[10px] font-bold border-b border-brand-border">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-text-primary"
                    onClick={() => {
                      if (sortBy === 'number') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortBy('number'); setSortOrder('asc'); }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Inspection ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Mine</th>
                  <th className="py-3 px-4">Inspection Type</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">GPS Location</th>
                  <th className="py-3 px-4 text-center">Observations</th>
                  <th className="py-3 px-4">Sync Source</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-text-primary"
                    onClick={() => {
                      if (sortBy === 'status') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortBy('status'); setSortOrder('asc'); }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-text-primary"
                    onClick={() => {
                      if (sortBy === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortBy('date'); setSortOrder('desc'); }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Date & Time</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {paginatedInspections.map((ins) => {
                  const resolvedMine = mineMap[ins.mine_id];
                  const obsCount = ins.observations?.length || 0;
                  const isOffline = ins.is_offline_sync === true;

                  return (
                    <tr
                      key={ins.id}
                      onClick={() => handleOpenDetails(ins)}
                      className="hover:bg-brand-surface/70 cursor-pointer transition-colors group"
                    >
                      {/* Inspection ID / Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-teal group-hover:text-brand-emerald transition-colors">
                        {ins.inspection_number || `INSP-${ins.id}`}
                      </td>

                      {/* Mine Name */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-bold text-text-primary truncate">
                          {resolvedMine?.name || `Mine ID #${ins.mine_id}`}
                        </p>
                        <p className="text-[10px] font-mono text-text-muted">
                          {resolvedMine?.mine_code || `ID: ${ins.mine_id}`}
                        </p>
                      </td>

                      {/* Inspection Type */}
                      <td className="py-3.5 px-4 text-text-secondary font-medium">
                        {ins.inspection_type || 'Safety & Compliance'}
                      </td>

                      {/* Inspector */}
                      <td className="py-3.5 px-4 text-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-brand-teal" />
                          <span>{ins.inspector_name || `Inspector #${ins.inspector_id || 1}`}</span>
                        </div>
                      </td>

                      {/* GPS Location & Link */}
                      <td className="py-3.5 px-4 text-text-secondary font-mono text-[11px]">
                        {ins.gps_lat && ins.gps_lng ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/gis');
                            }}
                            title="View coordinates on GIS Map"
                            className="flex items-center gap-1.5 text-brand-teal hover:text-brand-emerald hover:underline"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{Number(ins.gps_lat).toFixed(4)}, {Number(ins.gps_lng).toFixed(4)}</span>
                          </button>
                        ) : (
                          <span className="text-text-muted">N/A</span>
                        )}
                      </td>

                      {/* Observations Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            obsCount > 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-brand-surface text-text-muted border border-brand-border'
                          }`}
                        >
                          {obsCount} observation{obsCount === 1 ? '' : 's'}
                        </span>
                      </td>

                      {/* Sync Source */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isOffline
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-status-success/15 text-status-success border border-status-success/30'
                          }`}
                        >
                          {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                          <span>{isOffline ? 'OFFLINE SYNCED' : 'ONLINE'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ins.status === 'COMPLETED'
                              ? 'bg-status-success/20 text-status-success border border-status-success/30'
                              : ins.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-brand-surface text-text-secondary border border-brand-border'
                          }`}
                        >
                          {ins.status || 'COMPLETED'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-text-muted whitespace-nowrap">
                        {formatDateTime(ins.created_at || ins.inspection_time)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => handleOpenDetails(ins, e)}
                          className="px-2.5 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-xs font-semibold text-brand-emerald hover:bg-brand-forest transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-brand-border flex items-center justify-between text-xs text-text-secondary bg-brand-surface/40">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredInspections.length)} of{' '}
                {filteredInspections.length} inspections
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg bg-brand-surface border border-brand-border disabled:opacity-40 hover:text-text-primary"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 rounded-lg bg-brand-surface border border-brand-border disabled:opacity-40 hover:text-text-primary"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Inspection Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setFormErrors({});
        }}
        title="Log New Field Safety Inspection"
        subtitle="GPS-tagged statutory safety inspection record with offline buffer option"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitInspection} className="space-y-4 text-xs">
          {/* Mine Selection */}
          <div>
            <label className="block text-text-secondary font-semibold mb-1">Target Coal Mine *</label>
            <select
              value={formData.mine_id}
              onChange={(e) => handleMineChange(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-brand-card border text-text-primary focus:outline-none ${
                formErrors.mine_id ? 'border-status-critical' : 'border-brand-border focus:border-brand-emerald'
              }`}
            >
              <option value="">Select a coal mine...</option>
              {mines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.mine_code} - {m.subsidiary})
                </option>
              ))}
            </select>
            {formErrors.mine_id && <p className="text-[11px] text-status-critical mt-1">{formErrors.mine_id}</p>}
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-semibold mb-1">GPS Latitude (-90 to 90) *</label>
              <input
                type="number"
                step="any"
                value={formData.gps_lat}
                onChange={(e) => setFormData({ ...formData, gps_lat: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-brand-card border text-text-primary font-mono focus:outline-none ${
                  formErrors.gps_lat ? 'border-status-critical' : 'border-brand-border focus:border-brand-emerald'
                }`}
                placeholder="24.2012"
              />
              {formErrors.gps_lat && <p className="text-[11px] text-status-critical mt-1">{formErrors.gps_lat}</p>}
            </div>

            <div>
              <label className="block text-text-secondary font-semibold mb-1">GPS Longitude (-180 to 180) *</label>
              <input
                type="number"
                step="any"
                value={formData.gps_lng}
                onChange={(e) => setFormData({ ...formData, gps_lng: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-brand-card border text-text-primary font-mono focus:outline-none ${
                  formErrors.gps_lng ? 'border-status-critical' : 'border-brand-border focus:border-brand-emerald'
                }`}
                placeholder="82.6644"
              />
              {formErrors.gps_lng && <p className="text-[11px] text-status-critical mt-1">{formErrors.gps_lng}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-text-secondary font-semibold mb-1">Inspection Notes & Statutory Observations</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Record seam safety observations, ventilation conditions, PPE availability..."
              className={`w-full px-3.5 py-2.5 rounded-xl bg-brand-card border text-text-primary focus:outline-none ${
                formErrors.notes ? 'border-status-critical' : 'border-brand-border focus:border-brand-emerald'
              }`}
            />
            {formErrors.notes && <p className="text-[11px] text-amber-400 mt-1">{formErrors.notes}</p>}
          </div>

          {/* Offline Sync Toggle */}
          <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <div>
                <p className="font-semibold text-text-primary">Simulate Offline Field App Sync</p>
                <p className="text-[10px] text-text-muted">Simulates local SQLite buffer synchronization with server local_id</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.is_offline_sync}
              onChange={(e) => setFormData({ ...formData, is_offline_sync: e.target.checked })}
              className="w-4 h-4 accent-brand-emerald rounded cursor-pointer"
            />
          </div>

          {/* Observation / Violation Section */}
          <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-brand-teal" />
                <span className="font-bold text-text-primary">Attach Specific Statutory Observation</span>
              </div>
              <input
                type="checkbox"
                checked={formData.has_observation}
                onChange={(e) => setFormData({ ...formData, has_observation: e.target.checked })}
                className="w-4 h-4 accent-brand-emerald rounded cursor-pointer"
              />
            </div>

            {formData.has_observation && (
              <div className="space-y-3 pt-2 border-t border-brand-border/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-muted font-semibold mb-1">Safety Regulation</label>
                    <select
                      value={formData.observation_regulation_id}
                      onChange={(e) => setFormData({ ...formData, observation_regulation_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-brand-card border border-brand-border text-text-primary focus:outline-none"
                    >
                      {regulations.length > 0 ? (
                        regulations.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.code} - {r.title}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="1">CMR Reg 128 - Methane & Gas Precautions</option>
                          <option value="2">CMR Reg 112 - Ventilation Standards</option>
                          <option value="3">CMR Reg 108 - Highwall Stability</option>
                          <option value="4">CMR Reg 144 - Protective Equipment</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-text-muted font-semibold mb-1">Observed Severity</label>
                    <select
                      value={formData.observation_severity}
                      onChange={(e) => setFormData({ ...formData, observation_severity: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-brand-card border border-brand-border text-text-primary focus:outline-none"
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">Observation Details *</label>
                  <textarea
                    rows={2}
                    value={formData.observation_desc}
                    onChange={(e) => setFormData({ ...formData, observation_desc: e.target.value })}
                    placeholder="Specific defect or non-compliance logged during inspection..."
                    className="w-full px-3 py-2 rounded-xl bg-brand-card border border-brand-border text-text-primary focus:outline-none"
                  />
                  {formErrors.observation_desc && (
                    <p className="text-[11px] text-status-critical mt-1">{formErrors.observation_desc}</p>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formData.observation_is_violation}
                    onChange={(e) => setFormData({ ...formData, observation_is_violation: e.target.checked })}
                    className="w-4 h-4 accent-status-critical rounded"
                  />
                  <span className="text-text-secondary font-semibold">
                    Automatically generate statutory violation case
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex justify-end gap-3 border-t border-brand-border">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-brand-surface border border-brand-border text-text-secondary hover:text-text-primary font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-brand-emerald text-brand-bg font-bold shadow-glow-emerald hover:bg-emerald-400 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{isSubmitting ? 'Submitting...' : 'Submit & Synchronize'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Inspection Details Drawer */}
      {selectedInspection && (
        <Drawer
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Inspection Log #${selectedInspection.inspection_number || selectedInspection.id}`}
          subtitle={`Conducted at ${mineMap[selectedInspection.mine_id]?.name || 'Mine #' + selectedInspection.mine_id}`}
          width="max-w-xl"
        >
          <div className="space-y-6 text-xs">
            {/* Summary Highlights Card */}
            <div className="p-4 rounded-2xl bg-brand-card border border-brand-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-brand-emerald">
                  {selectedInspection.inspection_number || `INSP-${selectedInspection.id}`}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-success/20 text-status-success border border-status-success/30">
                  {selectedInspection.status || 'COMPLETED'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-text-secondary pt-2 border-t border-brand-border/60">
                <div>
                  <p className="text-[10px] text-text-muted font-semibold">Target Mine</p>
                  <p className="font-bold text-text-primary mt-0.5">
                    {mineMap[selectedInspection.mine_id]?.name || `Mine ID #${selectedInspection.mine_id}`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-semibold">Inspector Assigned</p>
                  <p className="font-bold text-text-primary mt-0.5">
                    {selectedInspection.inspector_name || `Inspector #${selectedInspection.inspector_id || 1}`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-semibold">GPS Location</p>
                  <p className="font-mono text-brand-teal mt-0.5">
                    {selectedInspection.gps_lat?.toFixed(4)}, {selectedInspection.gps_lng?.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-semibold">Sync Origin</p>
                  <p className="font-bold text-text-primary mt-0.5">
                    {selectedInspection.is_offline_sync ? 'OFFLINE BUFFER' : 'ONLINE DIRECT'}
                  </p>
                </div>
              </div>
            </div>

            {/* Field Notes */}
            <div className="space-y-2">
              <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-teal" />
                <span>Inspector Field Notes</span>
              </h4>
              <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border text-text-secondary leading-relaxed font-sans">
                {selectedInspection.notes || 'Routine statutory safety sweep conducted. All active extraction roadways inspected.'}
              </div>
            </div>

            {/* Observations List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Logged Observations ({selectedInspection.observations?.length || 0})</span>
                </h4>
              </div>

              {(!selectedInspection.observations || selectedInspection.observations.length === 0) ? (
                <div className="p-4 rounded-xl bg-brand-surface/40 border border-brand-border text-center text-text-muted">
                  Zero statutory observations or violations recorded during this sweep.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedInspection.observations.map((obs, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-brand-card border border-brand-border space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-brand-teal">Regulation #{obs.regulation_id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-status-critical/15 text-status-critical border border-status-critical/30">
                          {obs.severity || 'HIGH'}
                        </span>
                      </div>
                      <p className="text-text-primary">{obs.description}</p>
                      {obs.is_violation && (
                        <div className="pt-1 flex items-center gap-1 text-[11px] text-status-critical font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Generated active statutory violation case</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-brand-border flex gap-3">
              <button
                onClick={() => {
                  setIsDetailsOpen(false);
                  navigate('/gis');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-brand-surface border border-brand-border text-text-primary font-bold text-xs hover:border-brand-emerald/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-4 h-4 text-brand-teal" />
                <span>View On GIS Command Map</span>
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
