import axios from 'axios';

// Production (Vercel): set VITE_API_URL in the Vercel dashboard to your Railway/Render backend URL.
// e.g. https://collaborate-backend.railway.app/api
// Development: falls back to localhost:8000 automatically.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';


// Add JWT Token to all outbound requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
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

  getTasks: async () => {
    const res = await axios.get(`${API_BASE_URL}/tasks`);
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

  generateTasks: async (projectId: string, topic: string, context: string = '') => {
    const res = await axios.post(`${API_BASE_URL}/project/${projectId}/generate-tasks`, { topic, context });
    return res.data;
  },

  generateDescription: async (description: string) => {
    const res = await axios.post(`${API_BASE_URL}/generate-description`, { description });
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

  getNotifications: async () => {
    const res = await axios.get(`${API_BASE_URL}/notifications`);
    return res.data;
  },

  markNotificationsRead: async () => {
    const res = await axios.post(`${API_BASE_URL}/notifications/mark-read`);
    return res.data;
  },

  // ── Lecturer / Course APIs ────────────────────────────
  createCourse: async (data: { title: string; course_code: string; description?: string }) => {
    const res = await axios.post(`${API_BASE_URL}/lecturer/courses`, data);
    return res.data;
  },

  getLecturerCourses: async () => {
    const res = await axios.get(`${API_BASE_URL}/lecturer/courses`);
    return res.data;
  },

  getStudentCourses: async () => {
    const res = await axios.get(`${API_BASE_URL}/courses`);
    return res.data;
  },

  getCourse: async (courseId: string) => {
    const res = await axios.get(`${API_BASE_URL}/courses/${courseId}`);
    return res.data;
  },

  joinCourseByCode: async (code: string) => {
    const res = await axios.post(`${API_BASE_URL}/courses/join/${code}`);
    return res.data;
  },

  updateCourse: async (courseId: string, data: any) => {
    const res = await axios.patch(`${API_BASE_URL}/lecturer/courses/${courseId}`, data);
    return res.data;
  },

  deleteCourse: async (courseId: string) => {
    const res = await axios.delete(`${API_BASE_URL}/lecturer/courses/${courseId}`);
    return res.data;
  },

  // ── Course Groups ────────────────────────────────────
  getCourseGroups: async (courseId: string) => {
    const res = await axios.get(`${API_BASE_URL}/courses/${courseId}/groups`);
    return res.data;
  },

  createCourseGroup: async (courseId: string, data: { group_number: number; member_names: string[] }) => {
    const res = await axios.post(`${API_BASE_URL}/courses/${courseId}/groups`, data);
    return res.data;
  },

  deleteCourseGroup: async (courseId: string, groupId: string) => {
    const res = await axios.delete(`${API_BASE_URL}/courses/${courseId}/groups/${groupId}`);
    return res.data;
  },

  joinCourseGroup: async (courseId: string, groupId: string) => {
    const res = await axios.put(`${API_BASE_URL}/courses/${courseId}/groups/${groupId}/join`);
    return res.data;
  },

  // ── Announcements ─────────────────────────────────────
  getCourseAnnouncements: async (courseId: string) => {
    const res = await axios.get(`${API_BASE_URL}/courses/${courseId}/announcements`);
    return res.data;
  },

  createAnnouncement: async (courseId: string, data: {
    title: string; body: string;
    has_group_assignment?: boolean;
    groups?: { group_number: number; member_names: string[] }[];
  }) => {
    const res = await axios.post(`${API_BASE_URL}/courses/${courseId}/announcements`, data);
    return res.data;
  },

  deleteAnnouncement: async (courseId: string, annId: string) => {
    const res = await axios.delete(`${API_BASE_URL}/courses/${courseId}/announcements/${annId}`);
    return res.data;
  },

  uploadAnnouncementFile: async (courseId: string, annId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE_URL}/courses/${courseId}/announcements/${annId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  downloadProjectFile: (projectId: string, fileId: string) => {
    const url = `${API_BASE_URL}/project/${projectId}/files/${fileId}/download`;
    // Auth is added globally via the axios interceptor
    return url;
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

  getGlobalActivity: async () => {
    const res = await axios.get(`${API_BASE_URL}/activity`);
    return res.data;
  },

  // ── Course Group → Project Resolution (Lecturer) ──────
  getGroupProject: async (courseId: string, groupNumber: number) => {
    const res = await axios.get(`${API_BASE_URL}/courses/${courseId}/groups/${groupNumber}/project`);
    return res.data as { projectId: string };
  },
};

