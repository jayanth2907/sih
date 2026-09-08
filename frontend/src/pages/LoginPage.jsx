import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, Sparkles, Building2, UserCheck } from 'lucide-react';
import { APP_NAME, APP_SUBTITLE, APP_TAGLINE } from '../utils/constants';

const PERSONAS = [
  {
    role: 'MINE_OFFICER',
    title: 'Mine Safety Officer',
    name: 'Priya Verma',
    scope: 'Mine C (Singrauli) • NCL',
    identifier: 'officer.jharia@bccl.co.in',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  {
    role: 'CORPORATE',
    title: 'Corporate Safety Dir.',
    name: 'Dr. Anil Deshmukh',
    scope: 'Coal India • SECL Scope',
    identifier: 'dir.safety@coalindia.in',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
  },
  {
    role: 'REGULATOR',
    title: 'DGMS Chief Auditor',
    name: 'Sanjay Chatterji',
    scope: 'DGMS / MoC Regulatory',
    identifier: 'dg.dgms@dgms.gov.in',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  },
  {
    role: 'ADMIN',
    title: 'System Administrator',
    name: 'Admin Enterprise',
    scope: 'All India • 10 Mines',
    identifier: 'admin@coalgov.gov.in',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    role: 'INSPECTOR',
    title: 'Field Inspector',
    name: 'Rajesh Kumar',
    scope: 'Dhanbad & Singrauli Field',
    identifier: 'inspector.dhanbad@dgms.gov.in',
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/30'
  }
];

export const LoginPage = () => {
  const [identifier, setIdentifier] = useState('officer.jharia@bccl.co.in');
  const [password, setPassword] = useState('demo');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await login(identifier, password);
      showToast(`Authenticated as ${res.user.name} (${res.user.role})`, 'success');
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Invalid credentials. Please verify your email/username and passcode.';
      setErrorMsg(detail);
      showToast(detail, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonaClick = async (persona) => {
    setIdentifier(persona.identifier);
    setPassword('demo');
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await login(persona.identifier, 'demo');
      showToast(`Logged in as ${res.user.name} (${res.user.role})`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg('Failed to log in with persona.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-emerald/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-surface border border-brand-emerald/40 shadow-glow-emerald mb-3">
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-emerald rounded transform rotate-45" />
            <div className="absolute w-3 h-3 bg-brand-teal rounded-full" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
          {APP_NAME} <span className="text-brand-emerald text-sm uppercase px-2 py-0.5 rounded bg-brand-forest border border-brand-emerald/30 font-semibold">{APP_SUBTITLE}</span>
        </h1>
        <p className="mt-1.5 text-xs text-text-secondary max-w-sm mx-auto font-medium">
          {APP_TAGLINE}
        </p>
        <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-brand-card/80 border border-brand-border text-[11px] text-text-muted">
          <Shield className="w-3.5 h-3.5 text-brand-emerald" />
          <span>Ministry of Coal • DGMS Compliant Portal</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-brand-surface border border-brand-border py-7 px-6 shadow-2xl rounded-2xl sm:px-8 backdrop-blur-sm">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-status-critical/10 border border-status-critical/30 flex items-center gap-2.5 text-status-critical text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Official Government / Officer ID or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-brand-card border border-brand-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-emerald transition-colors"
                  placeholder="e.g. officer.jharia@bccl.co.in or mine_officer1"
                />
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-text-secondary">
                  Security Passcode
                </label>
                <span className="text-[10px] text-brand-emerald">Default: demo</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-brand-card border border-brand-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-emerald transition-colors"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-emerald text-brand-bg font-bold text-xs hover:bg-emerald-400 transition-all shadow-glow-emerald flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating Identity...</span>
              ) : (
                <>
                  <span>Sign In to Governance Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Persona Access for SIH Evaluation */}
          <div className="mt-6 pt-5 border-t border-brand-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-emerald" />
                <span>SIH Quick Persona Switcher</span>
              </span>
              <span className="text-[10px] text-brand-teal font-medium">True RBAC Enforced</span>
            </div>

            <div className="space-y-1.5">
              {PERSONAS.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handlePersonaClick(p)}
                  disabled={isLoading}
                  className="w-full text-left p-2 rounded-xl bg-brand-card/60 hover:bg-brand-card border border-brand-border/60 hover:border-brand-emerald/40 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-brand-forest text-brand-emerald font-bold text-xs flex items-center justify-center shrink-0 border border-brand-emerald/20">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-text-primary group-hover:text-brand-emerald transition-colors">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-text-muted truncate">
                        {p.title} • {p.scope}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-md border font-semibold shrink-0 ${p.badgeClass}`}>
                    {p.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
