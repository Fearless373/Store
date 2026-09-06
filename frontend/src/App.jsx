import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PasscodeGate from './components/PasscodeGate';
import Layout from './components/Layout';
import Login from './pages/login';
import SignUp from './pages/SignUp';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Categories from './pages/Categories';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/pos" replace /> : <Login />} />
      <Route path="/signup" element={token ? <Navigate to="/pos" replace /> : <SignUp />} />

      <Route path="/pos" element={
        <ProtectedRoute><Layout><POS /></Layout></ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute><Layout><PasscodeGate><Inventory /></PasscodeGate></Layout></ProtectedRoute>
      } />
      <Route path="/categories" element={
        <ProtectedRoute><Layout><PasscodeGate><Categories /></PasscodeGate></Layout></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><PasscodeGate><Dashboard /></PasscodeGate></Layout></ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute><Layout><PasscodeGate><Transactions /></PasscodeGate></Layout></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={token ? '/pos' : '/login'} replace />} />
    </Routes>
  );
}
