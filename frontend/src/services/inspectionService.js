import api from './api';

export const inspectionService = {
  getInspections: async (mineId = null) => {
    const params = mineId ? { mine_id: mineId } : {};
    const response = await api.get('/api/v1/inspections', { params });
    const data = Array.isArray(response.data) ? response.data : (response.data?.inspections || []);
    return data;
  },
  getInspectionById: async (id) => {
    const response = await api.get('/api/v1/inspections');
    const list = Array.isArray(response.data) ? response.data : (response.data?.inspections || []);
    return list.find(i => String(i.id) === String(id)) || null;
  },
  createInspection: async (payload, inspectorId = 1) => {
    const response = await api.post('/api/inspections', payload, {
      params: { inspector_id: inspectorId }
    });
    return response.data;
  },
  getRegulations: async () => {
    const response = await api.get('/api/inspections/regulations');
    return response.data;
  },
  syncInspections: async (inspections) => {
    const response = await api.post('/api/inspections/sync', { inspections });
    return response.data;
  },
};
