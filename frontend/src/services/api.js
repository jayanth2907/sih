import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('khandrishti_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Remove default application/json header for FormData uploads
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid redirect loops on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('khandrishti_token');
        localStorage.removeItem('khandrishti_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
