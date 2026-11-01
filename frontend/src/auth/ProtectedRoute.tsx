import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading, error } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Checking your session...</div>;
  }
  if (error && !session) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }
  if (!session) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
