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

  // Step 1 of signup: create the account and trigger the emailed code.
  const register = useCallback(async (payload) => {
    setError(null);
    try {
      await api.register(payload);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Step 2 of signup: confirm the code, which logs the new user in.
  const verify = useCallback(async (email, code) => {
    setError(null);
    try {
      const data = await api.verify(email, code);
      setToken(data.token);
      setUser(data.user);
      persistSession(data.token, data.user);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const resendCode = useCallback(async (email) => {
    setError(null);
    try {
      await api.resendCode(email);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ps_token');
    localStorage.removeItem('ps_user');
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, verify, resendCode, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
