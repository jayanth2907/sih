import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { mineService } from '../services/mineService';
import {
  MapPin,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  X,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Radio,
  Building2,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Activity,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRiskCategory, getStatusBadge } from '../utils/formatters';
import { Drawer } from '../components/common/Drawer';

// Custom Marker Icons based on Exact Risk Score Classification
const createMarkerIcon = (score) => {
  const risk = Number(score) || 0;
  let color = '#22C55E';
  let pulseClass = '';

  if (risk >= 80) {
    color = '#F43F5E';
    pulseClass = 'marker-pulse-critical';
  } else if (risk >= 60) {
    color = '#F97316';
  } else if (risk >= 40) {
    color = '#EAB308';
  }

  return L.divIcon({
    className: 'gis-custom-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-7 h-7 rounded-full flex items-center justify-center ${pulseClass}" style="background-color: ${color}33; border: 2.5px solid ${color};">
          <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${color};"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Map Auto-Focus Controller
const MapBoundsController = ({ filteredMines, initialCenter, initialZoom }) => {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Invalidate size once map is mounted so it fills available container height
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    if (!filteredMines || filteredMines.length === 0) return;

    if (filteredMines.length === 1) {
      const m = filteredMines[0];
      if (m.lat && m.lng) {
        map.flyTo([m.lat, m.lng], 9, { animate: true, duration: 1.2 });
      }
    } else if (filteredMines.length > 1) {
      const validCoords = filteredMines
        .filter((m) => m.lat && m.lng)
        .map((m) => [m.lat, m.lng]);

      if (validCoords.length > 0) {
        if (!hasInitialized.current) {
          // On first load, keep India overview
          map.setView(initialCenter, initialZoom);
          hasInitialized.current = true;
        } else {
          const bounds = L.latLngBounds(validCoords);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8, animate: true });
        }
      }
    }
  }, [filteredMines, map, initialCenter, initialZoom]);

  return null;
};

