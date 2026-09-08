import api from './api';

export const monitoringService = {
  getAnomalies: async () => {
    const response = await api.get('/api/monitor/anomalies');
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/api/monitor/summary');
    return response.data;
  },
  getSignals: async () => {
    const response = await api.get('/api/monitor/signals');
    return response.data;
  },
  reviewSignal: async (signalId, reviewData) => {
    const response = await api.post(`/api/monitor/signals/${signalId}/review`, reviewData);
    return response.data;
  },
  recalculate: async () => {
    const response = await api.post('/api/monitor/recalculate');
    return response.data;
  },
  getIntegrationsStatus: async () => {
    try {
      const response = await api.get('/api/v1/integrations/status');
      return response.data;
    } catch {
      return [];
    }
  }
};

