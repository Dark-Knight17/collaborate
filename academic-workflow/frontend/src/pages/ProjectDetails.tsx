import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useMockData, type TaskStatus, type Task } from '../context/MockDataContext';
import { KanbanBoard } from '../components/shared/KanbanBoard';
import {
  ArrowLeft, Edit3, UploadCloud, Users, Calendar, Sparkles, AlertCircle,
  CheckCircle2, FileText, Activity, ShieldCheck, Zap, Info, Search, Filter,
  LayoutGrid, List as ListIcon, CalendarDays, Clock, ChevronLeft, ChevronRight, Share2, Copy, Mail, MessageCircle, Send, X, MoreVertical, Trash2, Check
} from 'lucide-react';
import { api } from '../api';
import { API_BASE_URL } from '../api/config';
import TaskDetails from '../components/TaskDetails';
import { EditProjectModal } from '../components/EditProjectModal';
import { HydrateBlueprintModal } from '../components/HydrateBlueprintModal';
import { RerunAIModal } from '../components/RerunAIModal';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const isLecturerView = new URLSearchParams(location.search).get('viewOnly') === 'true';
  const { 
    user,
    projects: mockProjects, 
    tasks: mockTasks, 
    updateTaskStatus, 
    updateTaskAssignees, 
    deleteTask,
    updateTask,
    updateProject: mockUpdateProject,
    addTask: mockAddTask,
    joinProject,
    leaveProject,
    claimTask: contextClaimTask
  } = useMockData();
  const navigate = useNavigate();

  // ... rest of state ...
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024 && window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024 && window.innerWidth > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [project, setProject] = useState<any>(null);
  const [localTasks, setLocalTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'resources' | 'activity'>('blueprint');

  const handleTabChange = async (tab: 'blueprint' | 'resources' | 'activity') => {
    setActiveTab(tab);
    if (!id || !/^[0-9a-f]{8}$/.test(id)) return;
    if (tab === 'resources' && projectFiles.length === 0) {
      refreshFiles();
    }
    if (tab === 'activity') {
      refreshActivity();
    }
  };
  const [generationContext, setGenerationContext] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [activeMemberMenu, setActiveMemberMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number, right: number } | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);

  const refreshFiles = useCallback(async (silent = false) => {
    if (!id || !/^[0-9a-f]{8}$/.test(id)) return;
    if (!silent) setFilesLoading(true);
    try {
      const d = await api.getProjectFiles(id);
      setProjectFiles(d.files);
    } catch (e) {
      console.error("Failed to refresh files", e);
    } finally {
      if (!silent) setFilesLoading(false);
    }
  }, [id]);

  const refreshActivity = useCallback(async (silent = false) => {
    if (!id || !/^[0-9a-f]{8}$/.test(id)) return;
    if (!silent) setActivityLoading(true);
    try {
      const d = await api.getProjectActivity(id);
      setActivityLog(d.activity);
    } catch (e) {
      console.error("Failed to refresh activity", e);
    } finally {
      if (!silent) setActivityLoading(false);
    }
  }, [id]);
  const [showRerunModal, setShowRerunModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStatusMessage, setGenStatusMessage] = useState('Initializing Architect...');
  const [isMockProject, setIsMockProject] = useState(false);

  // Resource library state
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Activity log state
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // View & filter state for blueprint tab
  const [view, setView] = useState<'board' | 'list' | 'calendar'>('board');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Derive project from mock data or local state
  const derivedProject = isMockProject ? mockProjects.find(p => p.id === id) : project;
  // Always resolve joinCode from the live context project list first (most reliable source)
  const resolvedJoinCode = mockProjects.find(p => p.id === id)?.joinCode || derivedProject?.joinCode;
  const isMember = user ? derivedProject?.members?.includes(user.name) : false;
  const isAdmin = user ? (derivedProject?.admins?.includes(user.name) ?? false) : false;
  // Effective read-only: lecturer viewing a student project
  const isReadOnly = isLecturerView || (user?.role === 'lecturer' && !isAdmin && isMember);

  // For mock projects, derive tasks live from context
  const tasks = isMockProject ? mockTasks.filter(t => t.projectId === id) : localTasks;

  const calculatedProgress = React.useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    const total = tasks.length;
    let score = 0;
    tasks.forEach(t => {
      if (t.status === 'in_progress') score += 33;
      else if (t.status === 'review') score += 66;
      else if (t.status === 'completed') score += 100;
    });
    return Math.floor(score / total);
  }, [tasks]);

  const intelligenceSummary = React.useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const todoTasks = tasks.filter(t => t.status === 'todo');
    
    // Find next milestone
    const sortedPending = [...inProgressTasks, ...todoTasks].sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
    
    const nextMilestone = sortedPending.length > 0 ? sortedPending[0].title : 'Final Review';
    
    // Find active member
    const activeAssignees = inProgressTasks.map(t => t.assignees).flat().filter(Boolean);
    let mostActive = 'The team';
    if (activeAssignees.length > 0) {
      const counts: Record<string, number> = {};
      let maxCount = 0;
      for (const a of activeAssignees) {
        counts[a] = (counts[a] || 0) + 1;
        if (counts[a] > maxCount) {
          maxCount = counts[a];
          mostActive = a;
        }
      }
    }

    // Health
    const today = new Date().toISOString().split('T')[0];
    const hasOverdue = sortedPending.some(t => t.deadline && t.deadline < today);
    const health = hasOverdue ? 'At Risk' : 'On Track';
    const healthColor = hasOverdue ? 'var(--accent-red)' : 'var(--accent)';
    const HealthIcon = hasOverdue ? AlertCircle : ShieldCheck;

    let phaseStr = 'Initiation phase';
    if (calculatedProgress > 80) phaseStr = 'Finalization phase';
    else if (calculatedProgress > 30) phaseStr = 'Execution phase';
    
    return { nextMilestone, mostActive, health, healthColor, HealthIcon, phaseStr };
  }, [tasks, calculatedProgress]);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterBy === 'my_tasks') return (user && t.assignees.includes(user.name)) || t.assignees.includes('Alex');
    if (filterBy === 'completed') return t.status === 'completed';
    return true;
  });

  // Auto-refresh activity log every 15s when the tab is visible
  useEffect(() => {
    if (activeTab !== 'activity' || !id || !/^[0-9a-f]{8}$/.test(id)) return;
    const poll = async () => {
      try {
        const d = await api.getProjectActivity(id);
        setActivityLog(d.activity);
      } catch {}
    };
    poll(); // fetch immediately when tab activates
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [activeTab, id]);


  const STATUS_MESSAGES = [
    'Scanning Research Context...', 'Synthesizing Domain Constraints...',
    'Mapping Academic Milestones...', 'Developing Work Blueprint...',
    'Configuring Integrity Gates...', 'Finalizing AI Agent Strategy...'
  ];

  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    if (generating) return;

    const isRealId = id.length === 8 && /^[0-9a-f]+$/.test(id);

    if (isRealId) {
      setIsMockProject(false);
      try {
        const data = await api.getProject(id);
        const mappedProject = { ...data.project, title: data.project.title || data.project.topic };
        setProject(mappedProject);
        setLocalTasks(data.tasks);
        if (mappedProject.status === 'created' && data.tasks.length === 0) setShowPromptInput(true);
        // Pre-fetch file count so upload bar shows correct number immediately
        refreshFiles(true);
      } catch (err) {
        setError("Could not load project from registry.");
      } finally {
        setLoading(false);
      }
    } else {
      setIsMockProject(true);
      setLoading(false);
    }
  }, [id, mockProjects, generating, project?.status]);

  useEffect(() => {
    fetchProjectData();
    if (id && id.length === 8) {
      const interval = setInterval(() => { fetchProjectData(); }, 10000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const handleGenerateTasks = async (projectId: string, topic: string, contextOverride?: string) => {
    setGenerating(true);
    setShowPromptInput(false);
    setGenProgress(0);
    setGenStatusMessage(STATUS_MESSAGES[0]);
    const progressInterval = setInterval(() => {
      setGenProgress(prev => {
        if (prev >= 95) return prev;
        const next = prev + Math.random() * 5;
        const msgIndex = Math.floor((next / 100) * STATUS_MESSAGES.length);
        if (STATUS_MESSAGES[msgIndex]) setGenStatusMessage(STATUS_MESSAGES[msgIndex]);
        return next;
      });
    }, 200);
    const isRealId = projectId.length === 8 && /^[0-9a-f]+$/.test(projectId);
    try {
      if (isRealId) {
        const payloadContext = contextOverride || generationContext || derivedProject?.description || '';
        const genData = await api.generateTasks(projectId, topic, payloadContext);
        setGenProgress(100); setGenStatusMessage('Blueprint Finalized.');
        await new Promise(r => setTimeout(r, 500));
        setLocalTasks(genData.tasks);
        setProject((prev: any) => ({ ...prev, status: 'tasks_generated' }));
      } else {
        await new Promise(r => setTimeout(r, 3000));
        setGenProgress(100); setGenStatusMessage('Blueprint Finalized.');
        await new Promise(r => setTimeout(r, 500));
        const newMockTasks = [
          { id: `m-${Date.now()}-1`, projectId, title: `Research ${topic} Foundations`, status: 'todo' as TaskStatus, priority: 'high' as any, deadline: new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0], assignees: ['Alex Student'] , hasSubmittedFile: false },
          { id: `m-${Date.now()}-2`, projectId, title: `Analyze ${topic} Constraints`, status: 'in_progress' as TaskStatus, priority: 'medium' as any, deadline: new Date(Date.now() + 14 * 864e5).toISOString().split('T')[0], assignees: ['Sarah'], hasSubmittedFile: false  },
          { id: `m-${Date.now()}-3`, projectId, title: `Draft ${topic} Proposal`, status: 'todo' as TaskStatus, priority: 'low' as any, deadline: new Date(Date.now() + 21 * 864e5).toISOString().split('T')[0], assignees: ['Mike'], hasSubmittedFile: false  },
        ];
        newMockTasks.forEach(t => mockAddTask(t));
        mockUpdateProject(projectId, { status: 'tasks_generated' } as any);
      }
    } catch (err) {
      console.error('Task generation failed', err);
    } finally {
      clearInterval(progressInterval);
      setGenerating(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    if (isMockProject) {
      updateTaskStatus(taskId, status);
    } else {
      setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      try {
        await api.updateTask(taskId, { status });
        fetchProjectData();
      } catch (err) {
        console.error('Failed to sync task status', err);
      }
    }
  };

  const handleAssigneeChange = async (taskId: string, assignees: string[]) => {
    if (isMockProject) {
      updateTaskAssignees(taskId, assignees);
    } else {
      setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignees } : t));
      try {
        await api.updateTask(taskId, { assignees });
        fetchProjectData();
      } catch (err) {
        console.error('Failed to sync task assignees', err);
      }
    }
  };

  const handleClaimTask = async (taskId: string) => {
    if (isMockProject) {
      contextClaimTask(taskId);
      return;
    }
    try {
      const res = await api.claimTask(taskId);
      // Update local state with what the backend returned
      setLocalTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: res.status, assignees: res.assignees } : t
      ));
      if (selectedTask?.id === taskId) {
        setSelectedTask((prev: any) => prev ? { ...prev, status: res.status, assignees: res.assignees } : null);
      }
      fetchProjectData();
    } catch (err: any) {
      console.error('Claim failed:', err?.response?.data?.detail || err);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (isMockProject) {
      deleteTask(taskId);
    } else {
      setLocalTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleEditTask = async (taskId: string, updates: Partial<Task>) => {
    if (isMockProject) {
      updateTask(taskId, updates);
    } else {
      setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      try {
        await api.updateTask(taskId, updates);
      } catch (err) {
        console.error('Failed to sync task edits', err);
      }
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return (
      <div className="card glass-card animate-fade-in" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        {/* Calendar Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700 }}>
            {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-icon" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} style={{ borderRadius: '8px' }}>
              <ChevronLeft size={18} />
            </button>
            <button className="btn-icon" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} style={{ borderRadius: '8px' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Day Labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '0.5rem 0' }}>{d}</div>
          ))}
        </div>

        {/* Day Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const tasksOnDay = filteredTasks.filter(t => t.deadline?.startsWith(dateStr));
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            return (
              <div key={day} style={{
                minHeight: '80px', padding: '0.5rem', borderRadius: '10px',
                background: isToday ? 'color-mix(in srgb, var(--theme-color) 8%, transparent)' : 'var(--bg-app)',
                border: isToday ? '1px solid color-mix(in srgb, var(--theme-color) 30%, transparent)' : '1px solid transparent',
                display: 'flex', flexDirection: 'column', gap: '0.25rem'
              }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--theme-color)' : 'var(--text-secondary)' }}>{day}</span>
                {tasksOnDay.map(t => (
                  <div key={t.id} onClick={() => setSelectedTask(t)} style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.4rem',
                    borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    background: t.priority === 'high' ? 'rgba(239, 68, 68, 0.15)' : t.priority === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 'color-mix(in srgb, var(--theme-color) 10%, transparent)',
                    color: t.priority === 'high' ? 'var(--accent-red)' : t.priority === 'medium' ? 'var(--accent-yellow)' : 'var(--theme-color)'
                  }}>{t.title}</div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex-center" style={{ height: '60vh', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--theme-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p className="text-secondary">Syncing Project Hub...</p>
    </div>
  );

  if (error || !derivedProject) return (
    <div className="flex-center" style={{ height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <AlertCircle size={48} color="var(--accent-red)" />
      <h2 style={{ margin: 0 }}>{error || "Project Missing"}</h2>
      <Link to={isLecturerView ? "/lecturer/courses" : "/app"} className="btn btn-secondary"><ArrowLeft size={16} /> {isLecturerView ? "Back to Courses" : "Back to Dashboard"}</Link>
    </div>
  );

  if (isHydrating && derivedProject) {
    return (
      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <HydrateBlueprintModal
          isOpen={isHydrating}
          onClose={() => setIsHydrating(false)}
          project={derivedProject}
          onComplete={(formData: any) => {
            setIsHydrating(false);
            const updatedProject = mockProjects.find(p => p.id === derivedProject.id) || derivedProject;
            
            const richContext = `
Description: ${formData.description || updatedProject.description || 'Not provided'}
Course Code: ${formData.courseCode || 'Not provided'}
Project Type: ${formData.projectType || 'Not provided'}
Deliverable: ${formData.deliverable || 'Not provided'}
Team Size: ${formData.collaborationStyle || 'Not provided'}
            `.trim();

            handleGenerateTasks(derivedProject.id, derivedProject.topic || derivedProject.title || '', richContext);
          }}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Breadcrumbs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
        <Link to={isLecturerView ? "/lecturer/courses" : "/app"} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{isLecturerView ? "Courses" : "Dashboard"}</Link>
        <span style={{ color: 'var(--border-color)' }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Project Hub</span>
      </nav>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Header Card */}
          <div className="card glass-card" style={{ 
            padding: isMobile ? '1.5rem' : '2.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isMobile ? '1.5rem' : '2rem', 
            border: '1px solid color-mix(in srgb, var(--theme-color) 20%, transparent)' 
          }}>
            <div className="flex-between" style={{ alignItems: 'flex-start', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h1 style={{ 
                    fontSize: isMobile ? '1.75rem' : '2.5rem', 
                    margin: 0, 
                    fontWeight: 800, 
                    letterSpacing: '-0.03em', 
                    wordBreak: 'break-word' 
                  }}>{derivedProject?.topic || derivedProject?.title}</h1>
                </div>
                <p className="text-secondary line-clamp-3" style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', lineHeight: 1.6, margin: 0 }}>
                  {derivedProject?.description || `Specialized research project focusing on ${derivedProject?.topic}. AI-assisted task workflows active.`}
                </p>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center', 
                  gap: isMobile ? '0.75rem' : '1.5rem', 
                  marginTop: '0.5rem', 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.875rem', 
                  fontWeight: 500 
                }}>
                  {derivedProject?.courseCode && (
                    <span className="badge" style={{ background: 'color-mix(in srgb, var(--theme-color) 8%, transparent)', color: 'var(--theme-color)', fontWeight: 700, letterSpacing: '0.05em' }}>
                      {derivedProject.courseCode}
                    </span>
                  )}
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                    onClick={() => setShowMembersModal(true)}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    title="View Members & Manage Roles"
                  >
                    <Users size={16} /> <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>{derivedProject?.members?.length || 0} Members</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={16} />
                    <span>Due {derivedProject?.dueDate ? new Date(derivedProject.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}</span>
                  </div>
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                alignItems: 'center', 
                flexShrink: 0,
                width: isMobile ? '100%' : 'auto',
                justifyContent: isMobile ? 'flex-start' : 'flex-end'
              }}>
                {isReadOnly ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem', borderRadius: '10px',
                    background: 'color-mix(in srgb, var(--theme-color) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-color) 20%, transparent)',
                    color: '#0ea5e9', fontWeight: 700, fontSize: '0.8rem'
                  }}>
                    <ShieldCheck size={15} /> Lecturer View — Read Only
                  </div>
                ) : !isMember ? (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => joinProject(derivedProject.id)}
                    style={{ padding: '0.875rem 1.5rem', boxShadow: '0 4px 20px color-mix(in srgb, var(--theme-color) 40%, transparent)' }}
                  >
                    <Users size={18} /> Join Project
                  </button>
                ) : (
                  <>
                    <button className="btn btn-secondary" style={{ background: 'var(--bg-card)', padding: '0.875rem 1.25rem' }} onClick={() => setIsEditModalOpen(true)}>
                      <Edit3 size={18} /> Edit
                    </button>
                    <button className="btn btn-secondary" style={{ background: 'var(--bg-card)', padding: '0.875rem 1.25rem' }} onClick={() => setShowShareModal(true)}>
                      <Share2 size={18} /> Share Project
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Progress</span>
                <span style={{ fontWeight: 800, color: 'var(--theme-color)', fontSize: '0.875rem' }}>{calculatedProgress}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-app)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${calculatedProgress}%`, background: 'linear-gradient(90deg, var(--theme-color), var(--accent))', borderRadius: '100px', transition: 'width 0.4s ease' }}></div>
              </div>
            </div>

            {/* Intelligence Summary */}
            {((isLecturerView || user?.role === 'lecturer') && intelligenceSummary && (tasks.length > 0 || derivedProject?.status === 'tasks_generated')) && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile || isTablet ? '1fr' : '1fr 300px', 
                gap: '2rem', 
                background: 'color-mix(in srgb, var(--theme-color) 3%, transparent)', 
                padding: '1.5rem', 
                borderRadius: '20px', 
                border: '1px solid color-mix(in srgb, var(--theme-color) 10%, transparent)' 
              }}>
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '15px', background: 'var(--theme-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 15px color-mix(in srgb, var(--theme-color) 30%, transparent)', flexShrink: 0 }}>
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--theme-color)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Intelligence Summary</div>
                    <p style={{ margin: 0, fontSize: isMobile ? '0.875rem' : '0.9375rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      Project is at <strong>{calculatedProgress}% completion</strong>. {intelligenceSummary.phaseStr} is active;
                      {' '}{intelligenceSummary.mostActive} is making steady progress. Next critical milestone: <strong>{intelligenceSummary.nextMilestone}</strong>.
                    </p>
                  </div>
                </div>
                <div style={{ 
                  borderLeft: isMobile || isTablet ? 'none' : '1px solid var(--border-color)', 
                  borderTop: isMobile || isTablet ? '1px solid var(--border-color)' : 'none',
                  paddingLeft: isMobile || isTablet ? 0 : '2rem',
                  paddingTop: isMobile || isTablet ? '1.5rem' : 0
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Initiative Health</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: intelligenceSummary.healthColor }}>{intelligenceSummary.health}</div>
                    <intelligenceSummary.HealthIcon size={20} color={intelligenceSummary.healthColor} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {generating ? (
            <div className="card glass-card animate-scale-in" style={{ padding: '5rem 3rem', textAlign: 'center', background: 'radial-gradient(circle at center, color-mix(in srgb, var(--theme-color) 5%, transparent), transparent)', border: '1px solid color-mix(in srgb, var(--theme-color) 30%, transparent)', borderRadius: '32px', position: 'relative', overflow: 'hidden', marginTop: '2rem' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)' }}>
                <div style={{ height: '100%', width: `${genProgress}%`, background: 'var(--theme-color)', transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '30px', background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-color)' }}>
                  <Zap size={48} className="animate-pulse" />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{genStatusMessage}</div>
                <div style={{ width: '300px', height: '2px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${genProgress}%`, background: 'var(--theme-color)', transition: 'width 0.2s' }}></div>
                </div>
              </div>
            </div>
          ) : !(tasks.length > 0 || derivedProject?.status === 'tasks_generated') ? (
            <div className="card glass-card animate-fade-in" style={{ padding: '6rem 2rem', textAlign: 'center', border: '1px dashed color-mix(in srgb, var(--theme-color) 40%, transparent)', background: 'var(--bg-app)', marginTop: '2rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-color)', margin: '0 auto 2rem' }}>
                <Sparkles size={40} />
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '2.5rem', fontWeight: 800 }}>Complete Setting Up</h3>
              <p className="text-secondary" style={{ marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto', fontSize: '1.25rem', lineHeight: 1.6 }}>
                Your project hub is successfully created. Provide a few contextual details to generate your intelligent Work Blueprint, analyze requirements, and properly structure your tasks.
              </p>
              <button className="btn btn-primary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.25rem', fontWeight: 800, borderRadius: '16px', marginTop: '2rem', boxShadow: '0 4px 20px color-mix(in srgb, var(--theme-color) 40%, transparent)' }} onClick={() => setIsHydrating(true)}>
                Complete Project Setup
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '1.5rem' }}>
              <div className="custom-scrollbar" style={{ 
                display: 'flex', 
                gap: isMobile ? '1rem' : '2rem', 
                marginBottom: '2.5rem', 
                borderBottom: '1px solid var(--border-color)',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}>
              {[
                { id: 'blueprint', label: 'Work Blueprint', icon: Zap },
                ...(isReadOnly ? [] : [{ id: 'resources', label: 'Resource Library', icon: FileText }]),
                { id: 'activity', label: 'Activity Logs', icon: Activity }
              ].map(tab => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id as any)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '1rem 0.5rem', background: 'none', border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--theme-color)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.9375rem',
                  cursor: 'pointer', transition: 'all 0.2s',
                  flexShrink: 0
                }}>
                  <tab.icon size={18} /> {tab.label}
                </button>
              ))}
            </div>

            {(!isMember) ? (
              <div className="card glass-card animate-fade-in" style={{ padding: '5rem 3rem', textAlign: 'center', background: 'color-mix(in srgb, var(--theme-color) 2%, transparent)', border: '2px dashed color-mix(in srgb, var(--theme-color) 10%, transparent)', borderRadius: '32px' }}>
                <ShieldCheck size={48} color="var(--theme-color)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Membership Required</h3>
                <p className="text-secondary" style={{ maxWidth: '500px', margin: '0 auto 2rem' }}>
                  Join this project to access the full work blueprint, resource library, and real-time collaboration signals.
                </p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => joinProject(derivedProject?.id || '')}
                  style={{ padding: '0.875rem 2.5rem' }}
                >
                  Join Project
                </button>
              </div>
            ) : activeTab === 'blueprint' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {tasks.length > 0 || isMockProject ? (
                  <>
                    {/* Filter & View Bar */}
                    <div className="flex-between" style={{ 
                      background: 'var(--bg-card)', 
                      padding: '0.75rem', 
                      borderRadius: '16px', 
                      border: '1px solid var(--border-color)',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: '1rem',
                      alignItems: 'stretch'
                    }}>
                      <div style={{ display: 'flex', gap: '1rem', flex: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                        <div style={{ position: 'relative', flex: 2 }}>
                          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                          <input
                            type="text" placeholder="Search tasks..."
                            className="input-field"
                            style={{ paddingLeft: '2.75rem', background: 'var(--bg-app)', border: 'none', fontSize: '0.875rem' }}
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <div style={{ position: 'relative' }}>
                          <select className="input-field" style={{ background: 'var(--bg-app)', appearance: 'none', cursor: 'pointer', border: 'none', paddingRight: '2.5rem', fontSize: '0.875rem', width: '100%' }}
                            value={filterBy} onChange={e => setFilterBy(e.target.value)}>
                            <option value="all">All Tasks</option>
                            <option value="my_tasks">My Tasks</option>
                            <option value="completed">Completed</option>
                          </select>
                          <Filter size={13} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                        </div>
                      </div>

                      {/* View Switcher */}
                      <div style={{ 
                        display: 'flex', 
                        background: 'var(--bg-app)', 
                        padding: '0.3rem', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border-color)', 
                        gap: '0.1rem',
                        justifyContent: 'center'
                      }}>
                        {[
                          { key: 'board', icon: LayoutGrid, label: 'Board' },
                          { key: 'list', icon: ListIcon, label: 'List' },
                          { key: 'calendar', icon: CalendarDays, label: 'Calendar' }
                        ].map(v => (
                          <button key={v.key} title={v.label}
                            className="btn-icon"
                            onClick={() => setView(v.key as any)}
                            style={{
                              background: view === v.key ? 'var(--bg-card)' : 'transparent',
                              boxShadow: view === v.key ? 'var(--shadow-sm)' : 'none',
                              color: view === v.key ? 'var(--theme-color)' : 'var(--text-secondary)',
                              borderRadius: '8px',
                              flex: isMobile ? 1 : 'none'
                            }}>
                            <v.icon size={16} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Board View */}
                    {view === 'board' && (
                        <KanbanBoard
                            tasks={filteredTasks}
                            onTaskClick={isReadOnly ? undefined : (taskId) => {
                              const task = tasks.find(t => t.id === taskId);
                              if (task) setSelectedTask(task);
                            }}
                            onStatusChange={isReadOnly ? undefined : handleStatusChange}
                            onAssigneeChange={isReadOnly ? undefined : handleAssigneeChange}
                            onClaimTask={isReadOnly || isMockProject ? undefined : handleClaimTask}
                            onClaimSuccess={isReadOnly || isMockProject ? undefined : (taskId, status, assignees) => {
                              setLocalTasks(prev => prev.map(t =>
                                t.id === taskId ? { ...t, status, assignees } : t
                              ));
                              fetchProjectData();
                            }}
                            onDeleteTask={isReadOnly ? undefined : handleDeleteTask}
                            onEditTask={isReadOnly ? undefined : handleEditTask}
                            onCreateTask={isReadOnly || isMockProject ? undefined : async (task) => {
                              const fullTask = { ...task, projectId: id as string };
                              setLocalTasks(prev => [fullTask, ...prev]);
                              mockAddTask(fullTask as any);
                            }}
                        />
                    )}

                    {/* List View */}
                    {view === 'list' && (
                      <div className="card glass-card animate-fade-in" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                              {['Task', 'Status', 'Deadline', 'Priority'].map(h => (
                                <th key={h} style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTasks.length > 0 ? filteredTasks.map(task => (
                              <tr key={task.id}
                                style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s', background: selectedTask?.id === task.id ? 'color-mix(in srgb, var(--theme-color) 5%, transparent)' : 'transparent' }}
                                onMouseOver={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-color) 3%, transparent)'}
                                onMouseOut={e => e.currentTarget.style.background = selectedTask?.id === task.id ? 'color-mix(in srgb, var(--theme-color) 5%, transparent)' : 'transparent'}
                                onClick={() => setSelectedTask(task)}
                              >
                                <td style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.9375rem' }}>{task.title}</td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-color)', textTransform: 'uppercase' }}>{task.status?.replace('_', ' ')}</span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={12} /> {task.deadline}</div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                  <span className="badge" style={{
                                    background: task.priority === 'high' ? 'rgba(239,68,68,0.1)' : task.priority === 'medium' ? 'rgba(245,158,11,0.1)' : 'var(--bg-app)',
                                    color: task.priority === 'high' ? 'var(--accent-red)' : task.priority === 'medium' ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                                    fontWeight: 800, fontSize: '0.65rem'
                                  }}>{task.priority?.toUpperCase()}</span>
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No tasks match this filter.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Calendar View */}
                    {view === 'calendar' && renderCalendar()}
                  </>
                ) : showPromptInput ? (
                  <div className="card glass-card animate-slide-up" style={{ padding: '3rem', border: '1px solid var(--theme-color)', borderRadius: '24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-color)', margin: '0 auto 1.5rem' }}>
                        <Sparkles size={32} />
                      </div>
                      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Configure AI Blueprint</h2>
                      <p className="text-secondary">Provide research context to help the AI Agent structure your project's milestones.</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <textarea className="input-field" placeholder="e.g., Focus on ethical considerations in machine learning..."
                        value={generationContext} onChange={e => setGenerationContext(e.target.value)}
                        style={{ height: '120px', padding: '1rem', background: 'var(--bg-app)' }} />
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-primary" style={{ flex: 1, height: '56px', fontSize: '1rem' }}
                          onClick={() => handleGenerateTasks(id!, derivedProject?.topic || derivedProject?.title || '')} disabled={generating}>
                          {generating ? 'Architecting Blueprint...' : 'Initialize AI Architect'}
                        </button>
                        <button className="btn btn-secondary" style={{ height: '56px' }} onClick={() => setShowPromptInput(false)}>
                          Skip Context
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card" style={{ padding: '6rem 2rem', textAlign: 'center', border: '2px dashed var(--border-color)', background: 'transparent' }}>
                    <Sparkles size={48} color="var(--theme-color)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Core Structure Missing</h3>
                    <p className="text-secondary" style={{ marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>Answer a few quick questions to hydrate this project and generate your structural blueprint.</p>
                    <button className="btn btn-primary" disabled={generating} onClick={() => setIsHydrating(true)}>
                      {generating ? 'Architecting...' : 'Generate Work Blueprint'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Upload bar */}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                >
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {projectFiles.length} file{projectFiles.length !== 1 ? 's' : ''} in this project
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.82rem' }}
                      onClick={() => refreshFiles()}
                      disabled={filesLoading}
                      title="Sync with server"
                    >
                      <Zap size={14} className={filesLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                      disabled={uploadingFile}
                      onClick={() => {
                        if (isMockProject) {
                          setError("File uploads are only available for cloud-synced projects. Please complete setup first.");
                          return;
                        }
                        fileInputRef.current?.click();
                      }}
                    >
                      <UploadCloud size={14} />
                      {uploadingFile ? 'Uploading…' : 'Upload File'}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !id) return;
                      
                      setUploadingFile(true);
                      setError(null);
                      setSuccessMsg(null);
                      
                      try {
                        const res = await api.uploadProjectFile(id, file);
                        setProjectFiles(prev => [res, ...prev]);
                        setSuccessMsg(`Successfully uploaded "${file.name}"`);
                        
                        // Silently refresh activity in background
                        refreshActivity(true);
                        
                        // Clear success message after 4 seconds
                        setTimeout(() => setSuccessMsg(null), 4000);
                      } catch (err: any) {
                        console.error('Upload failed', err);
                        const msg = err.response?.data?.detail || "Connection failed. Please ensure the backend is reachable.";
                        setError(`Upload failed: ${msg}`);
                      } finally {
                        setUploadingFile(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }}
                  />
                </div>

                {successMsg && (
                  <div className="animate-scale-in" style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--accent-green)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Check size={16} /> {successMsg}
                  </div>
                )}

                {filesLoading && (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading files…</div>
                )}

                {!filesLoading && projectFiles.length === 0 && (
                  <div
                    className="card"
                    style={{ padding: '4rem 2rem', textAlign: 'center', border: '2px dashed var(--border-color)', background: 'transparent', cursor: 'pointer' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud size={40} color="var(--theme-color)" style={{ opacity: 0.4, marginBottom: '1rem' }} />
                    <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>No files uploaded yet</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Click or drop a file here to upload your first asset</div>
                  </div>
                )}

                {!filesLoading && projectFiles.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {projectFiles.map((f: any) => {
                      const fmt = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
                      const timeAgo = (ts: string) => {
                        const diff = Date.now() - new Date(ts).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 1) return 'just now';
                        if (mins < 60) return `${mins}m ago`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}h ago`;
                        return `${Math.floor(hrs / 24)}d ago`;
                      };
                      const extColors: Record<string, string> = { pdf: '#ef4444', docx: '#3b82f6', doc: '#3b82f6', zip: '#f59e0b', csv: '#10b981', py: '#8b5cf6', txt: '#6b7280', png: '#ec4899', jpg: '#ec4899', jpeg: '#ec4899' };
                      const color = extColors[f.fileType] || 'var(--theme-color)';
                      return (
                        <div key={f.id} className="card glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          <div style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} style={{ color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.originalName}>
                              {f.originalName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                              {f.fileType?.toUpperCase() || '?'} · {fmt(f.fileSize)} · {f.uploadedBy} · {timeAgo(f.uploadedAt)}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                              <a
                                href={`${API_BASE_URL}/project/${id}/files/${f.id}/download`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: '8px', background: 'color-mix(in srgb, var(--theme-color) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-color) 20%, transparent)', color: 'var(--theme-color)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}
                              >
                                <UploadCloud size={11} /> Download
                              </a>
                              {isAdmin && (
                                <button
                                  onClick={async () => {
                                    if (!id) return;
                                    await api.deleteProjectFile(id, f.id);
                                    setProjectFiles(prev => prev.filter(x => x.id !== f.id));
                                  }}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="animate-fade-in card glass-card" style={{ padding: '2rem', border: '1px solid var(--border-color)' }}>
                {activityLoading && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading activity…</div>
                )}
                {!activityLoading && activityLog.length === 0 && (
                  <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Activity size={36} style={{ opacity: 0.25, marginBottom: '1rem' }} />
                    <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>No activity yet</div>
                    <div style={{ fontSize: '0.875rem' }}>Actions like task updates, file uploads, and member joins will appear here.</div>
                  </div>
                )}
                {!activityLoading && activityLog.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {activityLog.map((act: any, i: number) => {
                      const timeAgo = (ts: string) => {
                        const diff = Date.now() - new Date(ts).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 1) return 'just now';
                        if (mins < 60) return `${mins}m ago`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}h ago`;
                        return `${Math.floor(hrs / 24)}d ago`;
                      };
                      const iconMap: Record<string, { icon: any; color: string }> = {
                        completed: { icon: CheckCircle2, color: 'var(--accent)' },
                        uploaded: { icon: UploadCloud, color: 'var(--theme-color)' },
                        deleted: { icon: FileText, color: 'var(--accent-red)' },
                        joined: { icon: Users, color: '#0ea5e9' },
                        left: { icon: Users, color: 'var(--text-secondary)' },
                        started: { icon: Zap, color: 'var(--accent-yellow)' },
                        claimed: { icon: Zap, color: 'var(--accent-yellow)' },
                        dropped: { icon: Info, color: 'var(--accent-yellow)' },
                        sent: { icon: CheckCircle2, color: 'var(--accent-yellow)' },
                        updated: { icon: Edit3, color: 'var(--text-secondary)' },
                        regenerated: { icon: Sparkles, color: 'var(--accent-purple)' },
                        reset: { icon: Trash2, color: 'var(--accent-red)' },
                        submitted: { icon: UploadCloud, color: 'var(--accent-purple)' },
                        broken_down: { icon: Zap, color: 'var(--accent-yellow)' },
                        created: { icon: Sparkles, color: 'var(--accent-purple)' },
                      };
                      const { icon: Icon, color } = iconMap[act.action] || { icon: Info, color: 'var(--text-secondary)' };
                      return (
                        <div key={act.id} style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
                          {i < activityLog.length - 1 && <div style={{ position: 'absolute', left: '11px', top: '26px', bottom: '-26px', width: '2px', background: 'var(--border-color)' }} />}
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-app)', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, flexShrink: 0 }}>
                            <Icon size={11} color={color} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem' }}>
                              <strong>{act.actor}</strong>{' '}
                              <span style={{ color: 'var(--text-secondary)' }}>{act.action}</span>{' '}
                              <strong>{act.target}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{timeAgo(act.timestamp)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Task Details Sidebar — hidden in lecturer read-only view */}
        {selectedTask && !isReadOnly && (
          <TaskDetails
            taskId={selectedTask.id}
            taskTitle={selectedTask.title}
            onSuccess={() => { setSelectedTask(null); fetchProjectData(); }}
            onCancel={() => setSelectedTask(null)}
            onDeleteTask={handleDeleteTask}
            onClaimTask={handleClaimTask}
          />
        )}


      {/* Share Modal Portal/Overlay */}
      {showShareModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setShowShareModal(false)}>
          <div className="card animate-scale-in" style={{ 
            width: isMobile ? 'calc(100% - 2rem)' : '400px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', 
            padding: isMobile ? '1.5rem' : '2rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div className="flex-between">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Share Project</h2>
              <button className="btn-icon" onClick={() => setShowShareModal(false)}><X size={20} /></button>
            </div>
            
            <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '-0.5rem' }}>
              Share this code with collaborators to let them join <strong>{derivedProject?.title}</strong>.
            </p>

            {/* Join Code Block */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Project Join Code</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.5rem', background: 'var(--bg-app)', borderRadius: '16px', border: '2px dashed var(--border-color)' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '0.25em', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{resolvedJoinCode || '--------'}</span>
                <button
                  className="btn btn-secondary btn-icon"
                  title="Copy code"
                  style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0 }}
                  onClick={() => {
                    navigator.clipboard.writeText(resolvedJoinCode || '');
                    setIsCopiedCode(true);
                    setTimeout(() => setIsCopiedCode(false), 2000);
                  }}
                >
                  {isCopiedCode ? <CheckCircle2 size={18} color="var(--accent-green)" /> : <Copy size={18} />}
                </button>
              </div>
              {isCopiedCode && <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', marginTop: '0.5rem', fontWeight: 600 }}>Code copied!</div>}
            </div>

            {/* Share link row */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Or share a link</div>
              <div style={{ display: 'flex', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.5rem' }}>
                <input type="text" readOnly value={`https://collaborate.app/join/${resolvedJoinCode}`} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '0 0.5rem', outline: 'none', fontSize: '0.8125rem' }} />
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', minWidth: '85px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(`https://collaborate.app/join/${resolvedJoinCode}`);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                >
                  {isCopied ? <CheckCircle2 size={16} color="var(--accent-green)" /> : <Copy size={16} />}
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-icon" title="WhatsApp" style={{ width: '48px', height: '48px', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', border: '1px solid rgba(37, 211, 102, 0.2)', borderRadius: '12px' }} onClick={() => alert('Opening WhatsApp...')}>
                <MessageCircle size={20} />
              </button>
              <button className="btn btn-secondary btn-icon" title="Telegram" style={{ width: '48px', height: '48px', background: 'rgba(0, 136, 204, 0.1)', color: '#0088cc', border: '1px solid rgba(0, 136, 204, 0.2)', borderRadius: '12px' }} onClick={() => alert('Opening Telegram...')}>
                <Send size={20} />
              </button>
              <button className="btn btn-secondary btn-icon" title="Email" style={{ width: '48px', height: '48px', background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', color: 'var(--theme-color)', border: '1px solid color-mix(in srgb, var(--theme-color) 20%, transparent)', borderRadius: '12px' }} onClick={() => alert('Opening Default Mail Client...')}>
                <Mail size={20} />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Members Modal Portal */}
      {showMembersModal && createPortal(
        <>
          <div 
             style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, backdropFilter: 'blur(3px)', transition: 'opacity 0.2s' }}
             onClick={() => setShowMembersModal(false)}
          />
          <div className="card glass-card animate-fade-in" style={{ 
            position: 'fixed', 
            top: 0, 
            right: 0, 
            width: isMobile ? '100%' : '450px', 
            height: '100vh', 
            zIndex: 9999, 
            background: 'var(--bg-app)', 
            borderLeft: '1px solid var(--border-color)', 
            boxShadow: '-10px 0 30px rgba(0,0,0,0.2)', 
            transform: 'translateX(0)', 
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
            padding: '0', 
            overflowY: 'auto', 
            overflowX: 'hidden', 
            border: 'none', 
            borderRadius: '0', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <div style={{ padding: '1.5rem', background: 'color-mix(in srgb, var(--theme-color) 5%, transparent)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Left: title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={20} color="var(--theme-color)" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Project Members</h3>
              </div>
              {/* Right: Invite button (replaces the old close icon slot) */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  cursor: 'pointer', 
                  padding: '0.35rem 0.6rem', 
                  borderRadius: '8px', 
                  background: 'rgba(255,255,255,0.05)', 
                  color: 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  transition: 'all 0.2s',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => {
                  setShowMembersModal(false);
                  setShowShareModal(true);
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Users size={14} /> <span style={{ fontWeight: 600 }}>Invite</span>
              </div>
            </div>

            {/* Search bar */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  className="input-field"
                  style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '2.25rem', fontSize: '0.875rem' }}
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              {(derivedProject?.members ?? []).filter((m: string) => m.toLowerCase().includes(memberSearch.toLowerCase())).map((memberName: string) => {
                const isUserAdmin = derivedProject?.admins?.includes(user?.name);
                const isMemberAdmin = derivedProject?.admins?.includes(memberName);
                const isMemberLecturer = (derivedProject?.lecturerNames ?? []).includes(memberName);

                return (
                  <div key={memberName} className="flex-between" style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isMemberLecturer ? 'linear-gradient(135deg, #0ea5e9, #38bdf8)' : 'linear-gradient(135deg, var(--theme-color), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                        {memberName.charAt(0)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                          {memberName} {memberName === user?.name && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>(You)</span>}
                        </div>
                        {isMemberLecturer ? (
                          <div style={{ fontSize: '0.75rem', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem', fontWeight: 600 }}>
                            <ShieldCheck size={12} /> Lecturer
                          </div>
                        ) : isMemberAdmin && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem', fontWeight: 600 }}>
                            <ShieldCheck size={12} /> Admin
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Only show actions for non-lecturer members the current user can manage */}
                    {isUserAdmin && memberName !== user?.name && !isMemberLecturer && (
                      <div style={{ position: 'relative' }}>
                        <button
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMemberMenu === memberName) {
                               setActiveMemberMenu(null);
                               setMenuPos(null);
                            } else {
                               const rect = e.currentTarget.getBoundingClientRect();
                               setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                               setActiveMemberMenu(memberName);
                            }
                          }}
                        >
                          <MoreVertical size={16} color="var(--text-secondary)" />
                        </button>

                        {activeMemberMenu === memberName && menuPos && createPortal(
                          <div style={{
                            position: 'fixed',
                            right: menuPos.right,
                            top: menuPos.top,
                            marginTop: '0.25rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-lg)',
                            width: '180px',
                            zIndex: 100000,
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0.5rem',
                            gap: '0.25rem'
                          }}>
                            <button
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                background: 'transparent',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                color: isMemberAdmin ? 'var(--accent-red)' : 'var(--text-primary)',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = isMemberAdmin ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-app)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                              onClick={() => {
                                const currentAdmins = derivedProject.admins || [];
                                const newAdmins = isMemberAdmin
                                  ? currentAdmins.filter((a: string) => a !== memberName)
                                  : [...currentAdmins, memberName];
                                derivedProject.admins = newAdmins;
                                mockUpdateProject(derivedProject.id, { admins: newAdmins });
                                setProject((prev: any) => {
                                   if (!prev) return null;
                                   return { ...prev, admins: newAdmins };
                                });
                                setActiveMemberMenu(null);
                              }}
                            >
                              {isMemberAdmin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            <button
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                background: 'transparent',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                color: 'var(--accent-red)',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                              onClick={() => {
                                alert(`Simulating removing ${memberName} from project...`);
                                setActiveMemberMenu(null);
                              }}
                            >
                              Remove User
                            </button>
                          </div>,
                          document.body
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Edit Project Modal */}
      {derivedProject && (
        <EditProjectModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          project={derivedProject}
          isAdmin={isAdmin}
          onSave={async (projectId, updates) => {
            if (!isMockProject) {
              setProject((prev: any) => ({ ...prev, ...updates }));
              try {
                await api.updateProject(projectId, updates);
              } catch (e) {
                console.error('Failed to sync project edits', e);
              }
            }
          }}
          onRegenerateTasks={() => {
            setIsEditModalOpen(false);
            setShowRerunModal(true);
          }}
          onLeave={async () => {
            try {
              await leaveProject(derivedProject.id);
              setIsEditModalOpen(false);
              navigate(isLecturerView ? '/lecturer/courses' : '/app');
            } catch (err: any) {
              alert(err?.response?.data?.detail || 'Could not leave project. Please try again.');
            }
          }}
        />
      )}

      {/* Re-run AI Modal */}
      {derivedProject && (
        <RerunAIModal
          isOpen={showRerunModal}
          onClose={() => setShowRerunModal(false)}
          projectTitle={derivedProject.topic || derivedProject.title || ''}
          isGenerating={generating}
          onSubmit={async ({ description, projectType, deliverable }) => {
            setActiveTab('blueprint');
            // Clear existing backend tasks first
            if (!isMockProject) {
              try { await api.deleteAllProjectTasks(derivedProject.id); } catch {}
              setLocalTasks([]);
            }
            const richContext = `Description: ${description}\nProject Type: ${projectType}\nExpected Deliverable: ${deliverable}`;
            await handleGenerateTasks(derivedProject.id, derivedProject.topic || derivedProject.title || '', richContext);
            setShowRerunModal(false);
          }}
        />
      )}

      </div>
    </div>
  );
};
