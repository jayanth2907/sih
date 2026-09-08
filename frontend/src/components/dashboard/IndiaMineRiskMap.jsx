import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { mineService } from '../../services/mineService';

const DEFAULT_MAP_MINES = [
  { id: 1, name: "Mine A - Jharia Opencast", subsidiary: "BCCL", state: "Jharkhand", lat: 23.7466, lng: 86.4162, risk_score: 22.0, status: "OPERATIONAL" },
  { id: 2, name: "Mine B - Gevra Mega Project", subsidiary: "SECL", state: "Chhattisgarh", lat: 22.3504, lng: 82.6841, risk_score: 78.5, status: "WARNING" },
  { id: 3, name: "Mine C - Singrauli Block-B", subsidiary: "NCL", state: "Madhya Pradesh", lat: 24.2012, lng: 82.6644, risk_score: 87.85, status: "CRITICAL" },
  { id: 4, name: "Mine D - Raniganj Sonepur", subsidiary: "ECL", state: "West Bengal", lat: 23.6333, lng: 87.1667, risk_score: 94.5, status: "CRITICAL" },
  { id: 5, name: "Mine E - Talcher Ananta", subsidiary: "MCL", state: "Odisha", lat: 20.9500, lng: 85.2333, risk_score: 15.0, status: "OPERATIONAL" },
  { id: 6, name: "Mine F - Piparwar Opencast", subsidiary: "CCL", state: "Jharkhand", lat: 23.7167, lng: 85.0333, risk_score: 42.0, status: "OPERATIONAL" },
  { id: 7, name: "Mine G - Dipka Mega Project", subsidiary: "SECL", state: "Chhattisgarh", lat: 22.3167, lng: 82.6500, risk_score: 35.0, status: "OPERATIONAL" },
  { id: 8, name: "Mine H - Rajmahal Opencast", subsidiary: "ECL", state: "Jharkhand", lat: 25.0500, lng: 87.3500, risk_score: 62.0, status: "WARNING" },
  { id: 9, name: "Mine I - Belpahar Coalfield", subsidiary: "MCL", state: "Odisha", lat: 21.6500, lng: 83.8667, risk_score: 28.0, status: "OPERATIONAL" },
  { id: 10, name: "Mine J - Kusmunda Project", subsidiary: "SECL", state: "Chhattisgarh", lat: 22.3333, lng: 82.7000, risk_score: 18.0, status: "OPERATIONAL" },
];

const createCustomIcon = (risk) => {
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
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-6 h-6 rounded-full flex items-center justify-center ${pulseClass}" style="background-color: ${color}33; border: 2px solid ${color};">
          <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${color};"></div>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const IndiaMineRiskMap = ({ minesList }) => {
  const navigate = useNavigate();
  const [mines, setMines] = useState(DEFAULT_MAP_MINES);

  useEffect(() => {
    if (minesList && minesList.length > 0) {
      setMines(minesList);
    } else {
      mineService.getMines().then((res) => {
        if (res && res.length > 0) setMines(res);
      }).catch(() => {});
    }
  }, [minesList]);

  // Compute live breakdown counts from actual API records
  const totalMines = mines.length;
  const criticalCount = mines.filter(m => (m.risk_score || 0) >= 80).length;
  const highCount = mines.filter(m => (m.risk_score || 0) >= 60 && (m.risk_score || 0) < 80).length;
  const mediumCount = mines.filter(m => (m.risk_score || 0) >= 40 && (m.risk_score || 0) < 60).length;
  const lowCount = mines.filter(m => (m.risk_score || 0) < 40).length;

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-forest border border-brand-emerald/40 flex items-center justify-center text-brand-emerald">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">India Mine Risk Map</h3>
            <p className="text-[11px] text-text-secondary">Geospatial Risk Telemetry</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/gis')}
          className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-brand-emerald transition-colors"
        >
          <span>View Full Map</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 min-h-[260px] rounded-xl overflow-hidden border border-brand-border/60">
        <MapContainer
          center={[23.0, 83.5]}
          zoom={5}
          scrollWheelZoom={false}
          className="w-full h-full dark-tiles z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mines.map((m) => (
            <Marker
              key={m.id}
              position={[m.lat || 23.5, m.lng || 85.0]}
              icon={createCustomIcon(m.risk_score || 50)}
            >
              <Popup className="custom-popup">
                <div className="p-2 text-brand-bg">
                  <p className="font-bold text-xs text-brand-forest">{m.name}</p>
                  <p className="text-[11px] text-gray-700">{m.subsidiary} • {m.state}</p>
                  <p className="text-xs font-bold mt-1 text-rose-700">Risk Score: {Number(m.risk_score).toFixed(1)}</p>
                  <button
                    onClick={() => navigate(`/mines/${m.id}`)}
                    className="mt-2 w-full px-2 py-1 text-[10px] font-bold rounded bg-brand-forest text-white hover:bg-emerald-800"
                  >
                    Open Mine Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Top Right Legend */}
        <div className="absolute top-3 right-3 z-[400] bg-brand-surface/90 backdrop-blur-md border border-brand-border rounded-xl p-2.5 space-y-1.5 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-critical" />
            <span className="text-text-secondary">Critical (≥ 80)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-text-secondary">High (60–79)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-text-secondary">Medium (40–59)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success" />
            <span className="text-text-secondary">Low (&lt; 40)</span>
          </div>
        </div>
      </div>

      {/* Bottom Stats Summary */}
      <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-brand-border/60 text-center">
        <div className="bg-brand-surface/60 rounded-lg p-1.5 border border-brand-border/40">
          <p className="text-sm font-bold font-mono text-text-primary">{totalMines}</p>
          <p className="text-[10px] text-text-muted">Mines</p>
        </div>
        <div className="bg-brand-surface/60 rounded-lg p-1.5 border border-brand-border/40">
          <p className="text-sm font-bold font-mono text-status-critical">{criticalCount}</p>
          <p className="text-[10px] text-text-muted">Critical</p>
        </div>
        <div className="bg-brand-surface/60 rounded-lg p-1.5 border border-brand-border/40">
          <p className="text-sm font-bold font-mono text-orange-400">{highCount}</p>
          <p className="text-[10px] text-text-muted">High</p>
        </div>
        <div className="bg-brand-surface/60 rounded-lg p-1.5 border border-brand-border/40">
          <p className="text-sm font-bold font-mono text-yellow-400">{mediumCount}</p>
          <p className="text-[10px] text-text-muted">Medium</p>
        </div>
        <div className="bg-brand-surface/60 rounded-lg p-1.5 border border-brand-border/40">
          <p className="text-sm font-bold font-mono text-status-success">{lowCount}</p>
          <p className="text-[10px] text-text-muted">Low</p>
        </div>
      </div>
    </div>
  );
};
