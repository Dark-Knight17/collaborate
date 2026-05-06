import React, { useState } from 'react';
import { useMockData } from '../context/MockDataContext';
import { ChevronRight, Clock, Plus, CheckCircle, LogIn, X, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { api } from '../api';
import { createPortal } from 'react-dom';

const formatTimeAgo = (isoString: string) => {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

export const DashboardOverview: React.FC = () => {
  const { projects, tasks, user, globalActivity } = useMockData();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dashboard Stats & Filters
  if (!user) return null;

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    try {
      const res = await api.joinProjectByCode(code);
      setJoinSuccess(true);
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinCode('');
        setJoinError(null);
        setJoinSuccess(false);
        window.location.href = `/app/project/${res.project_id}`;
      }, 1200);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setJoinError('No project found with that code. Please double-check and try again.');
      } else {
        setJoinError('Failed to join project. It may already exist or you may already be a member.');
      }
    }
  };
  
  const myTasks = tasks.filter(t => t.assignees.includes(user.name) || t.assignees.includes('Alex'));
  const pendingTasks = myTasks.filter(t => t.status !== 'completed');
  const activeProjectsCount = projects.length;

  return (
    <>
      <CreateProjectModal isOpen={showModal} onClose={() => setShowModal(false)} />
      
      {/* Join Project Modal */}
      {showJoinModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setShowJoinModal(false)}>
          <div className="card animate-scale-in" style={{ width: isMobile ? 'calc(100% - 2rem)' : '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', padding: isMobile ? '1.5rem' : '2rem' }} onClick={e => e.stopPropagation()}>
            <div className="flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'color-mix(in srgb, var(--theme-color) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogIn size={18} color="var(--theme-color)" />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Join a Project</h2>
              </div>
              <button className="btn-icon" onClick={() => setShowJoinModal(false)}><X size={18} /></button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '-0.5rem', lineHeight: 1.6 }}>
              Enter the 8-character join code shared by the project admin.
            </p>

            <div>
              <div style={{ position: 'relative' }}>
                <Hash size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input
                  className="input-field"
                  style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '2.5rem', fontSize: '1.25rem', fontFamily: 'monospace', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value); setJoinError(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  autoFocus
                />
              </div>
              {joinError && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', fontSize: '0.8125rem', color: 'var(--accent-red)' }}>
                  {joinError}
                </div>
              )}
              {joinSuccess && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', fontSize: '0.8125rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                  ✓ Joined! Redirecting...
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowJoinModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={handleJoin}
                disabled={joinCode.trim().length < 6}
              >
                <LogIn size={16} /> Join Project
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* 1. Header & Quick Actions */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: '1.5rem'
        }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Good morning, {user.name.split(' ')[0]}</h1>
            <p className="text-secondary" style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 500 }}>You have {pendingTasks.length} pending research tasks today.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
            <button className="btn btn-secondary" onClick={() => { setShowJoinModal(true); setJoinCode(''); setJoinError(null); setJoinSuccess(false); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', gap: '0.75rem', fontSize: '0.9375rem', width: isMobile ? '100%' : 'auto' }}>
              <LogIn size={20} /> Join Project
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', gap: '0.75rem', fontSize: '0.9375rem', boxShadow: '0 8px 25px color-mix(in srgb, var(--theme-color) 20%, transparent)', width: isMobile ? '100%' : 'auto' }}>
              <Plus size={20} /> Create New Project
            </button>
          </div>
        </div>

        {/* 2. Projects Section (Now on Top) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="flex-between">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {activeProjectsCount === 1 ? 'Active Project' : 'Active Projects'}
                  <span style={{ fontSize: '0.75rem', background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', color: 'var(--theme-color)', padding: '0.25rem 0.625rem', borderRadius: '100px' }}>{activeProjectsCount}</span>
              </h2>
              <button className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }} onClick={() => navigate('/app/projects')}>View All &rarr;</button>
          </div>
          
          <div style={{ 
              display: 'flex', 
              gap: '1.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem'
          }} className="no-scrollbar">
            {projects.length > 0 ? projects.map(project => (
               <div 
                  key={project.id} 
                  className="card glass-card hover-lift" 
                  style={{ cursor: 'pointer', padding: '1.5rem', width: '320px', flex: '0 0 auto' }}
                  onClick={() => navigate(`/app/project/${project.id}`)}
               >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                     <div className="flex-between" style={{ gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', overflow: 'hidden' }}>
                           <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.title}</h3>
                        </div>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                           <ChevronRight size={16} />
                        </div>
                     </div>
                     
                     <div>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                           <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Overall Progress</span>
                           <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--theme-color)' }}>{project.progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '100px', overflow: 'hidden' }}>
                           <div style={{ height: '100%', width: `${project.progress}%`, background: 'var(--theme-color)', borderRadius: '100px', boxShadow: '0 0 10px color-mix(in srgb, var(--theme-color) 40%, transparent)' }}></div>
                        </div>
                     </div>

                     <div className="flex-between">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                           <Clock size={14} /> Due {project.dueDate}
                        </div>
                        <div style={{ display: 'flex' }}>
                           {project.members.slice(0,3).map((m, i) => (
                             <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--theme-color), var(--accent))', border: '2px solid var(--bg-card)', marginLeft: i > 0 ? '-8px' : '0', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                               {m.charAt(0)}
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )) : (
                 <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-app)', borderRadius: '16px', border: '1px dashed var(--border-color)', width: '100%', fontSize: '0.9375rem' }}>
                    No active projects. Click "Create New Project" to get started.
                 </div>
            )}
          </div>
        </section>

        {/* 3. Lower Section: Tasks & Updates Split */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: '2.5rem' }}>
          
          {/* Left Column: Personalized Tasks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '2rem' }}>
              <div className="flex-between" style={{ marginBottom: '2rem' }}>
                 <div>
                   <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Personal Tasks</h2>
                   <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>Assigned to you across all initiatives</p>
                 </div>
                 <button className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/app/tasks')}>Open Task Board &rarr;</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {myTasks.length > 0 ? (
                   <>
                     {/* Most Urgent First */}
                     {myTasks.sort((a, _b) => a.status === 'todo' ? -1 : 1).slice(0, 5).map(task => (
                        <div key={task.id} className="sidebar-link" style={{ padding: '1.25rem', background: 'var(--bg-app)', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ 
                                 width: '24px', 
                                 height: '24px', 
                                 borderRadius: '7px', 
                                 background: task.status === 'completed' ? 'var(--accent)' : 'var(--theme-color)',
                                 display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                              }}>
                                 {task.status === 'completed' ? <CheckCircle size={14} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}></div>}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <h4 style={{ fontSize: '0.9375rem', margin: 0, fontWeight: 700 }}>{task.title}</h4>
                                 <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--theme-color)' }}>{projects.find(p => p.id === task.projectId)?.title}</span>
                              </div>
                           </div>
                           <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: task.status === 'todo' ? 'var(--accent-red)' : 'var(--text-secondary)' }}>Due {task.deadline}</div>
                              <span className="badge" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.7rem' }}>{task.status.replace('_', ' ')}</span>
                           </div>
                        </div>
                     ))}
                     <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem', fontWeight: 700 }} onClick={() => navigate('/app/tasks')}>
                        Manage {myTasks.length} Assigned Tasks
                     </button>
                   </>
                 ) : (
                   <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-app)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                      No personal tasks assigned. Check the global task board.
                   </div>
                 )}
              </div>
            </div>
          </div>

          {/* Right Column: Global Signals / Updates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card glass-card" style={{ padding: '1.5rem 2rem', border: '1px solid var(--border-color)', background: 'color-mix(in srgb, var(--theme-color) 2%, transparent)' }}>
               <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  Project Updates
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }}></div>
               </h2>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  {globalActivity && globalActivity.length > 0 ? globalActivity.slice(0, 5).map((act: any) => (
                      <div key={act.id} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: 'var(--theme-color)', flexShrink: 0 }}>
                              {act.actor ? act.actor[0] : '?'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
                                  <strong>{act.actor}</strong> <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>in {act.projectTitle}</span>
                                  <br />
                                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{act.action} {act.target}</span>
                              </div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.5 }}>{formatTimeAgo(act.timestamp)}</span>
                          </div>
                      </div>
                  )) : (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9375rem', background: 'var(--bg-app)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                          No project updates available.
                      </div>
                  )}
               </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