export const GISMapPage = () => {
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [subsidiaryFilter, setSubsidiaryFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  
  // Active details
  const [selectedMine, setSelectedMine] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch real mines from backend API
  const fetchMines = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mineService.getMines();
      setMines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load mine GIS data:', err);
      setError('Unable to load mine telemetry from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMines();
  }, []);

  // Filtered Mines
  const filteredMines = useMemo(() => {
    return mines.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.mine_code?.toLowerCase().includes(q) ||
        m.subsidiary?.toLowerCase().includes(q) ||
        m.state?.toLowerCase().includes(q) ||
        m.district?.toLowerCase().includes(q);

      const matchesSub = subsidiaryFilter === 'ALL' || m.subsidiary === subsidiaryFilter;

      let matchesRisk = true;
      const score = Number(m.risk_score) || 0;
      if (riskFilter === 'CRITICAL') matchesRisk = score >= 80;
      else if (riskFilter === 'HIGH') matchesRisk = score >= 60 && score < 80;
      else if (riskFilter === 'MEDIUM') matchesRisk = score >= 40 && score < 60;
      else if (riskFilter === 'LOW') matchesRisk = score < 40;

      return matchesSearch && matchesSub && matchesRisk;
    });
  }, [mines, search, subsidiaryFilter, riskFilter]);

  // Dynamic Subsidiary List from API Data
  const subsidiaries = useMemo(() => {
    return ['ALL', ...new Set(mines.map((m) => m.subsidiary).filter(Boolean))];
  }, [mines]);

  // Dynamic Summary Metric Counts
  const totalCount = mines.length;
  const criticalCount = useMemo(() => mines.filter((m) => (m.risk_score || 0) >= 80).length, [mines]);
  const highCount = useMemo(() => mines.filter((m) => (m.risk_score || 0) >= 60 && (m.risk_score || 0) < 80).length, [mines]);
  const mediumCount = useMemo(() => mines.filter((m) => (m.risk_score || 0) >= 40 && (m.risk_score || 0) < 60).length, [mines]);
  const lowCount = useMemo(() => mines.filter((m) => (m.risk_score || 0) < 40).length, [mines]);

  const handleOpenDrawer = (mine) => {
    setSelectedMine(mine);
    setIsDrawerOpen(true);
  };

  // Helper for reporting gap calculation
  const getReportingGapInfo = (expected, actual) => {
    const exp = Number(expected) || 10;
    const act = Number(actual) || 0;
    if (act >= exp) {
      return { status: 'On Schedule', isGap: false, pct: 0 };
    }
    const gapPct = Math.round(((exp - act) / exp) * 100);
    return { status: `Reporting Gap: ${gapPct}%`, isGap: true, pct: gapPct };
  };

  return (
    <div className="space-y-4 h-[calc(100vh-130px)] flex flex-col">
      {/* Top Header & Summary Bar */}
      <div className="bg-brand-card p-4 rounded-2xl border border-brand-border flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-emerald" />
            <span>Geospatial Risk & Compliance Command Center</span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Pan-India geospatial risk telemetry correlating mine coordinates with statutory reporting cadences
          </p>
        </div>

        {/* Dynamic Metric Counts Panel */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-center">
            <span className="text-[10px] text-text-muted uppercase font-semibold">Total</span>
            <p className="text-xs font-mono font-bold text-text-primary">{totalCount} Mines</p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-brand-surface border border-status-critical/40 text-center">
            <span className="text-[10px] text-status-critical uppercase font-semibold">Critical</span>
            <p className="text-xs font-mono font-bold text-status-critical">{criticalCount}</p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-brand-surface border border-orange-500/40 text-center">
            <span className="text-[10px] text-orange-400 uppercase font-semibold">High</span>
            <p className="text-xs font-mono font-bold text-orange-400">{highCount}</p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-brand-surface border border-yellow-400/40 text-center">
            <span className="text-[10px] text-yellow-400 uppercase font-semibold">Medium</span>
            <p className="text-xs font-mono font-bold text-yellow-400">{mediumCount}</p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-emerald/40 text-center">
            <span className="text-[10px] text-brand-emerald uppercase font-semibold">Low</span>
            <p className="text-xs font-mono font-bold text-brand-emerald">{lowCount}</p>
          </div>

          <button
            onClick={fetchMines}
            disabled={loading}
            title="Refresh Telemetry"
            className="p-2 rounded-xl bg-brand-surface border border-brand-border text-text-secondary hover:text-brand-emerald hover:border-brand-emerald/40 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-emerald' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mine name, code (e.g. MINE-C), subsidiary, state, or district..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-emerald"
          />
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        {/* Subsidiary Filter */}
        <select
          value={subsidiaryFilter}
          onChange={(e) => setSubsidiaryFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-1.5 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-emerald"
        >
          {subsidiaries.map((sub) => (
            <option key={sub} value={sub}>
              {sub === 'ALL' ? 'All Subsidiaries' : sub}
            </option>
          ))}
        </select>

        {/* Risk Filter */}
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-1.5 text-xs rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-emerald"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">Critical (≥ 80)</option>
          <option value="HIGH">High (60 – 79)</option>
          <option value="MEDIUM">Medium (40 – 59)</option>
          <option value="LOW">Low (&lt; 40)</option>
        </select>
      </div>

      {/* Main Map Canvas */}
      <div className="relative flex-1 rounded-2xl overflow-hidden border border-brand-border min-h-[400px] shadow-xl">
        {loading ? (
          <div className="absolute inset-0 bg-brand-bg/80 z-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-brand-emerald animate-spin" />
            <p className="text-xs font-semibold text-text-secondary">Loading live mine telemetry...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 bg-brand-bg/90 z-20 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-status-critical mb-3" />
            <p className="text-sm font-bold text-text-primary mb-1">Unable to load mine telemetry</p>
            <p className="text-xs text-text-secondary max-w-sm mb-4">{error}</p>
            <button
              onClick={fetchMines}
              className="px-4 py-2 rounded-xl bg-status-critical text-white font-bold text-xs hover:bg-rose-600 transition-colors shadow-lg"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Leaflet Map with Working OpenStreetMap Tiles */}
        <MapContainer
          center={[22.8, 82.5]}
          zoom={5.5}
          scrollWheelZoom={true}
          className="w-full h-full dark-tiles z-0"
        >
          {/* OpenStreetMap Tile Layer (No API Key Required) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Auto-bounds & viewport controller */}
          <MapBoundsController
            filteredMines={filteredMines}
            initialCenter={[22.8, 82.5]}
            initialZoom={5.5}
          />

          {/* Mine Markers */}
          {filteredMines.map((mine) => {
            const riskMeta = getRiskCategory(mine.risk_score);
            const statusMeta = getStatusBadge(mine.status);
            const gapInfo = getReportingGapInfo(
              mine.reporting_frequency_expected,
              mine.reporting_frequency_actual
            );

            return (
              <Marker
                key={mine.id}
                position={[mine.lat, mine.lng]}
                icon={createMarkerIcon(mine.risk_score)}
              >
                <Popup className="khandrishti-popup">
                  <div className="p-3 bg-brand-surface text-text-primary rounded-xl border border-brand-border space-y-2.5 min-w-[240px]">
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-forest text-brand-emerald border border-brand-emerald/30">
                          {mine.mine_code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-text-primary mt-1 leading-snug">
                        {mine.name}
                      </h4>
                      <p className="text-[10px] text-text-secondary">
                        {mine.subsidiary} • {mine.district}, {mine.state}
                      </p>
                    </div>

                    {/* Risk & Reporting Metrics */}
                    <div className="p-2 rounded-lg bg-brand-card border border-brand-border space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted font-semibold">Risk Score</span>
                        <span className={`font-mono font-bold px-1.5 py-0.2 rounded ${riskMeta.bg} ${riskMeta.color}`}>
                          {Number(mine.risk_score).toFixed(1)} ({riskMeta.label})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted font-semibold">Reporting Log</span>
                        <span className="font-mono text-text-primary font-bold">
                          {mine.reporting_frequency_actual ?? 10} / {mine.reporting_frequency_expected ?? 10}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted font-semibold">Cadence Signal</span>
                        <span className={`font-semibold ${gapInfo.isGap ? 'text-amber-400' : 'text-brand-emerald'}`}>
                          {gapInfo.status}
                        </span>
                      </div>
                    </div>

                    {/* Silence-to-Risk Anomaly Warning if Significant Gap */}
                    {gapInfo.isGap && gapInfo.pct >= 40 && (
                      <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 leading-snug">
                        <div className="flex items-center gap-1 font-bold mb-0.5">
                          <Radio className="w-3 h-3 animate-pulse" />
                          <span>Governance Signal Detected</span>
                        </div>
                        <p className="text-[9px] text-text-secondary">
                          Available records are inconsistent with expected reporting patterns and require human verification.
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-1 flex flex-col gap-1.5">
                      <button
                        onClick={() => handleOpenDrawer(mine)}
                        className="w-full py-1.5 px-2 rounded-lg bg-brand-forest border border-brand-emerald/40 text-brand-emerald font-bold text-[11px] hover:bg-brand-emerald hover:text-brand-bg transition-colors flex items-center justify-center gap-1"
                      >
                        <span>Open Side Drawer</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => navigate(`/mines/${mine.id}`)}
                          className="py-1 px-1.5 rounded-lg bg-brand-card border border-brand-border text-[10px] font-semibold text-text-secondary hover:text-text-primary text-center"
                        >
                          Full Profile
                        </button>
                        <button
                          onClick={() => navigate(`/violations?mine_id=${mine.id}`)}
                          className="py-1 px-1.5 rounded-lg bg-brand-card border border-brand-border text-[10px] font-semibold text-text-secondary hover:text-text-primary text-center"
                        >
                          Violations
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Top Right Legend */}
        <div className="absolute top-4 right-4 z-[400] bg-brand-surface/95 backdrop-blur-md border border-brand-border rounded-xl p-3 space-y-2 text-xs shadow-2xl">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">MINE RISK LEGEND</p>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-critical shadow-glow-critical" />
              <span className="text-text-secondary">Critical (≥ 80)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-text-secondary">High (60–79)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-text-secondary">Medium (40–59)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-emerald" />
              <span className="text-text-secondary">Low (&lt; 40)</span>
            </div>
          </div>
        </div>

        {/* Zero Results Indicator if filter empty */}
        {filteredMines.length === 0 && !loading && (
          <div className="absolute top-4 left-4 z-[400] bg-brand-surface/95 backdrop-blur-md border border-brand-border rounded-xl px-4 py-2 text-xs text-text-secondary shadow-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>No coal mines match "{search || subsidiaryFilter || riskFilter}"</span>
          </div>
        )}
      </div>

      {/* Full Mine Details Side Drawer */}
      {selectedMine && (
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={selectedMine.name}
          subtitle={`${selectedMine.mine_code} • ${selectedMine.subsidiary} • ${selectedMine.district}, ${selectedMine.state}`}
          width="max-w-xl"
        >
          <div className="space-y-6 text-xs">
            {/* 1. Mine Profile Header */}
            <div className="p-4 rounded-2xl bg-brand-card border border-brand-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase">Risk Classification</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-extrabold font-mono text-status-critical">
                      {Number(selectedMine.risk_score).toFixed(1)}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-status-critical/15 text-status-critical border border-status-critical/30">
                      {getRiskCategory(selectedMine.risk_score).label}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-text-muted uppercase font-semibold">Operational Status</span>
                  <p className="text-xs font-bold text-brand-emerald mt-0.5">{selectedMine.status || 'OPERATIONAL'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-text-secondary pt-2 border-t border-brand-border/60">
                <div>
                  <p className="text-[10px] text-text-muted">Subsidiary</p>
                  <p className="font-semibold text-text-primary">{selectedMine.subsidiary}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">State & District</p>
                  <p className="font-semibold text-text-primary">{selectedMine.district}, {selectedMine.state}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">GPS Latitude</p>
                  <p className="font-mono text-brand-teal">{selectedMine.lat}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">GPS Longitude</p>
                  <p className="font-mono text-brand-teal">{selectedMine.lng}</p>
                </div>
              </div>
            </div>

            {/* 2. Governance Health & Silence-to-Risk Signal */}
            <div className="space-y-3">
              <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-teal" />
                <span>Governance Health & Telemetry Cadence</span>
              </h4>

              <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-muted">Expected Statutory Logs</span>
                  <span className="font-mono font-bold text-text-primary">{selectedMine.reporting_frequency_expected ?? 10} / month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Actual Logs Received</span>
                  <span className="font-mono font-bold text-text-primary">{selectedMine.reporting_frequency_actual ?? 10} / month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Reporting Cadence Gap</span>
                  <span className={`font-mono font-bold ${getReportingGapInfo(selectedMine.reporting_frequency_expected, selectedMine.reporting_frequency_actual).isGap ? 'text-amber-400' : 'text-brand-emerald'}`}>
                    {getReportingGapInfo(selectedMine.reporting_frequency_expected, selectedMine.reporting_frequency_actual).status}
                  </span>
                </div>
              </div>

              {/* Silence-to-Risk alert text if gap */}
              {getReportingGapInfo(selectedMine.reporting_frequency_expected, selectedMine.reporting_frequency_actual).isGap && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Silence-to-Risk Telemetry Notice</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed">
                    "Available governance records are inconsistent with expected reporting patterns and require human verification."
                  </p>
                </div>
              )}
            </div>

            {/* 3. Action Links */}
            <div className="pt-2 space-y-2 border-t border-brand-border">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate(`/mines/${selectedMine.id}`);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-emerald text-brand-bg font-bold text-xs hover:bg-emerald-400 transition-colors shadow-glow-emerald flex items-center justify-center gap-2"
              >
                <span>Open Full Mine Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigate(`/violations?mine_id=${selectedMine.id}`);
                  }}
                  className="py-2 px-2 rounded-xl bg-brand-card border border-brand-border text-[11px] font-semibold text-text-secondary hover:text-text-primary text-center"
                >
                  Violations
                </button>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigate(`/inspections?mine_id=${selectedMine.id}`);
                  }}
                  className="py-2 px-2 rounded-xl bg-brand-card border border-brand-border text-[11px] font-semibold text-text-secondary hover:text-text-primary text-center"
                >
                  Inspections
                </button>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigate('/monitoring');
                  }}
                  className="py-2 px-2 rounded-xl bg-brand-card border border-brand-border text-[11px] font-semibold text-text-secondary hover:text-text-primary text-center"
                >
                  Monitoring
                </button>
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
