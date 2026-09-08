import api from './api';

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get('/api/dashboard/summary');
    return response.data;
  },
  getAttention: async () => {
    const response = await api.get('/api/dashboard/attention');
    const data = response.data?.cases || (Array.isArray(response.data) ? response.data : []);
    return data;
  },
  getKpis: async () => {
    const response = await api.get('/api/dashboard/kpis');
    return response.data;
  },
};
