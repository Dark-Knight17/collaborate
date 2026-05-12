import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type {
  Task,
  TaskStatus,
  Project,
  User,
  Message,
  Notification,
  Course,
  CourseGroup,
  Announcement,
} from '../appTypes';

import { useAuth } from './AuthContext';
import { useProjects } from './ProjectContext';
import { useNotifications } from './NotificationContext';

export type {
  Task,
  TaskStatus,
  Project,
  User,
  Message,
  Notification,
  Course,
  CourseGroup,
  Announcement,
} from '../appTypes';

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
  console.log("Rendering MockDataProvider");
  const auth = useAuth();
  const projects = useProjects();
  const notifications = useNotifications();

  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (projectId: string | undefined, text: string, mentions?: Message['mentions'], replyToId?: string, dmChatId?: string) => {
    if (!auth.user) return;
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      projectId,
      dmChatId,
      senderId: auth.user.id,
      senderName: auth.user.name,
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

  const filteredNotifications = useMemo(() => {
    if (!auth.user) return [];
    if (auth.user.role === 'lecturer') return notifications.notifications;

    return notifications.notifications.filter(n => {
      if (n.type === 'new_message') return true;
      if (['risk', 'system', 'status_change', 'project_update'].includes(n.type)) return true;

      if (n.taskId) {
        const task = projects.tasks.find(t => t.id === n.taskId);
        if (task) {
          const isAssignee = task.assignees.includes(auth.user!.name);
          const project = projects.projects.find(p => p.id === task.projectId);
          const isAdmin = project?.admins.includes(auth.user!.name);
          return isAssignee || isAdmin;
        }
      }
      return true;
    });
  }, [notifications.notifications, auth.user, projects.tasks, projects.projects]);

  const value: MockDataContextType = {
    user: auth.user,
    isLoadingAuth: auth.isLoadingAuth,
    loginUser: auth.loginUser,
    logout: auth.logout,
    updateUser: auth.updateUser,
    updateUserPreferences: auth.updateUserPreferences,
    toggleTheme: auth.toggleTheme,
    
    projects: projects.projects,
    tasks: projects.tasks,
    courses: projects.courses,
    announcements: projects.announcements,
    courseGroups: projects.courseGroups,
    globalActivity: projects.globalActivity,
    addProject: projects.addProject,
    updateProject: projects.updateProject,
    deleteProject: projects.deleteProject,
    joinProject: projects.joinProject,
    leaveProject: projects.leaveProject,
    addTask: (task: Task) => { projects.addTask(task); }, // Wrapper to avoid promise type mismatch if any
    updateTask: projects.updateTask,
    updateTaskStatus: projects.updateTaskStatus,
    updateTaskAssignees: projects.updateTaskAssignees,
    deleteTask: projects.deleteTask,
    claimTask: projects.claimTask,
    breakDownTask: projects.breakDownTask,
    createCourse: projects.createCourse,
    updateCourse: projects.updateCourse,
    deleteCourse: projects.deleteCourse,
    joinCourse: projects.joinCourse,
    refreshCourses: projects.refreshCourses,
    fetchCourseGroups: projects.fetchCourseGroups,
    fetchCourseAnnouncements: projects.fetchCourseAnnouncements,
    createAnnouncement: projects.createAnnouncement,
    deleteAnnouncement: projects.deleteAnnouncement,
    uploadAnnouncementFile: projects.uploadAnnouncementFile,
    joinCourseGroup: projects.joinCourseGroup,

    messages,
    addMessage,
    editMessage,
    deleteMessage,
    pinMessage,
    notifications: filteredNotifications,
    rawNotifications: notifications.rawNotifications,
    markNotificationsAsRead: notifications.markNotificationsAsRead,
    availableUsers: [],
    switchUser: () => {},
  };

  return (
    <MockDataContext.Provider value={value}>
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
