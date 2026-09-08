import React from 'react';
import { APP_NAME } from '../../utils/constants';

export const Footer = () => {
  return (
    <footer className="mt-12 py-4 px-6 border-t border-brand-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted gap-2">
      <div className="flex items-center gap-3">
        {/* National Emblem Geometric Symbol */}
        <div className="w-5 h-5 rounded border border-brand-emerald/40 bg-brand-forest/60 flex items-center justify-center text-[10px] font-bold text-brand-emerald">
          🇮🇳
        </div>
        <span className="font-semibold text-text-secondary">{APP_NAME}</span>
        <span>•</span>
        <span>Ministry of Coal</span>
        <span>•</span>
        <span>Government of India</span>
      </div>

      <div className="flex items-center gap-2">
        <span>Data for safer mines. Intelligence for a stronger India.</span>
        <span>🇮🇳</span>
      </div>
    </footer>
  );
};
