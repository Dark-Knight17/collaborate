import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, Bell, LogOut, BookOpen, Megaphone, MessageSquare, ChevronDown, Search, GraduationCap, Users, Menu, X } from 'lucide-react';
import { useMockData } from '../context/MockDataContext';

export const LecturerLayout: React.FC = () => {
  const { user, isLoadingAuth, logout, notifications, markNotificationsAsRead } = useMockData();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (isMobile && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoadingAuth || !user) {
    return (
      <div style={{
        display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center',
        background: '#0c0d10', color: '#fff', fontFamily: 'var(--font-sans)'
      }}>
        Authenticating…
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { to: '/lecturer', label: 'Overview', icon: <LayoutDashboard size={20} />, end: true },
    { to: '/lecturer/courses', label: 'Courses', icon: <BookOpen size={20} /> },
    { to: '/lecturer/students', label: 'Students', icon: <Users size={20} /> },
    { to: '/lecturer/announcements', label: 'Announcements', icon: <Megaphone size={20} /> },
    { to: '/lecturer/notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { to: '/lecturer/messages', label: 'Messages', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)', '--theme-color': 'var(--accent-blue)' } as React.CSSProperties}>
      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <div 
          className={`mobile-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside 
        ref={sidebarRef}
        style={{
          width: '280px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', padding: '1.5rem 0', flexShrink: 0,
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          height: '100%',
          zIndex: 1000,
          transform: isMobile ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          transition: 'transform 0.3s ease-in-out',
          boxShadow: isMobile && isSidebarOpen ? '10px 0 30px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ 
                width: '38px', height: '38px', borderRadius: '10px', 
                background: 'linear-gradient(135deg, var(--accent-blue), color-mix(in srgb, var(--accent-blue) 80%, black))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                padding: '3px'
              }}>
                <img src="/logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'screen' }} alt="Logo" />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontFamily: 'var(--font-sans)', fontWeight: 800, letterSpacing: '-0.75px', margin: 0 }}>
                Collaborate
              </h2>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem',
              padding: '0.2rem 0.6rem', borderRadius: '100px',
              background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-color) 20%, transparent)',
              fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-blue)'
            }}>
              <GraduationCap size={11} /> Lecturer Portal
            </div>
          </div>
          {isMobile && (
            <button className="btn-icon" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 1.5rem' }} />

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 1rem', overflowY: 'auto' }} className="custom-scrollbar">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => isMobile && setIsSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <NavLink
              to="/lecturer/settings"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => isMobile && setIsSidebarOpen(false)}
            >
              <Settings size={20} /> Settings
            </NavLink>
          </div>
        </nav>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: '70px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0 1rem' : '0 2rem', background: 'var(--bg-app)', position: 'relative', zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isMobile && (
              <button className="btn-icon" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={20} />
              </button>
            )}
            <div style={{ position: 'relative', width: isMobile ? '160px' : '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={isMobile ? "Search..." : "Search courses, students…"}
                className="input-field"
                style={{ paddingLeft: '2.75rem', borderRadius: '100px', height: '40px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }} ref={notificationsRef}>
                <button 
                    className="btn-icon" 
                    style={{ position: 'relative' }} 
                    onClick={() => {
                        setShowNotifications(prev => !prev);
                        setShowUserMenu(false);
                    }}
                >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '8px', height: '8px', background: 'var(--accent-red)', borderRadius: '50%'
                    }} />
                )}
                </button>

                {showNotifications && (
                    <div className="card glass-card shadow-lg animate-scale-in" style={{ 
                        position: 'absolute', 
                        top: '50px', 
                        right: 0, 
                        width: '320px', 
                        padding: '1.25rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1rem',
                        zIndex: 1000,
                        border: '1px solid var(--border-color)'
                    }}>
                        <div className="flex-between">
                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Notifications</span>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {unreadCount > 0 && (
                                    <button 
                                        style={{ background: 'none', border: 'none', color: 'var(--theme-color)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                        onClick={markNotificationsAsRead}
                                    >
                                        Mark all as read
                                    </button>
                                )}
                                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setShowNotifications(false); navigate('/lecturer/notifications'); }}>View All Notifications</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.slice(0, 5).map((n) => (
                                    <div 
                                        key={n.id} 
                                        style={{ 
                                            display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', 
                                            borderRadius: '10px', cursor: 'pointer',
                                            background: n.isRead ? 'transparent' : 'color-mix(in srgb, var(--theme-color) 5%, transparent)',
                                            border: '1px solid ' + (n.isRead ? 'transparent' : 'color-mix(in srgb, var(--theme-color) 10%, transparent)')
                                        }} 
                                        className="sidebar-link" 
                                        onClick={() => {
                                            setShowNotifications(false);
                                            if (n.link) navigate(n.link);
                                        }}
                                    >
                                        <div style={{ 
                                            width: '8px', height: '8px', borderRadius: '50%', marginTop: '0.35rem', flexShrink: 0,
                                            background: n.isRead ? 'var(--text-secondary)' : 'var(--theme-color)',
                                            opacity: n.isRead ? 0.3 : 1
                                        }}></div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{n.title}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.description}</span>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{new Date(n.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ height: '32px', width: '1px', background: 'var(--border-color)' }} />

            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '12px' }}
                onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                }}
                className="sidebar-link"
              >
                <img
                  src={user.avatarUrl}
                  alt="User"
                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--border-color)' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', fontWeight: 600 }}>Lecturer Portal</span>
                </div>
                <ChevronDown size={14} color="var(--text-secondary)" style={{ marginLeft: '0.25rem' }} />
              </div>

              {showUserMenu && (
                <div className="card glass-card shadow-lg animate-scale-in" style={{
                  position: 'absolute', top: '55px', right: 0, width: '240px',
                  padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
                  zIndex: 1000, border: '1px solid var(--border-color)'
                }}>
                  <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Profile</div>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
                  <div
                    className="sidebar-link"
                    style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderRadius: '8px', color: 'var(--accent-red)' }}
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Sign Out</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '2rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
