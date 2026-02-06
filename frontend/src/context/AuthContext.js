import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await axios.get('http://localhost:5000/api/users/profile');
      setUser(res.data);
      setError(null);
    } catch (err) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setError(err.response?.data?.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const res = await axios.post('http://localhost:5000/api/users', userData);
      const { token, ...userInfo } = res.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userInfo);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const res = await axios.post('http://localhost:5000/api/users/login', {
        email,
        password,
      });
      const { token, ...userInfo } = res.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userInfo);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

