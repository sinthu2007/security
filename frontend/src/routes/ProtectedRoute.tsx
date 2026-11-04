import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-navy-900 border border-cyan-500/30 flex items-center justify-center animate-pulse-glow">
          <Shield className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
        <p className="text-xs font-mono text-cyan-400">AUTHENTICATING SESSION...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
