import api from './api';

export const demoService = {
  resetDemo: async () => {
    const response = await api.post('/api/v1/demo/reset');
    return response.data;
  },
  setupDrift: async () => {
    const response = await api.post('/api/v1/demo/setup-drift');
    return response.data;
  }
};
