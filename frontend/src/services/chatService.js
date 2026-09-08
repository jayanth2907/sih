import api from './api';

export const chatService = {
  sendMessage: async (message, language = 'en') => {
    const response = await api.post('/api/v1/chat/query', { message, language });
    return response.data;
  },
};
