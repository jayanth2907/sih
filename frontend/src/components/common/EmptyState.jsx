import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = "No data found",
  description = "There are no records matching your current filter criteria.",
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-brand-border rounded-2xl bg-brand-surface/40">
      <div className="w-12 h-12 rounded-full bg-brand-forest flex items-center justify-center text-brand-emerald mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-text-primary mb-1">{title}</h4>
      <p className="text-sm text-text-secondary max-w-sm mb-5">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-emerald text-brand-bg hover:bg-emerald-400 transition-colors shadow-md"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
