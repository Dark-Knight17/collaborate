import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { api } from '../api';

// --- Types ---
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type UserRole = 'student' | 'lecturer';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  assignees: string[];
  hasSubmittedFile?: boolean;
  submittedFileName?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  courseCode?: string;
  members: string[];
  dueDate: string;
  progress: number;
  admins: string[];
  aiTrackingEnabled?: boolean;
  minGrade?: number;
  joinCode?: string;
  courseId?: string;
  groupNumber?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  }
}

export interface Message {
  id: string;
  projectId?: string;
  dmChatId?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  mentions?: { type: 'user' | 'task'; id: string; label: string }[];
  replyToId?: string;
  isPinned?: boolean;
  isEdited?: boolean;
}

export interface Notification {
  id: string;
  type: 'status_change' | 'new_message' | 'deadline' | 'system' | 'risk';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  projectId?: string;
  taskId?: string;
  relatedUser?: string; // name or ID of the person who triggered it
}

export interface Course {
  id: string;
  title: string;
  courseCode: string;
  description: string;
  lecturerId: string;
  lecturerName: string;
  joinCode: string;
  studentCount: number;
  students: { id: string; name: string; email: string }[];
  groupCount: number;
}

export interface CourseGroup {
  id: string;
  courseId: string;
  groupNumber: number;
  memberNames: string[];
  createdBy: string;
  projectId?: string;
  progress?: number;
  dueDate?: string;
  memberCount?: number;
}

export interface Announcement {
  id: string;
  courseId: string;
  lecturerId: string;
  title: string;
  body: string;
  timestamp: string;
  hasGroupAssignment: boolean;
  groups?: {
    id: string;
    groupNumber: number;
    memberNames: string[];
    memberCount: number;
    hasProject: boolean;
    projectId?: string;
  }[];
  files?: {
    id: string;
    filename: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }[];
}

