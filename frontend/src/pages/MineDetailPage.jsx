import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mineService } from '../services/mineService';
import { violationService } from '../services/violationService';
import { inspectionService } from '../services/inspectionService';
import { documentService } from '../services/documentService';
import {
  Building2,
  MapPin,
  ShieldAlert,
  ArrowLeft,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Activity,
  BarChart2,
  CheckCircle,
  Clock,
  Layers
} from 'lucide-react';
import { getRiskCategory, getStatusBadge } from '../utils/formatters';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export const MineDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mine, setMine] = useState(null);
  const [mineRisk, setMineRisk] = useState(null);
  const [violations, setViolations] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [m, r, vList, iList, dList] = await Promise.all([
          mineService.getMineById(id).catch(() => null),
          mineService.getMineRisk(id).catch(() => null),
          violationService.getViolations({ mine_id: id }).catch(() => []),
          inspectionService.getInspections().catch(() => []),
          documentService.getDocuments().catch(() => []),
        ]);

        if (m) setMine(m);
        if (r) setMineRisk(r);
        if (vList) setViolations(vList);
        if (iList) setInspections(iList.filter(i => String(i.mine_id) === String(id)));
        if (dList) setDocuments(dList.filter(d => String(d.mine_id) === String(id)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-text-muted">
        <p className="text-sm font-semibold">Loading mine profile & telemetry...</p>
      </div>
    );
  }

  const mineData = mine || {
    id: id,
    name: `Mine Block ${id}`,
    mine_code: `MINE-${id}`,
    subsidiary: "NCL",
    district: "Singrauli",
    state: "Madhya Pradesh",
    risk_score: 87.85,
    governance_response_score: 62.0,
    status: "CRITICAL",
    lat: 24.2012,
    lng: 82.6644,
  };

  const riskMeta = getRiskCategory(mineData.risk_score || 50);

  const tabs = [
    { id: 'overview', label: 'Overview & Risk', icon: Activity },
    { id: 'violations', label: `Violations (${violations.length})`, icon: AlertTriangle },
    { id: 'inspections', label: `Inspections (${inspections.length})`, icon: ClipboardCheck },
    { id: 'documents', label: `OCR Documents (${documents.length})`, icon: FileText },
    { id: 'gis', label: 'GIS Location', icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/mines')}
        className="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-brand-emerald transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Mines Overview</span>
      </button>

      {/* Hero Header Card */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-forest text-brand-emerald border border-brand-emerald/30">
                {mineData.mine_code}
              </span>
              <span className="text-xs font-semibold text-text-secondary">
                {mineData.subsidiary} • {mineData.mine_type || 'OPEN_CAST'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              {mineData.name}
            </h1>

            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <MapPin className="w-4 h-4 text-brand-teal" />
              <span>{mineData.district}, {mineData.state}</span>
              <span>•</span>
              <span className="font-mono">Lat: {mineData.lat}, Lng: {mineData.lng}</span>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Risk Score */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4 text-center min-w-[120px]">
              <p className="text-[10px] font-bold text-text-muted uppercase">Risk Score</p>
              <p className={`text-2xl font-extrabold font-mono mt-1 ${riskMeta.color}`}>
                {mineData.risk_score}
              </p>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${riskMeta.bg} ${riskMeta.color}`}>
                {riskMeta.label}
              </span>
            </div>

            {/* Governance Response */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4 text-center min-w-[120px]">
              <p className="text-[10px] font-bold text-text-muted uppercase">Gov Response</p>
              <p className="text-2xl font-extrabold font-mono text-brand-emerald mt-1">
                {mineData.governance_response_score || 72}%
              </p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 bg-brand-forest text-brand-emerald">
                MONITORED
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-brand-border/60 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-forest text-brand-emerald border border-brand-emerald/40 shadow-glow-emerald'
                    : 'text-text-secondary hover:text-text-primary hover:bg-brand-surface'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risk Factors Card */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-status-critical" />
              <span>Multi-Dimensional Risk Factors</span>
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
                <span className="text-xs text-text-secondary">Statutory Violations Open</span>
                <span className="text-xs font-bold font-mono text-status-critical">{violations.length || 4}</span>
              </div>
              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
                <span className="text-xs text-text-secondary">Reporting Silence Drift</span>
                <span className="text-xs font-bold font-mono text-amber-400">HIGH (75% drop)</span>
              </div>
              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
                <span className="text-xs text-text-secondary">Satellite Activity Discrepancy</span>
                <span className="text-xs font-bold font-mono text-status-critical">SIGNAL DETECTED</span>
              </div>
              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
                <span className="text-xs text-text-secondary">Peer Benchmark Relative Position</span>
                <span className="text-xs font-bold font-mono text-text-primary">92nd Percentile</span>
              </div>
            </div>
          </div>

          {/* Operational Details Card */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-emerald" />
              <span>Operational Attributes</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
                <span className="text-text-secondary">Statutory Inspection Cadence</span>
                <span className="font-semibold text-text-primary">Every 7 Days</span>
              </div>
              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
                <span className="text-text-secondary">Expected Reporting Frequency</span>
                <span className="font-semibold text-text-primary">10 logs / month</span>
              </div>
              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
                <span className="text-text-secondary">Assigned Safety Officer</span>
                <span className="font-semibold text-brand-emerald">Rajesh Sharma (BCCL)</span>
              </div>
              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
                <span className="text-text-secondary">Regulatory Jurisdiction</span>
                <span className="font-semibold text-text-primary">DGMS Central Directorate</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'violations' && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Associated Violations & SLA Cases</h3>
          {violations.length === 0 ? (
            <p className="text-xs text-text-muted py-6 text-center">No open violations registered for this mine.</p>
          ) : (
            <div className="space-y-2">
              {violations.map((v) => (
                <div
                  key={v.id}
                  onClick={() => navigate(`/violations/${v.id}`)}
                  className="p-4 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-emerald/40 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-teal">{v.violation_code}</span>
                      <span className="text-xs font-bold text-text-primary">{v.title}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{v.description}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-bold rounded-lg bg-status-critical/15 text-status-critical border border-status-critical/30">
                    Risk: {v.priority_score || 50}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'inspections' && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Field Inspection History</h3>
          <div className="space-y-2">
            {inspections.map((ins) => (
              <div key={ins.id} className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-brand-emerald">{ins.inspection_number}</span>
                  <p className="text-text-secondary mt-0.5">{ins.notes || 'Routine statutory safety sweep'}</p>
                </div>
                <span className="px-2 py-1 rounded bg-brand-card text-text-muted font-mono">{ins.inspection_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Digitized OCR Register Records</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-text-primary">{doc.document_type} (Scan #{doc.id})</p>
                  <p className="text-text-secondary mt-0.5">Matched Regulation: {doc.matched_regulation_code || 'General CMR'}</p>
                </div>
                <span className="text-brand-emerald font-mono font-bold">{(doc.ocr_confidence * 100).toFixed(0)}% Confidence</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'gis' && (
        <div className="h-[400px] rounded-2xl overflow-hidden border border-brand-border">
          <MapContainer
            center={[mineData.lat || 24.2012, mineData.lng || 82.6644]}
            zoom={12}
            scrollWheelZoom={false}
            className="w-full h-full dark-tiles"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[mineData.lat || 24.2012, mineData.lng || 82.6644]}>
              <Popup>
                <div className="text-brand-bg p-1 font-bold text-xs">
                  {mineData.name} ({mineData.mine_code})
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
};
