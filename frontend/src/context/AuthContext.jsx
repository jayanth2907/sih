import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { DEMO_USERS } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('khandrishti_user');
    return saved ? JSON.parse(saved) : DEMO_USERS[0]; // Default to Jayanth Varma (Corporate) for rich demo
  });
  const [token, setToken] = useState(() => localStorage.getItem('khandrishti_token') || 'demo_token');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('khandrishti_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('khandrishti_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('khandrishti_token', token);
    } else {
      localStorage.removeItem('khandrishti_token');
    }
  }, [token]);

  const login = async (email, password = 'demo') => {
    setLoading(true);
    try {
      // Find matching demo user details if available
      const matchingDemo = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      const data = await authService.login(email, password);
      setToken(data.access_token);
      
      const userData = {
        name: matchingDemo?.name || email.split('@')[0].toUpperCase(),
        email: email,
        role: data.role,
        scope: data.scope,
        designation: matchingDemo?.designation || `${data.role} Officer`,
        subsidiary: matchingDemo?.subsidiary || (data.scope?.subsidiary || 'Coal India'),
        avatar: matchingDemo?.avatar || email.substring(0, 2).toUpperCase(),
      };
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      // Graceful fallback for offline demo
      const fallbackUser = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || DEMO_USERS[0];
      setUser(fallbackUser);
      setToken('demo_token');
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const switchUser = (selectedUser) => {
    setUser(selectedUser);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
