import React, { useState } from 'react';
import { Bell, AlertCircle, Clock, AlertTriangle, FileCheck, ShieldCheck, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const NOTIFICATION_LIST = [
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

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(NOTIFICATION_LIST);
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showToast('All notifications marked as read.', 'info');
  };

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return n.unread;
    if (filter !== 'ALL') return n.category === filter;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-brand-emerald" />
            <span>Compliance Notification Center</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Real-time critical alerts, statutory SLA breaches, and orbital anomaly signals
          </p>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-semibold text-text-secondary hover:text-brand-emerald transition-colors"
        >
          <Check className="w-4 h-4" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'UNREAD', 'CRITICAL_RISK', 'SLA_BREACH', 'MONITORING'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
              filter === cat
                ? 'bg-brand-forest text-brand-emerald border border-brand-emerald/40'
                : 'bg-brand-card border border-brand-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.link)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-brand-emerald/40 shadow-sm flex items-start gap-4 ${
              item.unread ? 'bg-brand-card border-brand-border' : 'bg-brand-surface/40 border-brand-border/40 opacity-75'
            }`}
          >
            <div className="mt-1">
              {item.category === 'CRITICAL_RISK' && <AlertCircle className="w-5 h-5 text-status-critical" />}
              {item.category === 'SLA_BREACH' && <Clock className="w-5 h-5 text-amber-400" />}
              {item.category === 'MONITORING' && <AlertTriangle className="w-5 h-5 text-brand-teal" />}
              {item.category === 'OCR' && <FileCheck className="w-5 h-5 text-brand-emerald" />}
              {item.category === 'AUDIT' && <ShieldCheck className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-text-primary">{item.title}</h3>
                <span className="text-[10px] font-mono text-text-muted">{item.timestamp}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
