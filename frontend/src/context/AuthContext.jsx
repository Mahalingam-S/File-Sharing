import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Axios instance with base URL using relative path for proxy
  const api = axios.create({
    baseURL: '/api',
  });

  // Attach token to requests
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Authentication failed:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
  };

  const googleAuth = async (credential, role, department, providedName, rollNo) => {
    const res = await api.post('/auth/google', { credential, role, department, providedName, rollNo });
    
    if (res.status === 202) {
      return res.data;
    }
    
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
    return { success: true };
  };

  const register = async (name, email, password, role, department, rollNo) => {
    const res = await api.post('/auth/register', { name, email, password, role, department, rollNo });
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleAuth, logout, api, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
