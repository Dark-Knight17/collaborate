export const DUMMY = 'DUMMY';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type UserRole = 'student' | 'lecturer';

export type Task = {
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
};

export type Project = {
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
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  }
};

export type Message = {
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
};

export type Notification = {
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
};

export type Course = {
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
};

export type CourseGroup = {
  id: string;
  courseId: string;
  groupNumber: number;
  memberNames: string[];
  createdBy: string;
  projectId?: string;
  progress?: number;
  dueDate?: string;
  memberCount?: number;
};

export type Announcement = {
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
};
