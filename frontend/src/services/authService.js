import api from './api';

export const authService = {
  login: async (email, password = 'demo') => {
    const response = await api.post('/api/auth/login', {
      username: email.split('@')[0],
      role: email.includes('officer') ? 'MINE_OFFICER' : email.includes('regulator') ? 'REGULATOR' : 'CORPORATE',
      password
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
