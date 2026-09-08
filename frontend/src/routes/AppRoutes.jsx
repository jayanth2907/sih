import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';

import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MinesPage } from '../pages/MinesPage';
import { MineDetailPage } from '../pages/MineDetailPage';
import { ViolationsPage } from '../pages/ViolationsPage';
import { ViolationDetailPage } from '../pages/ViolationDetailPage';
import { InspectionsPage } from '../pages/InspectionsPage';
import { CorrectiveActionsPage } from '../pages/CorrectiveActionsPage';
import { GISMapPage } from '../pages/GISMapPage';
import { MonitoringPage } from '../pages/MonitoringPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { AuditTrailPage } from '../pages/AuditTrailPage';
import { AIAssistantPage } from '../pages/AIAssistantPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// 1. Protected Route Guard: Redirects unauthenticated traffic to /login
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// 2. Public Only Route Guard: Redirects authenticated users from /login to /dashboard
const PublicOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root Route: Directly redirects to /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Application Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/mines" element={<MinesPage />} />
        <Route path="/mines/:id" element={<MineDetailPage />} />
        <Route path="/violations" element={<ViolationsPage />} />
        <Route path="/violations/:id" element={<ViolationDetailPage />} />
        <Route path="/inspections" element={<InspectionsPage />} />
        <Route path="/corrective-actions" element={<CorrectiveActionsPage />} />
        <Route path="/gis" element={<GISMapPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/audit" element={<AuditTrailPage />} />
        <Route path="/ai" element={<AIAssistantPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
