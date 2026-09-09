import api from './api';

export const documentService = {
  getDocuments: async (params = {}) => {
    const response = await api.get('/api/documents', { params });
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/api/documents/summary');
    return response.data;
  },
  getDocument: async (docId) => {
    const response = await api.get(`/api/documents/${docId}`);
    return response.data;
  },
  uploadDocument: async (file, mineId = 3, documentType = 'PAPER_REGISTER_SCAN') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mine_id', mineId);
    formData.append('document_type', documentType);
    const response = await api.post('/api/documents/upload', formData);
    return response.data;
  },
  retryOcr: async (docId) => {
    const response = await api.post(`/api/documents/${docId}/retry`);
    return response.data;
  },
  verifyDocument: async (docId, payload) => {
    const response = await api.post(`/api/documents/${docId}/verify`, payload);
    return response.data;
  },
  createGovernanceRecord: async (docId, payload) => {
    const response = await api.post(`/api/documents/${docId}/governance-record`, payload);
    return response.data;
  }
};

