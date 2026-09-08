import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Moon, ChevronDown, RefreshCw, LogOut, Shield, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useScope } from '../../context/ScopeContext';
import { useToast } from '../../context/ToastContext';
import { demoService } from '../../services/demoService';
import { APP_TAGLINE } from '../../utils/constants';

export const Topbar = ({ isCollapsed, onOpenSearch, onOpenNotifications, onToggleAICopilot }) => {
  const { user, logout } = useAuth();
  const { selectedScope, setSelectedScope, subsidiaries } = useScope();
  const { showToast } = useToast();
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    showToast('Session ended. Redirecting to Login...', 'info');
    navigate('/login');
  };

  // Get user role badge color
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CORPORATE':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'REGULATOR':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'MINE_OFFICER':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'INSPECTOR':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      default:
        return 'bg-brand-forest text-brand-emerald border-brand-emerald/30';
    }
  };

  const userDisplayName = user?.name || 'Authorized Official';
  const userRole = user?.role || 'MINE_OFFICER';
  const userScopeLabel = user?.mine_name
    ? `${user.mine_name} • ${user.subsidiary || 'NCL'}`
    : (user?.subsidiary || 'Enterprise Scope');

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
                Jurisdiction / Subsidiary Scope
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

        {/* Authenticated User Profile Display & Direct Logout Button */}
        <div className="flex items-center gap-2 pl-2 border-l border-brand-border/60">
          <div className="flex items-center gap-2.5 pl-2 pr-2.5 py-1 rounded-xl bg-brand-surface border border-brand-border">
            <div className="w-7 h-7 rounded-lg bg-brand-forest border border-brand-emerald/30 text-brand-emerald font-bold text-xs flex items-center justify-center shadow-md">
              {user?.avatar || 'KD'}
            </div>
            <div className="text-left hidden md:block">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-text-primary leading-tight truncate max-w-[140px]">
                  {userDisplayName}
                </p>
                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getRoleBadgeStyle(userRole)}`}>
                  {userRole}
                </span>
              </div>
              <p className="text-[10px] text-text-muted leading-tight truncate max-w-[180px]">
                {userScopeLabel}
              </p>
            </div>
          </div>

          {/* Direct Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign Out of Session"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-status-critical/10 border border-status-critical/30 text-status-critical text-xs font-semibold hover:bg-status-critical/20 transition-all shadow-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
