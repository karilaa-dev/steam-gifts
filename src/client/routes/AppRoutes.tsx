import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { LoginPage } from '../pages/LoginPage';
import { FriendsListPage } from '../pages/FriendsListPage';
import { FriendDetailPage } from '../pages/FriendDetailPage';

// Route guard component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner">🔄</div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/friends" 
        element={
          <ProtectedRoute>
            <FriendsListPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/friend/:steamId" 
        element={
          <ProtectedRoute>
            <FriendDetailPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirects */}
      <Route path="/" element={<Navigate to="/friends" replace />} />
      <Route path="*" element={<Navigate to="/friends" replace />} />
    </Routes>
  );
}