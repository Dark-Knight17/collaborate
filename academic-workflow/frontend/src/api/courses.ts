import axios, { API_BASE_URL } from './config';

export const coursesApi = {
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

  // ── Course Group → Project Resolution (Lecturer) ──────
  getGroupProject: async (courseId: string, groupNumber: number) => {
    const res = await axios.get(`${API_BASE_URL}/courses/${courseId}/groups/${groupNumber}/project`);
    return res.data as { projectId: string };
  },
};
