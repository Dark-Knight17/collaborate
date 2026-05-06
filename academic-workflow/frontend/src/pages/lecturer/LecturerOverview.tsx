import React from 'react';
import { useMockData } from '../../context/MockDataContext';
import { BookOpen, Users, Layers, Megaphone, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard: React.FC<{
  label: string; value: string | number; icon: React.ReactNode; color: string; bg: string;
}> = ({ label, value, icon, color, bg }) => (
  <div className="card glass-card shadow-lg" style={{
    padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem',
    borderLeft: `3px solid ${color}`, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default'
  }}
    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'}
    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}
  >
    <div style={{
      width: '52px', height: '52px', borderRadius: '14px',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      {React.cloneElement(icon as React.ReactElement<{ size?: number; color?: string }>, { size: 22, color })}
    </div>
    <div>
      <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

export const LecturerOverview: React.FC = () => {
  const { user, courses, announcements } = useMockData();
  const navigate = useNavigate();

  const totalStudents = courses.reduce((sum, c) => sum + c.studentCount, 0);
  const totalGroups = courses.reduce((sum, c) => sum + c.groupCount, 0);
  const totalAnnouncements = announcements.length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '2rem' }}>
      
      {/* 1. Header & Quick Actions */}
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Good morning, {user?.name?.split(' ')[0]}</h1>
          <p className="text-secondary" style={{ fontSize: '1rem', fontWeight: 500 }}>Here's an overview of your active courses and student activity.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/lecturer/announcements')} style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', gap: '0.75rem', fontSize: '0.9375rem' }}>
            <Megaphone size={20} /> Post Announcement
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/lecturer/courses')} style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', gap: '0.75rem', fontSize: '0.9375rem', boxShadow: '0 8px 25px color-mix(in srgb, var(--theme-color) 20%, transparent)' }}>
            <BookOpen size={20} /> Create Course
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatCard label="Active Courses" value={courses.length} icon={<BookOpen />} color="var(--theme-color)" bg="color-mix(in srgb, var(--theme-color) 10%, transparent)" />
        <StatCard label="Enrolled Students" value={totalStudents} icon={<Users />} color="var(--theme-color)" bg="color-mix(in srgb, var(--theme-color) 10%, transparent)" />
        <StatCard label="Total Groups" value={totalGroups} icon={<Layers />} color="var(--theme-color)" bg="color-mix(in srgb, var(--theme-color) 10%, transparent)" />
        <StatCard label="Announcements" value={totalAnnouncements} icon={<Megaphone />} color="var(--theme-color)" bg="color-mix(in srgb, var(--theme-color) 10%, transparent)" />
      </div>

      {/* Two column lower section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
        {/* Courses summary */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="flex-between">
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Your Courses</h2>
            <button
              onClick={() => navigate('/lecturer/courses')}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
            >
              View All &rarr;
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {courses.length === 0 ? (
            <div className="card glass-card shadow-sm" style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <BookOpen size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <div>No courses yet. Create your first course!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {courses.slice(0, 4).map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-app)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                  }}>
                    <BookOpen size={18} color="var(--theme-color)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.courseCode} · {c.studentCount} students · {c.groupCount} groups</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </section>

        {/* Quick actions */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Quick Actions</h2>
          <div className="card glass-card shadow-md" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Create a new course', sub: 'Set up course details & join code', icon: <BookOpen size={18} color="var(--theme-color)" />, to: '/lecturer/courses', color: 'color-mix(in srgb, var(--theme-color) 10%, transparent)' },
              { label: 'Post an announcement', sub: 'Share updates or assign groups', icon: <Megaphone size={18} color="var(--theme-color)" />, to: '/lecturer/announcements', color: 'color-mix(in srgb, var(--theme-color) 10%, transparent)' },
              { label: 'View student progress', sub: 'Check enrolled groups & projects', icon: <TrendingUp size={18} color="var(--theme-color)" />, to: '/lecturer/courses', color: 'color-mix(in srgb, var(--theme-color) 10%, transparent)' },
            ].map((a, i) => (
              <button
                key={i}
                onClick={() => navigate(a.to)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.875rem 1rem', borderRadius: '12px', background: a.color,
                  border: '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.2s', fontFamily: 'var(--font-sans)'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0)'; }}
              >
                <div style={{ flexShrink: 0 }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.sub}</div>
                </div>
                <ArrowRight size={15} color="var(--text-secondary)" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
