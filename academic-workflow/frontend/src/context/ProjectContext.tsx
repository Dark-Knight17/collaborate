import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import type { Project, Task, Course, CourseGroup, Announcement, TaskStatus } from '../appTypes';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  tasks: Task[];
  courses: Course[];
  announcements: Announcement[];
  courseGroups: CourseGroup[];
  globalActivity: any[];
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  joinProject: (projectId: string) => Promise<void>;
  leaveProject: (projectId: string) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTaskAssignees: (taskId: string, assignees: string[]) => void;
  deleteTask: (taskId: string) => void;
  claimTask: (taskId: string) => void;
  breakDownTask: (taskId: string) => Promise<void>;
  createCourse: (data: { title: string; course_code: string; description?: string }) => Promise<Course>;
  updateCourse: (courseId: string, updates: any) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  joinCourse: (joinCode: string) => Promise<Course>;
  refreshCourses: () => Promise<void>;
  fetchCourseGroups: (courseId: string) => Promise<CourseGroup[]>;
  fetchCourseAnnouncements: (courseId: string) => Promise<Announcement[]>;
  createAnnouncement: (courseId: string, data: any, file?: File) => Promise<void>;
  deleteAnnouncement: (courseId: string, annId: string) => Promise<void>;
  uploadAnnouncementFile: (courseId: string, annId: string, file: File) => Promise<void>;
  joinCourseGroup: (courseId: string, groupId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [globalActivity, setGlobalActivity] = useState<any[]>([]);

  const fetchData = async () => {
    if (!user) return;
    try {
      if (user.role === 'lecturer') {
        const [courseData, actData] = await Promise.all([
          api.getLecturerCourses(),
          api.getGlobalActivity().catch(() => null)
        ]);
        if (courseData?.courses) setCourses(courseData.courses);
        if (actData?.activity) setGlobalActivity(actData.activity);
      } else {
        const [projData, taskData, courseData, actData] = await Promise.all([
          api.getProjects(),
          api.getTasks(),
          api.getStudentCourses().catch(() => null),
          api.getGlobalActivity().catch(() => null)
        ]);
        if (projData?.projects) setProjects(projData.projects);
        if (taskData?.tasks) setTasks(taskData.tasks);
        if (courseData?.courses) setCourses(courseData.courses);
        if (actData?.activity) setGlobalActivity(actData.activity);
      }
    } catch (err) {
      console.error('Failed to sync data', err);
    }
  };

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setTasks([]);
      setCourses([]);
      setAnnouncements([]);
      setCourseGroups([]);
      setGlobalActivity([]);
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const addProject = (project: Project) => {
    setProjects(prev => prev.find(p => p.id === project.id) ? prev : [project, ...prev]);
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    api.updateProject(projectId, updates).catch(console.error);
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    api.deleteProject(projectId).catch(console.error);
  };

  const joinProject = async (projectId: string) => {
    if (!user) return;
    const res = await api.joinProject(projectId);
    if (res.success) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, members: [...p.members, user.name] } : p));
    }
  };

  const leaveProject = async (projectId: string) => {
    await api.leaveProject(projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const addTask = async (task: Task) => {
    const tempId = task.id || `temp-${Date.now()}`;
    const newTask = { ...task, id: tempId };
    setTasks(prev => [newTask, ...prev]);
    
    try {
      const res = await api.createTask(task.projectId, {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        assignees: task.assignees
      });
      if (res.success && res.id) {
        setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: res.id } : t));
      }
    } catch (err) {
      console.error('Failed to sync task creation', err);
    }
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    api.updateTask(taskId, updates).catch(console.error);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, { status });
  };

  const updateTaskAssignees = (taskId: string, assignees: string[]) => {
    updateTask(taskId, { assignees });
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    api.deleteTask(taskId).catch(console.error);
  };

  const claimTask = (taskId: string) => {
    if (!user) return;
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'in_progress' as TaskStatus, assignees: Array.from(new Set([...t.assignees, user.name])) } : t
    ));
    api.claimTask(taskId).catch(console.error);
  };

  const breakDownTask = async (taskId: string) => {
    const res = await api.breakDownTask(taskId);
    if (res?.tasks) {
      setTasks(prev => [...res.tasks, ...prev.filter(t => t.id !== taskId)]);
    }
  };

  const createCourse = async (data: { title: string; course_code: string; description?: string }) => {
    const res = await api.createCourse(data);
    setCourses(prev => [res.course, ...prev]);
    return res.course;
  };

  const updateCourse = async (courseId: string, updates: any) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...updates } : c));
  };

  const deleteCourse = async (courseId: string) => {
    await api.deleteCourse(courseId);
    setCourses(prev => prev.filter(c => c.id !== courseId));
  };

  const joinCourse = async (joinCode: string) => {
    const res = await api.joinCourseByCode(joinCode);
    setCourses(prev => prev.find(c => c.id === res.course.id) ? prev : [res.course, ...prev]);
    return res.course;
  };

  const refreshCourses = async () => {
    if (!user) return;
    const res = user.role === 'lecturer' ? await api.getLecturerCourses() : await api.getStudentCourses();
    if (res?.courses) setCourses(res.courses);
  };

  const fetchCourseGroups = async (courseId: string) => {
    const res = await api.getCourseGroups(courseId);
    const groups = res.groups || [];
    setCourseGroups(prev => [...prev.filter(g => g.courseId !== courseId), ...groups]);
    return groups;
  };

  const fetchCourseAnnouncements = async (courseId: string) => {
    const res = await api.getCourseAnnouncements(courseId);
    const anns = res.announcements || [];
    setAnnouncements(prev => [...prev.filter(a => a.courseId !== courseId), ...anns]);
    return anns;
  };

  const createAnnouncement = async (courseId: string, data: any, file?: File) => {
    const res = await api.createAnnouncement(courseId, data);
    if (file && res.announcement) await api.uploadAnnouncementFile(courseId, res.announcement.id, file);
    fetchCourseAnnouncements(courseId);
  };

  const deleteAnnouncement = async (courseId: string, annId: string) => {
    await api.deleteAnnouncement(courseId, annId);
    setAnnouncements(prev => prev.filter(a => a.id !== annId));
  };

  const uploadAnnouncementFile = async (courseId: string, annId: string, file: File) => {
    await api.uploadAnnouncementFile(courseId, annId, file);
    fetchCourseAnnouncements(courseId);
  };

  const joinCourseGroup = async (courseId: string, groupId: string) => {
    await api.joinCourseGroup(courseId, groupId);
    fetchCourseAnnouncements(courseId);
  };

  return (
    <ProjectContext.Provider value={{
      projects, tasks, courses, announcements, courseGroups, globalActivity,
      addProject, updateProject, deleteProject, joinProject, leaveProject,
      addTask, updateTask, updateTaskStatus, updateTaskAssignees, deleteTask, claimTask, breakDownTask,
      createCourse, updateCourse, deleteCourse, joinCourse, refreshCourses,
      fetchCourseGroups, fetchCourseAnnouncements, createAnnouncement, deleteAnnouncement, uploadAnnouncementFile, joinCourseGroup
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
