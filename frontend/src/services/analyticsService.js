import api from './api';

export const analyticsService = {
  getOverview: async (range = '30d', subsidiary = 'ALL', mineId = null) => {
    const params = { range: range.toLowerCase() };
    if (subsidiary && subsidiary !== 'ALL') {
      params.subsidiary = subsidiary;
    }
    if (mineId) {
      params.mine_id = mineId;
    }
    const response = await api.get('/api/analytics/overview', { params });
    return response.data;
  },
  exportCsvUrl: (range = '30d', subsidiary = 'ALL', mineId = null) => {
    const base = api.defaults.baseURL || 'http://localhost:8000';
    let url = `${base}/api/analytics/export?range=${range.toLowerCase()}`;
    if (subsidiary && subsidiary !== 'ALL') {
      url += `&subsidiary=${subsidiary}`;
    }
    if (mineId) {
      url += `&mine_id=${mineId}`;
    }
    return url;
  }
};
