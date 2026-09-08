import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  AlertOctagon,
  ClipboardCheck,
  Map,
  Activity,
  FileText,
  BarChart3,
  ShieldCheck,
  Bot,
  Settings,
  CheckCircle2
} from 'lucide-react';
import { APP_NAME, APP_SUBTITLE } from '../../utils/constants';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/mines', label: 'Mines', icon: Building2 },
  { path: '/violations', label: 'Violations', icon: AlertOctagon },
  { path: '/inspections', label: 'Inspections', icon: ClipboardCheck },
  { path: '/gis', label: 'GIS Map', icon: Map },
  { path: '/monitoring', label: 'Monitoring', icon: Activity },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/audit', label: 'Audit Trail', icon: ShieldCheck },
  { path: '/ai', label: 'AI Assistant', icon: Bot },
];

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-brand-bg border-r border-brand-border flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-brand-border gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-forest border border-brand-emerald/40 flex items-center justify-center flex-shrink-0 shadow-glow-emerald">
          {/* Logo Geometric Symbol */}
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-brand-emerald rounded transform rotate-45" />
            <div className="absolute w-2 h-2 bg-brand-teal rounded-full" />
          </div>
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-wide text-text-primary">
                {APP_NAME}
              </span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-brand-emerald uppercase">
              {APP_SUBTITLE}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-forest text-brand-emerald border border-brand-emerald/30 shadow-glow-emerald font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-brand-surface/70 border border-transparent'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Promo & Status */}
      <div className="p-3 border-t border-brand-border space-y-3">
        {!isCollapsed && (
          <div className="relative rounded-xl overflow-hidden p-3.5 bg-gradient-to-br from-brand-surface to-brand-card border border-brand-border">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-brand-emerald/10 rounded-full blur-xl" />
            <div className="w-2 h-0.5 bg-brand-emerald mb-2" />
            <p className="text-xs font-bold text-text-primary tracking-wide">Safer Mines</p>
            <p className="text-xs font-bold text-brand-emerald tracking-wide">Stronger Bharat</p>
          </div>
        )}

        {/* Live Status Indicator */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-brand-surface/60 border border-brand-border/60">
          <div className="relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-status-success animate-ping absolute opacity-75" />
            <div className="w-2.5 h-2.5 rounded-full bg-status-success" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-text-primary leading-none">Online</p>
              <p className="text-[10px] text-text-muted mt-0.5 truncate">All systems operational</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
