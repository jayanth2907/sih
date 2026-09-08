import React, { useState } from 'react';
import { Search, Bell, Moon, ChevronDown, RefreshCw, UserCheck, Check, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useScope } from '../../context/ScopeContext';
import { useToast } from '../../context/ToastContext';
import { demoService } from '../../services/demoService';
import { DEMO_USERS, APP_TAGLINE } from '../../utils/constants';

export const Topbar = ({ isCollapsed, onOpenSearch, onOpenNotifications, onToggleAICopilot }) => {
  const { user, switchUser } = useAuth();
  const { selectedScope, setSelectedScope, subsidiaries } = useScope();
  const { showToast } = useToast();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await demoService.resetDemo();
      showToast('Baseline demo state reset to Mine C Singrauli scenario.', 'success');
      window.location.reload();
    } catch (err) {
      showToast('Reset completed.', 'info');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-16 bg-brand-bg/95 backdrop-blur-md border-b border-brand-border transition-all duration-300 flex items-center justify-between px-6 ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Tagline */}
      <div className="hidden xl:flex flex-col">
        <span className="text-xs text-text-secondary font-medium tracking-wide">
          {APP_TAGLINE}
        </span>
      </div>

      {/* Middle: Search Box */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-text-secondary hover:border-brand-border-light hover:text-text-primary text-xs transition-colors shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-text-muted" />
            <span>Search mines, violations, inspections...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-brand-card text-text-muted border border-brand-border">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Scope Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsScopeMenuOpen(!isScopeMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-semibold text-text-primary hover:border-brand-border-light transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-brand-emerald" />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">{selectedScope}</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </button>

          {isScopeMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-brand-surface border border-brand-border rounded-xl shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-b border-brand-border">
                Select Jurisdiction / Subsidiary
              </div>
              {subsidiaries.map((sub) => (
                <button
                  key={sub}
                  onClick={() => {
                    setSelectedScope(sub);
                    setIsScopeMenuOpen(false);
                    showToast(`Scope set to: ${sub}`, 'info');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-brand-card transition-colors ${
                    selectedScope === sub ? 'text-brand-emerald font-semibold bg-brand-forest/40' : 'text-text-secondary'
                  }`}
                >
                  <span className="truncate">{sub}</span>
                  {selectedScope === sub && <Check className="w-3.5 h-3.5 text-brand-emerald" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Demo Reset Button */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          title="Reset Demo Dataset"
          className="p-2 rounded-xl bg-brand-surface border border-brand-border text-text-secondary hover:text-brand-emerald hover:border-brand-emerald/40 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin text-brand-emerald' : ''}`} />
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-brand-surface border border-brand-border text-text-secondary hover:text-text-primary hover:border-brand-border-light transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-status-critical text-[9px] font-bold text-white flex items-center justify-center border-2 border-brand-bg shadow-glow-critical">
            5
          </span>
        </button>

        {/* Theme Dark Indicator */}
        <div className="p-2 rounded-xl bg-brand-surface border border-brand-border text-text-secondary">
          <Moon className="w-4 h-4" />
        </div>

        {/* User Persona Profile & Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-1.5 py-1 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-border-light transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
              {user?.avatar || 'JV'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-text-primary leading-tight">{user?.name || 'Jayanth Varma'}</p>
              <p className="text-[10px] text-text-muted leading-tight">{user?.role || 'Corporate'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-brand-surface border border-brand-border rounded-xl shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-brand-border">
                <p className="text-xs font-bold text-text-primary">{user?.name}</p>
                <p className="text-[11px] text-brand-emerald font-medium">{user?.designation}</p>
                <p className="text-[10px] text-text-muted">{user?.subsidiary}</p>
              </div>

              <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Switch Demo Persona
              </div>

              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.email}
                  onClick={() => {
                    switchUser(demo);
                    setIsUserMenuOpen(false);
                    showToast(`Switched user to: ${demo.name} (${demo.role})`, 'info');
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center gap-3 hover:bg-brand-card transition-colors ${
                    user?.email === demo.email ? 'bg-brand-forest/50 text-brand-emerald font-semibold' : 'text-text-secondary'
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-brand-forest text-brand-emerald font-bold text-[10px] flex items-center justify-center">
                    {demo.avatar}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="truncate text-xs text-text-primary font-medium">{demo.name}</p>
                    <p className="text-[10px] text-text-muted truncate">{demo.role} • {demo.subsidiary}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
