import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { canAccess } from '../lib/auth';
import { PageSpinner } from './ui/Spinner';

export const ProtectedRoute = ({ 
  children, 
  requiredRole = 'agent',
  fallbackPath = '/login' 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (!canAccess(user, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
          <p className="text-lg text-gray-600 mb-8">Access Denied</p>
          <p className="text-gray-500">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
};
