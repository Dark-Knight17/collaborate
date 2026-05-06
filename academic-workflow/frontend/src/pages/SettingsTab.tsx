import React, { useState } from 'react';
import { useMockData } from '../context/MockDataContext';
import { Camera, LogOut, Trash2 } from 'lucide-react';
import { api } from '../api';

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <div 
    onClick={onChange}
    style={{ 
      width: '44px', height: '24px', 
      background: checked ? '#4F46E5' : 'var(--border-color)', 
      borderRadius: '999px', 
      position: 'relative', cursor: 'pointer',
      transition: 'background 0.3s ease',
      flexShrink: 0
    }}
  >
    <div style={{ 
      width: '20px', height: '20px', background: 'white', 
      borderRadius: '50%', position: 'absolute', 
      top: '2px', left: checked ? '22px' : '2px', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
    }} />
  </div>
);

export const SettingsTab: React.FC = () => {
  const { user, updateUserPreferences, toggleTheme, logout, updateUser } = useMockData();
  const [twoFactor, setTwoFactor] = React.useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [passwordSaved, setPasswordSaved] = React.useState(false);

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    try {
      await api.updateProfile({ name, email });
      updateUser({ name, email });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    try {
      const res = await api.uploadAvatar(file);
      if (res.avatarUrl) {
        updateUser({ avatarUrl: res.avatarUrl });
      }
    } catch (err) {
      console.error("Failed to upload avatar", err);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 3000);
    }, 800);
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in" style={{ padding: isMobile ? '0.5rem' : '1rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '3rem' }}>
      
      {/* Profile Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '1rem' : '2rem', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: '1', minWidth: isMobile ? '100%' : '250px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Profile</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Update your personal information and avatar.</p>
        </div>
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', flex: '2', minWidth: isMobile ? '100%' : '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '1rem' : '2rem', marginBottom: isMobile ? '1rem' : '2rem', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={user.avatarUrl} 
                alt="Profile" 
                style={{ width: isMobile ? '80px' : '100px', height: isMobile ? '80px' : '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--border-color)', opacity: avatarLoading ? 0.5 : 1 }} 
              />
              {avatarLoading && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--theme-color)' }}>
                  <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
                </div>
              )}
            </div>
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleFileChange}
              />
              <button 
                className="btn btn-secondary" 
                style={{ marginBottom: '0.5rem', width: isMobile ? '100%' : 'auto' }}
                onClick={handleAvatarClick}
                disabled={avatarLoading}
              >
                <Camera size={16} /> Change Avatar
              </button>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>JPG, GIF or PNG. Max size of 2MB.</div>
            </div>
          </div>
          <div>
            <label style={{display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500}}>Full Name</label>
            <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
            <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSaveProfile} 
              disabled={isUpdating || !name.trim()}
              style={{ padding: '0.75rem 2rem' }}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
            {updateSuccess && (
              <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
                ✓ Changes saved successfully!
              </div>
            )}
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)'}} />

      {/* Security Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '1rem' : '2rem', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: '1', minWidth: isMobile ? '100%' : '250px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Security</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Manage your password and security settings.</p>
        </div>
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', flex: '2', minWidth: isMobile ? '100%' : '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500}}>Current Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
             <div style={{ flex: '1', minWidth: '140px' }}>
               <label style={{display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500}}>New Password</label>
               <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
             </div>
             <div style={{ flex: '1', minWidth: '140px' }}>
               <label style={{display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500}}>Confirm Password</label>
               <input type="password" className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
             </div>
          </div>
          <div style={{ display: 'flex', marginTop: '0.5rem' }}>
             <button className="btn btn-secondary" onClick={handleUpdatePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}>
               {savingPassword ? 'Updating...' : passwordSaved ? 'Updated!' : 'Update Password'}
             </button>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '1rem -1.5rem 0', padding: '1.5rem 1.5rem 0' }} className="flex-between">
            <div>
               <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.25rem', fontWeight: 600 }}>Two-Factor Authentication</h4>
               <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Add an extra layer of security to your account.</p>
            </div>
            <ToggleSwitch checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)'}} />

      {/* Preferences Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '1rem' : '2rem', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: '1', minWidth: isMobile ? '100%' : '250px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Preferences</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Customize your app experience.</p>
        </div>
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', flex: '2', minWidth: isMobile ? '100%' : '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="flex-between">
            <div>
               <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.25rem', fontWeight: 600 }}>Push Notifications</h4>
               <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Receive updates about task assignments and deadlines.</p>
            </div>
            <ToggleSwitch 
              checked={user.preferences.notifications} 
              onChange={() => updateUserPreferences({ notifications: !user.preferences.notifications })} 
            />
          </div>
          
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem -1.5rem 0', padding: '1.5rem 1.5rem 0' }} className="flex-between">
            <div>
               <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.25rem', fontWeight: 600 }}>Dark Mode</h4>
               <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Toggle between light and dark themes.</p>
            </div>
            <ToggleSwitch 
              checked={user.preferences.theme === 'dark'} 
              onChange={toggleTheme} 
            />
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)'}} />

      {/* Danger Zone */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '1rem' : '2rem', flexDirection: isMobile ? 'column' : 'row', marginBottom: '2rem' }}>
        <div style={{ flex: '1', minWidth: isMobile ? '100%' : '250px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trash2 size={20} />
            Danger Zone
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Irreversible account actions.</p>
        </div>
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', flex: '2', minWidth: isMobile ? '100%' : '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div className="flex-between">
            <div>
               <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.25rem', fontWeight: 600 }}>Log Out</h4>
               <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Securely end your current session.</p>
            </div>
            <button className="btn btn-secondary" style={{ color: 'var(--text-primary)' }} onClick={logout}>
              <LogOut size={16} /> Log Out
            </button>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem -1.5rem 0', padding: '1.5rem 1.5rem 0' }} className="flex-between">
            <div>
               <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.25rem', fontWeight: 600, color: 'var(--accent-red)' }}>Delete Account</h4>
               <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Permanently delete your account and all data.</p>
            </div>
            <button className="btn" style={{ background: 'var(--accent-red)', color: 'white', border: 'none' }} onClick={() => { if(window.confirm('Are you sure you want to permanently delete your account?')) logout(); }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
