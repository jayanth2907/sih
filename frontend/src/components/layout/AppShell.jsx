import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { FloatingAICopilot } from '../ai/FloatingAICopilot';
import { Bot, Sparkles } from 'lucide-react';

export const AppShell = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Persistent Left Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Top Header */}
        <Topbar
          isCollapsed={isCollapsed}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onToggleAICopilot={() => setIsAICopilotOpen(true)}
        />

        {/* Page Outlet */}
        <main className="flex-1 pt-20 px-6 pb-6 max-w-[1700px] w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Persistent Floating AI Launcher Button */}
      <button
        onClick={() => setIsAICopilotOpen(true)}
        className="fixed bottom-6 left-72 z-40 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-forest border border-brand-emerald/50 text-brand-emerald text-xs font-bold shadow-glow-emerald hover:bg-brand-emerald hover:text-brand-bg transition-all group"
      >
        <Sparkles className="w-3.5 h-3.5 text-brand-teal group-hover:text-brand-bg transition-colors" />
        <span>AI Safety Copilot</span>
      </button>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Notification Center Drawer */}
      <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

      {/* Floating AI Copilot Slide-over */}
      <FloatingAICopilot isOpen={isAICopilotOpen} onClose={() => setIsAICopilotOpen(false)} />
    </div>
  );
};
