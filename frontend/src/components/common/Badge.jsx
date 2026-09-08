import React from 'react';
import clsx from 'clsx';

export const Badge = ({ children, variant = 'default', size = 'md', className }) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full border transition-colors";
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const variantClasses = {
    default: "bg-brand-surface text-text-secondary border-brand-border",
    emerald: "bg-brand-emerald/15 text-brand-emerald border-brand-emerald/30",
    teal: "bg-brand-teal/15 text-brand-teal border-brand-teal/30",
    critical: "bg-status-critical/15 text-status-critical border-status-critical/40",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/40",
    success: "bg-status-success/15 text-status-success border-status-success/40",
    info: "bg-sky-500/15 text-sky-400 border-sky-500/40",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/40",
  };

  return (
    <span className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}>
      {children}
    </span>
  );
};
