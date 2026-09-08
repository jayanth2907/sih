import api from './api';

export const mineService = {
  getMines: async () => {
    const response = await api.get('/api/mines');
    const data = Array.isArray(response.data) ? response.data : (response.data?.mines || []);
    return data;
  },
  getMineById: async (id) => {
    const response = await api.get(`/api/mines/${id}`);
    return response.data;
  },
  getMineRisk: async (id) => {
    const response = await api.get(`/api/mines/${id}`);
    return response.data;
  },
};
