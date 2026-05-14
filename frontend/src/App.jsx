import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import LandingPage from './pages/public/LandingPage';

// Dashboard
import { DashboardPage } from './pages/dashboard/DashboardPage';

// Calls
import { CallsPage } from './pages/calls/CallsPage';
import { CallDetailPage } from './pages/calls/CallDetailPage';

// Reports
import { ReportsPage } from './pages/reports/ReportsPage';

// Users
import { UsersPage } from './pages/users/UsersPage';
import { AgentsPage } from './pages/users/AgentsPage';

// Reviews
import { QAReviewsPage } from './pages/reviews/QAReviewsPage';

// Settings
import { ScoringConfigPage } from './pages/settings/ScoringConfigPage';

// Query Client
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
            <Route path="/app" element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }>
              {/* Redirect /app to /app/dashboard */}
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              
              {/* Dashboard */}
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Calls */}
              <Route path="calls" element={<CallsPage />} />
              <Route path="calls/:id" element={<CallDetailPage />} />

              {/* Reports */}
              <Route path="reports" element={
                <ProtectedRoute requiredRole="manager">
                  <ReportsPage />
                </ProtectedRoute>
              } />

              {/* Users */}
              <Route path="users" element={
                <ProtectedRoute requiredRole="admin">
                  <UsersPage />
                </ProtectedRoute>
              } />
              
              <Route path="agents" element={
                <ProtectedRoute requiredRole="manager">
                  <AgentsPage />
                </ProtectedRoute>
              } />

              {/* Reviews */}
              <Route path="reviews" element={
                <ProtectedRoute requiredRole="qa_supervisor">
                  <QAReviewsPage />
                </ProtectedRoute>
              } />

              {/* Settings */}
              <Route path="settings/scoring" element={
                <ProtectedRoute requiredRole="admin">
                  <ScoringConfigPage />
                </ProtectedRoute>
              } />
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
