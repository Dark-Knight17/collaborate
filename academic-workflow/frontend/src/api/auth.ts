import axios, { API_BASE_URL } from './config';

export const authApi = {
  login: async (formData: any) => {
    const params = new URLSearchParams();
    params.append('username', formData.email);
    params.append('password', formData.password);

    const res = await axios.post(`${API_BASE_URL}/login`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data;
  },

  register: async (data: any) => {
    const res = await axios.post(`${API_BASE_URL}/register`, data);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await axios.post(`${API_BASE_URL}/forgot-password`, { email });
    return res.data as { message: string; reset_token: string | null; found: boolean };
  },

  resetPassword: async (token: string, new_password: string) => {
    const res = await axios.post(`${API_BASE_URL}/reset-password`, { token, new_password });
    return res.data as { success: boolean; message: string };
  },

  getMe: async () => {
    const res = await axios.get(`${API_BASE_URL}/me`);
    return res.data;
  },

  updateProfile: async (updates: { name?: string; email?: string }) => {
    const res = await axios.patch(`${API_BASE_URL}/me`, updates);
    return res.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE_URL}/me/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
};
