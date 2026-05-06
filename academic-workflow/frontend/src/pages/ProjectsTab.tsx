import React, { useState } from 'react';
import { useMockData } from '../context/MockDataContext';
import { Plus, Search, Filter, LayoutGrid, List as ListIcon, Clock, Users, ArrowRight, Sparkles, Hash, X, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { createPortal } from 'react-dom';

export const ProjectsTab: React.FC = () => {
  const { projects, user } = useMockData();
  const navigate = useNavigate();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleJoin = async () => {
    if (!user) return;
    const code = joinCode.trim().toUpperCase();
    
    try {
      const res = await api.joinProjectByCode(code);
      setJoinSuccess(true);
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinCode('');
        setJoinError(null);
        setJoinSuccess(false);
        // Force reload by navigating to the newly joined project
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

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <CreateProjectModal isOpen={showModal} onClose={() => setShowModal(false)} />

      {/* Join Project Modal */}
      {showJoinModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setShowJoinModal(false)}>
          <div className="card animate-scale-in" style={{ width: isMobile ? 'calc(100% - 2rem)' : '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', padding: isMobile ? '1.5rem' : '2rem' }} onClick={e => e.stopPropagation()}>
            <div className="flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'color-mix(in srgb, var(--theme-color) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogIn size={18} color="var(--accent-purple)" />
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

      <div className="flex-between" style={{ alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>Projects</h1>
          <p className="text-secondary" style={{ fontSize: isMobile ? '0.9rem' : '1.1rem' }}>Manage and track your active research and projects.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
          <button 
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
            onClick={() => { setShowJoinModal(true); setJoinCode(''); setJoinError(null); setJoinSuccess(false); }}
          >
            <LogIn size={16} /> Join Project
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowModal(true)}
            style={{ padding: '0.875rem 1.5rem', boxShadow: '0 4px 20px color-mix(in srgb, var(--theme-color) 40%, transparent)', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
          >
            <Plus size={20} /> New Project
          </button>
        </div>
      </div>

      <div className="flex-between" style={{ 
        background: 'var(--bg-card)', 
        padding: '0.75rem', 
        borderRadius: '16px', 
        border: '1px solid var(--border-color)', 
        boxShadow: 'var(--shadow-sm)',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '1rem',
        alignItems: 'stretch'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: isMobile ? '100%' : '900px' }}>
          <div style={{ position: 'relative', flex: 2 }}>
            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              className="input-field" 
              placeholder="Filter projects..." 
              style={{ paddingLeft: '3.25rem', background: 'var(--bg-app)', border: 'none' }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {!isMobile && (
            <button className="btn btn-secondary" style={{ background: 'var(--bg-app)', border: 'none' }} onClick={() => alert('Advanced filtering options coming soon!')}>
              <Filter size={18} /> Refine
            </button>
          )}
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-color)', justifyContent: 'center' }}>
          <button 
            className="btn-icon" 
            onClick={() => setView('grid')}
            style={{ 
              background: view === 'grid' ? 'var(--bg-card)' : 'transparent', 
              color: view === 'grid' ? 'var(--accent-purple)' : 'var(--text-secondary)',
              boxShadow: view === 'grid' ? 'var(--shadow-sm)' : 'none',
              borderRadius: '8px',
              flex: isMobile ? 1 : 'none'
            }}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            className="btn-icon" 
            onClick={() => setView('list')}
            style={{ 
              background: view === 'list' ? 'var(--bg-card)' : 'transparent', 
              color: view === 'list' ? 'var(--accent-purple)' : 'var(--text-secondary)',
              boxShadow: view === 'list' ? 'var(--shadow-sm)' : 'none',
              borderRadius: '8px',
              flex: isMobile ? 1 : 'none'
            }}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {filteredProjects.map(project => (
            <div 
              key={project.id} 
              className="card glass-card shadow-lg" 
              style={{ 
                cursor: 'pointer', 
                border: '1px solid var(--border-color)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
              }} 
              onClick={() => navigate(`/app/project/${project.id}`)}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'var(--accent-purple)';
              }}
               onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} 
                onClick={() => navigate(`/app/project/${project.id}`)}
              />
              
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '1.5rem', zIndex: 2 }}>
                <Sparkles size={16} color="var(--accent-purple)" style={{ opacity: 0.3 }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600 }}>
                    {project.progress}% <ArrowRight size={14} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{project.title}</h3>
                <p className="text-secondary line-clamp-3" style={{ fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
                    {project.description}
                </p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Progress Bar */}
                <div style={{ height: '6px', background: 'var(--bg-app)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${project.progress}%`, background: 'linear-gradient(90deg, var(--accent-purple), var(--accent))', borderRadius: '100px' }}></div>
                </div>

                <div className="flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                            <Clock size={14} /> <span>{project.dueDate}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                            <Users size={14} /> <span>{project.members.length}</span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', overflow: 'hidden' }}>
                    {project.members.slice(0, 3).map((m, i) => (
                        <div key={i} style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '10px', 
                            background: 'linear-gradient(135deg, var(--theme-color), var(--accent))', 
                            border: '2px solid var(--bg-card)', 
                            marginLeft: i > 0 ? '-10px' : 0, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#fff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                        {m.charAt(0)}
                        </div>
                    ))}
                    {project.members.length > 3 && (
                        <div style={{ width: '28px', height: '28px', borderRadius: '10px', background: 'var(--bg-app)', border: '2px solid var(--bg-card)', marginLeft: '-10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            +{project.members.length - 3}
                        </div>
                    )}
                    </div>
                </div>

                {/* Join Button removed from cards per feedback */}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Project Name</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Team</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Analysis Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => (
                <tr 
                    key={project.id} 
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s ease' }} 
                    onClick={() => navigate(`/app/project/${project.id}`)}
                    onMouseOver={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-color) 3%, transparent)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                   <td style={{ padding: '1.5rem 2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{project.title}</span>
                            <span className="line-clamp-2" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{project.description}</span>
                        </div>
                   </td>
                   <td style={{ padding: '1.5rem 2rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <Users size={14} color="var(--text-secondary)" />
                           <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{project.members.length} Members</span>
                       </div>
                   </td>
                   <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '120px', height: '6px', background: 'var(--bg-app)', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{ width: `${project.progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-purple), var(--accent))', borderRadius: '100px' }}></div>
                          </div>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{project.progress}%</span>
                      </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
