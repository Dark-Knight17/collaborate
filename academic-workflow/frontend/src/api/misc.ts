import axios, { API_BASE_URL } from './config';

export const miscApi = {
  generateDescription: async (description: string) => {
    const res = await axios.post(`${API_BASE_URL}/generate-description`, { description });
    return res.data;
  },

  getNotifications: async () => {
    const res = await axios.get(`${API_BASE_URL}/notifications`);
    return res.data;
  },

  markNotificationsRead: async () => {
    const res = await axios.post(`${API_BASE_URL}/notifications/mark-read`);
    return res.data;
  },

  getGlobalActivity: async () => {
    const res = await axios.get(`${API_BASE_URL}/activity`);
    return res.data;
  },
};
