import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Lock, Mail, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';
import { DEMO_USERS, APP_NAME, APP_SUBTITLE, APP_TAGLINE } from '../utils/constants';

export const LoginPage = () => {
  const [email, setEmail] = useState('officer.jharia@bccl.co.in');
  const [password, setPassword] = useState('demo');
  const [isLoading, setIsLoading] = useState(false);
  const { login, switchUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      showToast(`Welcome back, ${email.split('@')[0]}`, 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast('Authentication error. Logging in with demo credentials.', 'info');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPersonaSelect = (demoUser) => {
    setEmail(demoUser.email);
    setPassword('demo');
    switchUser(demoUser);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-emerald/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-forest border border-brand-emerald/40 shadow-glow-emerald mb-4">
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-emerald rounded transform rotate-45" />
            <div className="absolute w-3 h-3 bg-brand-teal rounded-full" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">
          {APP_NAME} <span className="text-brand-emerald text-sm uppercase px-2 py-0.5 rounded bg-brand-forest border border-brand-emerald/30">{APP_SUBTITLE}</span>
        </h2>
        <p className="mt-2 text-xs text-text-secondary max-w-sm mx-auto">
          {APP_TAGLINE}
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-brand-surface border border-brand-border py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Government / Officer Email ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-brand-card border border-brand-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-emerald"
                  placeholder="officer@coalindia.in"
                />
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Security Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-brand-card border border-brand-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-emerald"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-brand-emerald text-brand-bg font-bold text-xs hover:bg-emerald-400 transition-colors shadow-glow-emerald flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Enter Command Center'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Persona Selectors */}
          <div className="mt-6 pt-6 border-t border-brand-border">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider text-center mb-3">
              One-Click Role Authentication
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.slice(0, 4).map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickPersonaSelect(demo)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    email === demo.email
                      ? 'bg-brand-forest border-brand-emerald text-brand-emerald'
                      : 'bg-brand-card border-brand-border text-text-secondary hover:border-brand-border-light'
                  }`}
                >
                  <p className="text-xs font-bold text-text-primary truncate">{demo.name}</p>
                  <p className="text-[10px] text-text-muted truncate">{demo.role}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
