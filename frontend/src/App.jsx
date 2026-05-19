import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import LandingPage from './pages/public/LandingPage';

// Dashboard
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CallsPage } from './pages/calls/CallsPage';
import { CallDetailPage } from './pages/calls/CallDetailPage';
import { AgentsPage } from './pages/users/AgentsPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import queryClient from './lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Redirect /app to /app/dashboard */}
              <Route index element={<Navigate to="/app/dashboard" replace />} />

              {/* Dashboard */}
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="calls" element={<CallsPage />} />
              <Route path="calls/:id" element={<CallDetailPage />} />
              <Route path="agents" element={<ProtectedRoute requiredRole="manager"><AgentsPage /></ProtectedRoute>} />
              <Route path="analytics" element={<ProtectedRoute requiredRole="manager"><AnalyticsPage /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute requiredRole="manager"><ReportsPage /></ProtectedRoute>} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
