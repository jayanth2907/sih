import api from './api';

export const auditService = {
  getLogs: async (params = {}) => {
    const response = await api.get('/api/audit/logs', { params });
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/api/audit/summary');
    return response.data;
  },
  verifyLedger: async () => {
    const response = await api.get('/api/audit/verify');
    return response.data;
  },
  getEventDetail: async (eventId) => {
    const response = await api.get(`/api/audit/events/${eventId}`);
    return response.data;
  },
  exportCsvUrl: (category = 'ALL', search = '') => {
    const base = api.defaults.baseURL || 'http://localhost:8000';
    let url = `${base}/api/audit/export?category=${category}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return url;
  }
};

