import React, { createContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import axiosInstance from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getToken();
      const storedUser = await storage.getUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (e) {
      console.error('Failed to load stored auth state', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      const { token: userToken, user: userData } = res.data;
      
      await storage.setToken(userToken);
      await storage.setUser(userData);
      
      setToken(userToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Check credentials.';
      return { success: false, error: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await axiosInstance.post('/auth/register', formData);
      return { success: true, data: res.data };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await storage.clearAll();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAdmin:
          user?.role?.toLowerCase() === 'admin' ||
          user?.role?.toLowerCase() === 'superadmin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
