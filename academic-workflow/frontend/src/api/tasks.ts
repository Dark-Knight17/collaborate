import axios, { API_BASE_URL } from './config';

export const tasksApi = {
  getTasks: async () => {
    const res = await axios.get(`${API_BASE_URL}/tasks`);
    return res.data;
  },

  generateTasks: async (projectId: string, topic: string, context: string = '') => {
    const res = await axios.post(`${API_BASE_URL}/project/${projectId}/generate-tasks`, { topic, context });
    return res.data;
  },

  breakDownTask: async (taskId: string) => {
    const res = await axios.post(`${API_BASE_URL}/tasks/${taskId}/breakdown`);
    return res.data;
  },

  claimTask: async (taskId: string) => {
    const res = await axios.post(`${API_BASE_URL}/tasks/${taskId}/claim`);
    return res.data;
  },

  dropTask: async (taskId: string) => {
    const res = await axios.post(`${API_BASE_URL}/tasks/${taskId}/drop`);
    return res.data;
  },

  updateTask: async (taskId: string, updates: any) => {
    const res = await axios.patch(`${API_BASE_URL}/tasks/${taskId}`, updates);
    return res.data;
  },

  deleteTask: async (taskId: string) => {
    const res = await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
    return res.data;
  },

  deleteAllProjectTasks: async (projectId: string) => {
    const res = await axios.delete(`${API_BASE_URL}/project/${projectId}/tasks`);
    return res.data;
  },

  submitTask: async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE_URL}/tasks/${taskId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  createTask: async (projectId: string, taskData: any) => {
    const res = await axios.post(`${API_BASE_URL}/project/${projectId}/tasks`, taskData);
    return res.data;
  },
};
