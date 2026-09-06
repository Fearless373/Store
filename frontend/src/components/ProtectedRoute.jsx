import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Any authenticated user can access any route now — there's no manager/cashier
// account distinction. Manager-only pages are additionally wrapped in
// <PasscodeGate> at the route level (see App.jsx).
export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
