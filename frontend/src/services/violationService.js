import api from './api';

export const violationService = {
  getViolations: async (params = {}) => {
    const response = await api.get('/api/violations', { params });
    const data = Array.isArray(response.data) ? response.data : (response.data?.violations || []);
    return data;
  },
  getViolationById: async (id) => {
    const response = await api.get('/api/violations');
    const list = Array.isArray(response.data) ? response.data : (response.data?.violations || []);
    const item = list.find((v) => String(v.id) === String(id));
    return item || null;
  },
  resolveViolation: async (id, notes, userName, userRole) => {
    const response = await api.post(`/api/violations/${id}/resolve`, null, {
      params: { notes, user_name: userName, user_role: userRole }
    });
    return response.data;
  },
  updateStatus: async (id, status) => {
    return await violationService.transitionStatus(id, status);
  },
  transitionStatus: async (id, targetState, notes = "") => {
    const response = await api.patch(`/api/violations/${id}/status`, {
      target_state: targetState,
      notes: notes
    });
    return response.data;
  },
  getCorrectiveActions: async (violationId = null) => {
    const url = violationId
      ? `/api/violations/${violationId}/corrective-actions`
      : `/api/violations/corrective-actions`;
    const response = await api.get(url);
    return response.data;
  }
};
