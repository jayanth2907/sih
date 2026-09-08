import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-status-critical/15 border border-status-critical/30 flex items-center justify-center text-status-critical shadow-glow-critical mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary">403 - Statutory Access Restricted</h1>
      <p className="text-xs text-text-secondary max-w-md mt-2 mb-6">
        "You don't have permission to perform this action or view this subsidiary jurisdiction under current DGMS role mandates."
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-emerald text-brand-bg font-bold text-xs hover:bg-emerald-400 transition-colors shadow-glow-emerald"
      >
        <Home className="w-4 h-4" />
        <span>Return to Command Center</span>
      </button>
    </div>
  );
};

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-emerald shadow-sm mb-4">
        <span className="font-mono text-2xl font-extrabold">404</span>
      </div>
      <h1 className="text-2xl font-bold text-text-primary">Resource Not Found</h1>
      <p className="text-xs text-text-secondary max-w-md mt-2 mb-6">
        The requested mine profile, violation case, or compliance ledger record does not exist in the active registry.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-emerald text-brand-bg font-bold text-xs hover:bg-emerald-400 transition-colors shadow-glow-emerald"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>
    </div>
  );
};