// --- Context Definition ---
interface MockDataContextType {
  user: User | null;
  isLoadingAuth: boolean;
  availableUsers: User[];
  projects: Project[];
  tasks: Task[];
  messages: Message[];
  notifications: Notification[];
  rawNotifications: Notification[];
  courses: Course[];
  announcements: Announcement[];
  courseGroups: CourseGroup[];
  globalActivity: any[];
  loginUser: (userData: any, token: string) => void;
  logout: () => void;
  updateUserPreferences: (prefs: Partial<User['preferences']>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addProject: (project: Project) => void;
  addTask: (task: Task) => void;
  addMessage: (projectId: string | undefined, text: string, mentions?: Message['mentions'], replyToId?: string, dmChatId?: string) => void;
  editMessage: (messageId: string, newText: string) => void;
  deleteMessage: (messageId: string) => void;
  pinMessage: (messageId: string) => void;
  markNotificationsAsRead: () => void;
  toggleTheme: () => void;
  joinProject: (projectId: string) => Promise<void>;
  leaveProject: (projectId: string) => Promise<void>;
  claimTask: (taskId: string) => void;
  breakDownTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => void;
  updateTaskAssignees: (taskId: string, assignees: string[]) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  switchUser: (userId: string) => void;
  // Lecturer actions
  createCourse: (data: { title: string; course_code: string; description?: string }) => Promise<Course>;
  updateCourse: (courseId: string, updates: Partial<{ title: string; courseCode: string; description: string }>) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  joinCourse: (joinCode: string) => Promise<Course>;
  fetchCourseGroups: (courseId: string) => Promise<CourseGroup[]>;
  fetchCourseAnnouncements: (courseId: string) => Promise<Announcement[]>;
  createAnnouncement: (courseId: string, data: any, file?: File) => Promise<void>;
  deleteAnnouncement: (courseId: string, annId: string) => Promise<void>;
  uploadAnnouncementFile: (courseId: string, annId: string, file: File) => Promise<void>;
  refreshCourses: () => Promise<void>;
  joinCourseGroup: (courseId: string, groupId: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [globalActivity, setGlobalActivity] = useState<any[]>([]);

  // Initial Auth Check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingAuth(false);
      return;
    }

    api.getMe()
      .then(userData => {
        setUser({ ...userData, preferences: { theme: 'light', notifications: true } });
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });
  }, []);

  // Fetch real data once user is logged in
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        if (user.role === 'lecturer') {
          const [courseData, notifData, actData] = await Promise.all([
            api.getLecturerCourses(),
            api.getNotifications().catch(() => null),
            api.getGlobalActivity().catch(() => null)
          ]);
          if (courseData?.courses) setCourses(courseData.courses);
          if (notifData?.notifications) setNotifications(notifData.notifications);
          if (actData?.activity) setGlobalActivity(actData.activity);
        } else {
          const [projData, taskData, courseData, notifData, actData] = await Promise.all([
            api.getProjects(),
            api.getTasks(),
            api.getStudentCourses().catch(() => null),
            api.getNotifications().catch(() => null),
            api.getGlobalActivity().catch(() => null)
          ]);
          if (projData?.projects) setProjects(projData.projects);
          if (taskData?.tasks) setTasks(taskData.tasks);
          if (courseData?.courses) setCourses(courseData.courses);
          if (notifData?.notifications) setNotifications(notifData.notifications);
          if (actData?.activity) setGlobalActivity(actData.activity);
        }
      } catch (err) {
        console.error('Failed to sync data', err);
      }
    };
    fetchData();
    
    const interval = setInterval(fetchData, 15000);
    
    // WebSocket for instant notification push
    let ws: WebSocket;
    const wsHost = `${window.location.hostname}:8000`;
    const connectWs = () => {
      ws = new WebSocket(`ws://${wsHost}/api/ws/notifications/${user.id}`);
      ws.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data);
          setNotifications(prev => [newNotif, ...prev]);
        } catch (e) {
          console.error("WS parse error", e);
        }
      };
      ws.onclose = () => {
        setTimeout(connectWs, 3000);
      };
    };
    connectWs();

    return () => {
      clearInterval(interval);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      document.documentElement.setAttribute('data-theme', user.preferences.theme);
    }
  }, [user?.preferences.theme]);

  const loginUser = (userData: any, token: string) => {
    localStorage.setItem('token', token);
    setUser({ ...userData, preferences: { theme: 'light', notifications: true } });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProjects([]);
    setTasks([]);
    setCourses([]);
    setAnnouncements([]);
    setCourseGroups([]);
    setGlobalActivity([]);
  };

  const updateUserPreferences = (prefs: Partial<User['preferences']>) => {
    if (user) setUser(prev => prev ? ({ ...prev, preferences: { ...prev.preferences, ...prefs } }) : prev);
  };

  const toggleTheme = () => {
    if (user) updateUserPreferences({ theme: user.preferences.theme === 'light' ? 'dark' : 'light' });
  };

  const switchUser = (_userId: string) => {};

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? ({ ...prev, ...updates }) : prev);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    api.updateTask(taskId, { status }).catch(console.error);
  };

  const addProject = (project: Project) => {
    setProjects(prev => {
      if (prev.find(p => p.id === project.id)) return prev;
      return [project, ...prev];
    });
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
      console.error('Failed to sync new task creation', err);
    }
  };

  const addMessage = (projectId: string | undefined, text: string, mentions?: Message['mentions'], replyToId?: string, dmChatId?: string) => {
    if (!user) return;
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      projectId,
      dmChatId,
      senderId: user.id,
      senderName: user.name,
      text,
      timestamp: new Date().toISOString(),
      mentions,
      replyToId
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const editMessage = (messageId: string, newText: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newText, isEdited: true } : m));
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const pinMessage = (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isPinned: !m.isPinned } : m));
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    api.markNotificationsRead().catch(console.error);
  };

  // ── Notification Filtering Logic ──────────────────────
  const filteredNotifications = useMemo(() => {
    if (!user) return [];
    if (user.role === 'lecturer') return notifications;

    return notifications.filter(n => {
      // 1. New messages are always visible if you're in the chat
      if (n.type === 'new_message') return true;

      // 2. Project-wide alerts are visible to all members
      if (['risk', 'system', 'status_change', 'project_update'].includes(n.type)) return true;

      // 3. Task-specific alerts
      if (n.taskId) {
        // Find the task to see who is assigned
        const task = tasks.find(t => t.id === n.taskId);
        if (task) {
          const isAssignee = task.assignees.includes(user.name);
          
          // Check if user is an admin for this project
          const project = projects.find(p => p.id === task.projectId);
          const isAdmin = project?.admins.includes(user.name);

          // Only notify if user is assignee OR admin
          return isAssignee || isAdmin;
        }
      }

      // Default: allow if no specific task/project ID is attached (backward compatibility)
      return true;
    });
  }, [notifications, user, tasks, projects]);

  const claimTask = (taskId: string) => {
    if (!user) return;
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'in_progress', assignees: Array.from(new Set([...t.assignees, user.name])) } : t
    ));
    api.claimTask(taskId).catch(console.error);
  };

  const joinProject = async (projectId: string) => {
    if (!user) return;
    try {
      const data = await api.joinProject(projectId);
      if (data.success) {
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, members: [...p.members, user.name] } : p
        ));
      }
    } catch (err) {
      console.error('Failed to join project', err);
      throw err;
    }
  };

  const leaveProject = async (projectId: string) => {
    if (!user) return;
    const projToLeave = projects.find(p => p.id === projectId);
    try {
      await api.leaveProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      // If this project was tied to a course group, refresh that course's announcements
      if (projToLeave?.courseId) {
        await fetchCourseAnnouncements(projToLeave.courseId);
      }
    } catch (err: any) {
      console.error('Failed to leave project', err);
      throw err;
    }
  };

  const breakDownTask = async (taskId: string) => {
    if (!user) return;
    try {
      const data = await api.breakDownTask(taskId);
      if (data && data.tasks) {
        setTasks(prev => {
          const filtered = prev.filter(t => t.id !== taskId);
          return [...data.tasks, ...filtered];
        });
      }
    } catch (err) {
      console.error('Failed to break down task', err);
      throw err;
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (!taskId.startsWith('m-')) api.deleteTask(taskId).catch(console.error);
  };

  const updateTaskAssignees = (taskId: string, assignees: string[]) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignees } : t));
    if (!taskId.startsWith('m-')) api.updateTask(taskId, { assignees }).catch(console.error);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    if (!taskId.startsWith('m-')) api.updateTask(taskId, updates).catch(console.error);
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    if (projectId.length === 8 && /^[0-9a-f]+$/.test(projectId)) {
      api.updateProject(projectId, updates).catch(err => console.error('Failed to sync project update', err));
    }
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (projectId.length === 8 && /^[0-9a-f]+$/.test(projectId)) {
      api.deleteProject(projectId).catch(err => console.error('Failed to sync project deletion', err));
    }
  };

  // --- Lecturer actions ---
  const createCourse = async (data: { title: string; course_code: string; description?: string }): Promise<Course> => {
    const res = await api.createCourse(data);
    const course = res.course;
    setCourses(prev => [course, ...prev]);
    return course;
  };

  const updateCourse = async (courseId: string, updates: any) => {
    // Sync with API if needed, for now just local state
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...updates } : c));
  };

  const deleteCourse = async (courseId: string) => {
    await api.deleteCourse(courseId);
    setCourses(prev => prev.filter(c => c.id !== courseId));
  };

  const joinCourse = async (joinCode: string): Promise<Course> => {
    const res = await api.joinCourseByCode(joinCode);
    const course = res.course;
    setCourses(prev => {
      if (prev.find(c => c.id === course.id)) return prev;
      return [course, ...prev];
    });
    return course;
  };

  const fetchCourseGroups = async (courseId: string): Promise<CourseGroup[]> => {
    const res = await api.getCourseGroups(courseId);
    const groups: CourseGroup[] = res.groups || [];
    setCourseGroups(prev => {
      const filtered = prev.filter(g => g.courseId !== courseId);
      return [...filtered, ...groups];
    });
    return groups;
  };

  const fetchCourseAnnouncements = async (courseId: string): Promise<Announcement[]> => {
    const res = await api.getCourseAnnouncements(courseId);
    const anns: Announcement[] = res.announcements || [];
    setAnnouncements(prev => {
      const filtered = prev.filter(a => a.courseId !== courseId);
      return [...filtered, ...anns];
    });
    return anns;
  };

  const createAnnouncement = async (courseId: string, data: any, file?: File) => {
    const res = await api.createAnnouncement(courseId, data);
    const ann = res.announcement;
    
    if (file && ann) {
      await api.uploadAnnouncementFile(courseId, ann.id, file);
      // Re-fetch to get files if needed, or just append locally
    }
    
    setAnnouncements(prev => [ann, ...prev]);
  };

  const uploadAnnouncementFile = async (courseId: string, annId: string, file: File) => {
    await api.uploadAnnouncementFile(courseId, annId, file);
    await fetchCourseAnnouncements(courseId); // Refresh to get the new file list
  };

  const deleteAnnouncement = async (courseId: string, annId: string) => {
    await api.deleteAnnouncement(courseId, annId);
    setAnnouncements(prev => prev.filter(a => a.id !== annId));
  };

  const joinCourseGroup = async (courseId: string, groupId: string) => {
    await api.joinCourseGroup(courseId, groupId);
    // Refresh announcements to get updated groups data
    await fetchCourseAnnouncements(courseId);
  };

  const refreshCourses = async () => {
    if (!user) return;
    try {
      if (user.role === 'lecturer') {
        const res = await api.getLecturerCourses();
        if (res?.courses) setCourses(res.courses);
      } else {
        const res = await api.getStudentCourses();
        if (res?.courses) setCourses(res.courses);
      }
    } catch (err) {
      console.error('Failed to refresh courses', err);
    }
  };

  return (
    <MockDataContext.Provider value={{ 
      user, isLoadingAuth, availableUsers: [], projects, tasks, messages,
      courses, announcements, courseGroups, globalActivity,
      loginUser, logout, updateUserPreferences, updateTaskStatus, addProject, addTask,
      addMessage, editMessage, deleteMessage, pinMessage, markNotificationsAsRead, toggleTheme,
      joinProject, leaveProject, claimTask, breakDownTask, deleteTask, updateTaskAssignees,
      updateTask, updateProject, deleteProject, switchUser,
      createCourse, updateCourse, deleteCourse, joinCourse, fetchCourseGroups, fetchCourseAnnouncements,
      createAnnouncement, deleteAnnouncement, uploadAnnouncementFile, refreshCourses, joinCourseGroup,
      updateUser,
      notifications: filteredNotifications,
      rawNotifications: notifications
    }}>
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
};
