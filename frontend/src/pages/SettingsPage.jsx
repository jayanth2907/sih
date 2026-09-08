import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Settings, User, Globe, Shield, Bell, CheckCircle2, Lock } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [lang, setLang] = useState('en');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsCritical, setSmsCritical] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Platform preferences updated successfully.', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-brand-emerald" />
          <span>Platform & Officer Profile Settings</span>
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Role-aware governance privileges, notification dispatch thresholds, and language preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Identity Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <User className="w-4 h-4 text-brand-teal" />
            <span>Authenticated Official Identity</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Full Officer Name</label>
              <input
                type="text"
                readOnly
                value={user?.name || 'Jayanth Varma'}
                className="w-full px-3 py-2 rounded-xl bg-brand-surface border border-brand-border text-text-primary cursor-not-allowed font-semibold"
              />
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Government / Corporate Email</label>
              <input
                type="text"
                readOnly
                value={user?.email || 'corporate.hq@coalindia.in'}
                className="w-full px-3 py-2 rounded-xl bg-brand-surface border border-brand-border text-text-primary cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Security Role</label>
              <input
                type="text"
                readOnly
                value={user?.role || 'CORPORATE'}
                className="w-full px-3 py-2 rounded-xl bg-brand-surface border border-brand-border text-brand-emerald font-bold font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Assigned Jurisdiction</label>
              <input
                type="text"
                readOnly
                value={user?.subsidiary || 'Coal India HQ'}
                className="w-full px-3 py-2 rounded-xl bg-brand-surface border border-brand-border text-text-primary cursor-not-allowed font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Language & Localisation */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-emerald" />
            <span>Language & Localization</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Preferred Interface Language</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-emerald"
              >
                <option value="en">English (Official Regulatory Standard)</option>
                <option value="hi">हिंदी (Hindi Multilingual Support)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statutory Alerts Dispatch */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Statutory Notification Dispatch</span>
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-brand-emerald rounded"
              />
              <div>
                <p className="font-semibold text-text-primary">Email Dispatch for SLA Breaches</p>
                <p className="text-[11px] text-text-muted">Transmit immediate alert to Mine General Manager when resolution SLA breaches 24h limit</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsCritical}
                onChange={(e) => setSmsCritical(e.target.checked)}
                className="w-4 h-4 accent-brand-emerald rounded"
              />
              <div>
                <p className="font-semibold text-text-primary">SMS Alerts for Critical Risk (&gt;80)</p>
                <p className="text-[11px] text-text-muted">Direct dispatch to DGMS Regional Directorate on critical multi-point methane detections</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-brand-emerald text-brand-bg font-bold text-xs hover:bg-emerald-400 transition-colors shadow-glow-emerald"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
