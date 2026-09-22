/**
 * File: client/src/context/AuthContext.jsx
 * Description:
 *   React Authentication Context & Session Provider.
 *   - Manages JWT tokens, user profile state, and localStorage session persistence.
 *   - Exposes login, signup, logout functions, and authenticated HTTP header helper.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = 'http://127.0.0.1:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('seat_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('seat_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('seat_user', JSON.stringify(data.user));
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (err) {
          console.error('Failed to verify token:', err);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Login failed');
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('seat_token', data.token);
    localStorage.setItem('seat_user', JSON.stringify(data.user));
    return data.user;
  };

  const signup = async (name, email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Signup failed');
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('seat_token', data.token);
    localStorage.setItem('seat_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('seat_token');
    localStorage.removeItem('seat_user');
  };

  const authHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, authHeaders, API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
