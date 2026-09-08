import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
    icon: "p-2 text-sm",
  };

  const variantClasses = {
    primary: "bg-brand-emerald text-brand-bg font-semibold hover:bg-emerald-400 focus:ring-brand-emerald shadow-lg shadow-brand-emerald/20",
    secondary: "bg-brand-surface text-text-primary border border-brand-border hover:border-brand-border-light hover:bg-brand-card focus:ring-brand-teal",
    teal: "bg-brand-teal text-brand-bg font-semibold hover:bg-teal-400 focus:ring-brand-teal",
    danger: "bg-status-critical text-white font-semibold hover:bg-rose-600 focus:ring-status-critical",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-brand-surface focus:ring-brand-border",
    outline: "border border-brand-emerald/40 text-brand-emerald hover:bg-brand-emerald/10 focus:ring-brand-emerald",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
};
