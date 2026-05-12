import axios, { API_BASE_URL } from './config';

export const projectsApi = {
  createProject: async (topic: string, courseId?: string, groupNumber?: number) => {
    const res = await axios.post(`${API_BASE_URL}/project`, {
      topic,
      course_id: courseId || null,
      group_number: groupNumber ?? null
    });
    return res.data;
  },

  getProjects: async () => {
    const res = await axios.get(`${API_BASE_URL}/projects`);
    return res.data;
  },

  getProject: async (projectId: string) => {
    const res = await axios.get(`${API_BASE_URL}/project/${projectId}`);
    return res.data;
  },

  updateProject: async (projectId: string, updates: any) => {
    const res = await axios.patch(`${API_BASE_URL}/project/${projectId}`, updates);
    return res.data;
  },

  joinProjectByCode: async (code: string) => {
    const res = await axios.post(`${API_BASE_URL}/join/${code}`);
    return res.data;
  },

  deleteProject: async (projectId: string) => {
    const res = await axios.delete(`${API_BASE_URL}/project/${projectId}`);
    return res.data;
  },

  leaveProject: async (projectId: string) => {
    const res = await axios.delete(`${API_BASE_URL}/project/${projectId}/leave`);
    return res.data;
  },

  joinProject: async (projectId: string) => {
    const res = await axios.post(`${API_BASE_URL}/project/${projectId}/join`);
    return res.data;
  },

  // ── Project Files ─────────────────────────────────────
  getProjectFiles: async (projectId: string) => {
    const res = await axios.get(`${API_BASE_URL}/project/${projectId}/files`);
    return res.data;
  },

  uploadProjectFile: async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE_URL}/project/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  downloadProjectFile: (projectId: string, fileId: string) => {
    return `${API_BASE_URL}/project/${projectId}/files/${fileId}/download`;
  },

  deleteProjectFile: async (projectId: string, fileId: string) => {
    const res = await axios.delete(`${API_BASE_URL}/project/${projectId}/files/${fileId}`);
    return res.data;
  },

  // ── Project Activity ──────────────────────────────────
  getProjectActivity: async (projectId: string) => {
    const res = await axios.get(`${API_BASE_URL}/project/${projectId}/activity`);
    return res.data;
  },
};
