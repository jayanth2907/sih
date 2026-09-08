import React from 'react';
import { Drawer } from '../common/Drawer';
import { AlertCircle, Clock, AlertTriangle, ShieldCheck, FileCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "Critical Risk Escalation: Mine C (Singrauli)",
    message: "Unified risk score escalated to 87.85 (CRITICAL). 4 similar statutory violations logged in past 30 days.",
    category: "CRITICAL_RISK",
    timestamp: "10 mins ago",
    link: "/violations/1",
    unread: true,
  },
  {
    id: 2,
    title: "SLA Breached: Gas Accumulation Seam #4",
    message: "SLA expired for Methane Accumulation (V-1024). Auto-escalated to DGMS Regional Inspector.",
    category: "SLA_BREACH",
    timestamp: "25 mins ago",
    link: "/violations/1",
    unread: true,
  },
  {
    id: 3,
    title: "Silence Drift Anomaly Detected",
    message: "Mine D Raniganj field reporting frequency dropped by 75% compared to baseline.",
    category: "MONITORING",
    timestamp: "1 hour ago",
    link: "/monitoring",
    unread: true,
  },
  {
    id: 4,
    title: "Document OCR Extraction Completed",
    message: "Paper register scan digitized with 94% confidence. Matched to CMR 2017 Regulation 128.",
    category: "OCR",
    timestamp: "2 hours ago",
    link: "/documents",
    unread: false,
  },
  {
    id: 5,
    title: "Cryptographic Ledger Verified",
    message: "SHA-256 tamper-evident hash chain verified across 1,420 governance events.",
    category: "AUDIT",
    timestamp: "3 hours ago",
    link: "/audit",
    unread: false,
  },
];

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleNavigate = (link) => {
    navigate(link);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Center"
      subtitle="Critical compliance alerts, SLA timers & intelligence signals"
      width="max-w-md"
    >
      <div className="space-y-3">
        {MOCK_NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            onClick={() => handleNavigate(n.link)}
            className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-brand-emerald/40 ${
              n.unread
                ? 'bg-brand-surface border-brand-border/80 shadow-md'
                : 'bg-brand-card/40 border-brand-border/40 opacity-75'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {n.category === 'CRITICAL_RISK' && <AlertCircle className="w-5 h-5 text-status-critical" />}
                {n.category === 'SLA_BREACH' && <Clock className="w-5 h-5 text-status-warning" />}
                {n.category === 'MONITORING' && <AlertTriangle className="w-5 h-5 text-brand-teal" />}
                {n.category === 'OCR' && <FileCheck className="w-5 h-5 text-brand-emerald" />}
                {n.category === 'AUDIT' && <ShieldCheck className="w-5 h-5 text-sky-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-text-primary truncate">{n.title}</span>
                  {n.unread && <span className="w-2 h-2 rounded-full bg-status-critical flex-shrink-0" />}
                </div>
                <p className="text-xs text-text-secondary line-clamp-2 mb-2">{n.message}</p>
                <div className="flex items-center justify-between text-[10px] text-text-muted">
                  <span>{n.timestamp}</span>
                  <span className="flex items-center gap-1 text-brand-emerald font-semibold hover:underline">
                    View Details <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
};
