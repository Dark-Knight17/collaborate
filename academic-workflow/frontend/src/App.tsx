import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MockDataProvider } from './context/MockDataContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LecturerLayout } from './layouts/LecturerLayout';

import { Homepage } from './pages/Homepage';
import { LoginPage } from './pages/LoginPage';

import { DashboardOverview } from './pages/DashboardOverview';
import { TasksTab } from './pages/TasksTab';
import { ProjectDetails } from './pages/ProjectDetails';
import { ProjectsTab } from './pages/ProjectsTab';
import { SettingsTab } from './pages/SettingsTab';
import { MessagesTab } from './pages/MessagesTab';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { CoursesTab } from './pages/CoursesTab';

// Lecturer Pages
import { LecturerOverview } from './pages/lecturer/LecturerOverview';
import { LecturerCourses } from './pages/lecturer/LecturerCourses';
import { LecturerAnnouncements } from './pages/lecturer/LecturerAnnouncements';
import { LecturerStudents } from './pages/lecturer/LecturerStudents';
import { LecturerMessages } from './pages/lecturer/LecturerMessages';
import { LecturerSettings } from './pages/lecturer/LecturerSettings';

function App() {
  return (
    <MockDataProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Student Application Routes */}
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="project/:id" element={<ProjectDetails />} />
            <Route path="tasks" element={<TasksTab />} />
            <Route path="projects" element={<ProjectsTab />} />
            <Route path="courses" element={<CoursesTab />} />
            <Route path="messages" element={<MessagesTab />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsTab />} />
          </Route>

          {/* Lecturer Application Routes */}
          <Route path="/lecturer" element={<LecturerLayout />}>
            <Route index element={<LecturerOverview />} />
            <Route path="courses" element={<LecturerCourses />} />
            <Route path="students" element={<LecturerStudents />} />
            <Route path="announcements" element={<LecturerAnnouncements />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="messages" element={<LecturerMessages />} />
            <Route path="settings" element={<LecturerSettings />} />
            <Route path="project/:id" element={<ProjectDetails />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MockDataProvider>
  );
}

export default App;
