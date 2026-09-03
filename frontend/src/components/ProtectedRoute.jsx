import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap a route with roles={['manager']} to restrict it; omit roles to just require login.
export default function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuth();

  if (!token) return <Navigate to="/signup" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/pos" replace />;

  return children;
}
