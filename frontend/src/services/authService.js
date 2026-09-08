import api from './api';

export const authService = {
  login: async (identifier, password = 'demo') => {
    const response = await api.post('/api/auth/login', {
      username: identifier,
      email: identifier.includes('@') ? identifier : undefined,
      password: password
    });
    return response.data;
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('khandrishti_user');
    return user ? JSON.parse(user) : null;
  },
  getToken: () => {
    return localStorage.getItem('khandrishti_token');
  },
  logout: () => {
    localStorage.removeItem('khandrishti_token');
    localStorage.removeItem('khandrishti_user');
  }
};
