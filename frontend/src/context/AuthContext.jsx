import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { DEMO_USERS } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('khandrishti_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('khandrishti_token') || null);
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

  const login = async (identifier, password = 'demo') => {
    setLoading(true);
    try {
      const data = await authService.login(identifier, password);
      setToken(data.access_token);
      
      const backendUser = data.user;
      const matchingDemo = DEMO_USERS.find(
        u => u.email.toLowerCase() === (backendUser.email || '').toLowerCase() ||
             u.role.toLowerCase() === (backendUser.role || '').toLowerCase()
      );
      
      const userData = {
        id: backendUser.id,
        name: backendUser.name,
        username: backendUser.username,
        email: backendUser.email,
        role: backendUser.role,
        mine_id: backendUser.mine_id,
        mine_name: backendUser.mine_name,
        subsidiary: backendUser.subsidiary,
        permissions: backendUser.permissions || [],
        designation: matchingDemo?.designation || `${backendUser.role} Authority`,
        avatar: backendUser.name
          ? backendUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
          : backendUser.role.substring(0, 2)
      };
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const switchUser = async (selectedUser) => {
    try {
      await login(selectedUser.email || selectedUser.role.toLowerCase(), 'demo');
    } catch (err) {
      setUser(selectedUser);
    }
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
