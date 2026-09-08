import api from './api';

export const riskService = {
  explainViolation: async (violationId) => {
    const response = await api.get(`/api/risk/${violationId}/explanation`);
    return response.data;
  },
  getModelMetadata: async () => {
    const response = await api.get('/api/risk/model-metadata');
    return response.data;
  },
  calculateRisk: async (violationId) => {
    const response = await api.get(`/api/risk/${violationId}/explanation`);
    return response.data;
  }
};
