import React, { useMemo } from 'react';
import { useMockData } from '../context/MockDataContext';
import { Bell, CheckCircle2, Clock, Info, AlertTriangle, XCircle, MoreVertical, CheckCheck, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return <CheckCircle2 size={18} color="#10b981" />;
    case 'warning': return <AlertTriangle size={18} color="#f59e0b" />;
    case 'error': return <XCircle size={18} color="#ef4444" />;
    default: return <Info size={18} color="var(--theme-color)" />;
  }
};

const getBg = (type: string) => {
  switch (type) {
    case 'success': return 'rgba(16, 185, 129, 0.08)';
    case 'warning': return 'rgba(245, 158, 11, 0.08)';
    case 'error': return 'rgba(239, 68, 68, 0.08)';
    default: return 'color-mix(in srgb, var(--theme-color) 8%, transparent)';
  }
};

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationsAsRead, user } = useMockData();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: 800, letterSpacing: '-0.75px', margin: 0 }}>Notifications</h1>
            {unreadCount > 0 && (
              <span style={{ 
                padding: '0.2rem 0.6rem', borderRadius: '100px', 
                background: 'var(--accent-red)', color: '#fff', 
                fontSize: '0.75rem', fontWeight: 700 
              }}>
                {unreadCount} new
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Stay updated with real-time activity across your projects and courses.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
            onClick={markNotificationsAsRead}
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        {sortedNotifications.length === 0 ? (
          <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-app)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
              color: 'var(--text-secondary)', opacity: 0.5
            }}>
              <Bell size={40} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>All caught up!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No new notifications to show right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sortedNotifications.map((n, idx) => (
              <div 
                key={n.id} 
                className="table-row-hover"
                style={{ 
                  padding: isMobile ? '1rem' : '1.5rem', 
                  display: 'flex', 
                  gap: isMobile ? '0.75rem' : '1.25rem', 
                  alignItems: 'flex-start',
                  borderBottom: idx === sortedNotifications.length - 1 ? 'none' : '1px solid var(--border-color)',
                  background: n.isRead ? 'transparent' : 'color-mix(in srgb, var(--theme-color) 3%, transparent)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  cursor: n.link ? 'pointer' : 'default',
                  flexDirection: isMobile ? 'column' : 'row'
                }}
                onClick={() => n.link && navigate(n.link)}
              >
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%', alignItems: 'flex-start' }}>
                {!n.isRead && (
                  <div style={{ 
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', 
                    background: 'var(--theme-color)', borderRadius: '0 4px 4px 0' 
                  }} />
                )}

                <div style={{ 
                  width: '44px', height: '44px', borderRadius: '12px', 
                  background: getBg(n.type),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {getIcon(n.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {n.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, flexShrink: 0 }}>
                      <Clock size={12} /> {new Date(n.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <p style={{ 
                    margin: 0, fontSize: '0.925rem', lineHeight: '1.5',
                    color: n.isRead ? 'color-mix(in srgb, var(--text-secondary) 70%, transparent)' : 'var(--text-secondary)'
                  }}>
                    {n.description}
                  </p>
                  
                  {n.link && (
                    <div style={{ 
                      marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', 
                      fontSize: '0.8rem', fontWeight: 700, color: 'var(--theme-color)' 
                    }}>
                      View Details <ChevronRight size={14} />
                    </div>
                  )}
                </div>

                {!isMobile && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon" style={{ opacity: 0.4 }} onClick={(e) => { e.stopPropagation(); /* Delete logic */ }}>
                      <Trash2 size={16} />
                    </button>
                    <button className="btn-icon" style={{ opacity: 0.4 }}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Info size={20} color="var(--theme-color)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Notification Settings</div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            You can manage how and when you receive these alerts in your <span style={{ color: 'var(--theme-color)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate(user?.role === 'lecturer' ? '/lecturer/settings' : '/app/settings')}>Account Settings</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
