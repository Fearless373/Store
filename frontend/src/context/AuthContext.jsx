import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

function persistSession(token, user) {
  localStorage.setItem('ps_token', token);
  localStorage.setItem('ps_user', JSON.stringify(user));
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ps_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ps_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const data = await api.login(email, password);
      setToken(data.token);
      setUser(data.user);
      persistSession(data.token, data.user);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Creates the account and logs the user straight in — no email verification step.
  const register = useCallback(async (payload) => {
    setError(null);
    try {
      const data = await api.register(payload);
      setToken(data.token);
      setUser(data.user);
      persistSession(data.token, data.user);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const changePassword = useCallback(async (payload) => {
    setError(null);
    try {
      await api.changePassword(token, payload);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [token]);

  const deleteAccount = useCallback(async (password) => {
    setError(null);
    try {
      await api.deleteAccount(token, password);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [token]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ps_token');
    localStorage.removeItem('ps_user');
    sessionStorage.removeItem('ps_manager_unlocked');
  }, []);

  return (
    <AuthContext.Provider value={{
      token, user, login, register, changePassword, deleteAccount, logout, error, setError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
