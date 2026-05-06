import React from 'react';
import { useMockData } from '../../context/MockDataContext';
import { Moon, Sun, Bell, BellOff, GraduationCap, Mail } from 'lucide-react';

export const LecturerSettings: React.FC = () => {
  const { user, toggleTheme, updateUserPreferences } = useMockData();
  if (!user) return null;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.3rem' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your account and preferences.</p>
      </div>

      {/* Profile card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Profile</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img src={user.avatarUrl} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid color-mix(in srgb, var(--theme-color) 30%, transparent)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '3px' }}>
              <Mail size={13} /> {user.email}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '6px',
              padding: '0.2rem 0.65rem', borderRadius: '100px',
              background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-color) 20%, transparent)',
              fontSize: '0.72rem', fontWeight: 700, color: 'var(--theme-color)'
            }}>
              <GraduationCap size={11} /> Lecturer
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Appearance</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user.preferences.theme === 'dark' ? <Moon size={20} color="var(--theme-color)" /> : <Sun size={20} color="#f59e0b" />}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Theme</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{user.preferences.theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={toggleTheme}
            style={{ gap: '0.4rem', padding: '0.5rem 1rem' }}
          >
            {user.preferences.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            Switch to {user.preferences.theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Notifications</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user.preferences.notifications ? <Bell size={20} color="var(--theme-color)" /> : <BellOff size={20} color="var(--text-secondary)" />}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Push Notifications</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {user.preferences.notifications ? 'Receiving all alerts' : 'Notifications are muted'}
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => updateUserPreferences({ notifications: !user.preferences.notifications })}
            style={{
              padding: '0.5rem 1rem',
              color: user.preferences.notifications ? 'var(--accent-red)' : 'var(--text-primary)'
            }}
          >
            {user.preferences.notifications ? 'Mute' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
};
