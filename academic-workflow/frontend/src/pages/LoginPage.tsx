import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useMockData } from '../context/MockDataContext';
import { GraduationCap, BookOpen, Eye, EyeOff, Sparkles } from 'lucide-react';

type Role = 'student' | 'lecturer';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginUser } = useMockData();

  const [role, setRole] = useState<Role>('student');
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);




  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') as Role;
    const modeParam = params.get('mode');

    if (roleParam === 'student' || roleParam === 'lecturer') {
      setRole(roleParam);
    }
    if (modeParam === 'register') {
      setIsRegister(true);
    } else if (modeParam === 'login') {
      setIsRegister(false);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await api.register({ email, password, name, role });
        const data = await api.login({ email, password });
        loginUser(data.user, data.access_token);
        navigate(data.user.role === 'lecturer' ? '/lecturer' : '/app');
      } else {
        const data = await api.login({ email, password });
        loginUser(data.user, data.access_token);
        navigate(data.user.role === 'lecturer' ? '/lecturer' : '/app');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const themeColor = role === 'lecturer' ? 'var(--accent-blue)' : 'var(--accent-purple)';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-app)',
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.05) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(14, 165, 233, 0.05) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(16, 185, 129, 0.03) 0px, transparent 50%)
      `,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1.5rem 1rem' : '2rem',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Blur Backgrounds */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'var(--accent-purple)', filter: 'blur(120px)', opacity: 0.04, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'var(--accent-blue)', filter: 'blur(120px)', opacity: 0.04, borderRadius: '50%' }} />

      {/* Header Logo */}
      <div style={{ marginBottom: isMobile ? '1.5rem' : '2.5rem', textAlign: 'center', animation: 'fadeIn 0.6s ease' }}>
        <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontFamily: 'var(--font-sans)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>
          <span style={{ color: themeColor }}>Collab</span>orate
        </h2>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Academic Workflow Platform
        </p>
      </div>

      {/* Main Login Card */}
      <div className="animate-fade-in" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        background: 'var(--bg-card)', 
        borderRadius: isMobile ? '24px' : '32px', 
        padding: isMobile ? '1.5rem' : '2.5rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
        border: '1px solid var(--border-color)',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Role Segmented Control */}
        <div style={{ 
          display: 'flex', 
          background: 'var(--bg-app)', 
          padding: '0.4rem', 
          borderRadius: '100px', 
          marginBottom: '2.5rem',
          position: 'relative',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            position: 'absolute',
            top: '0.4rem',
            left: role === 'student' ? '0.4rem' : 'calc(50% + 0.1rem)',
            width: 'calc(50% - 0.5rem)',
            height: 'calc(100% - 0.8rem)',
            background: 'var(--bg-card)',
            borderRadius: '100px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 0,
            border: '1px solid var(--border-color)'
          }} />
          
          <button 
            onClick={() => setRole('student')}
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              border: 'none', 
              background: 'none', 
              color: role === 'student' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 700, 
              fontSize: '0.9rem', 
              cursor: 'pointer',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'color 0.2s'
            }}
          >
            <GraduationCap size={18} /> Student
          </button>
          
          <button 
            onClick={() => setRole('lecturer')}
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              border: 'none', 
              background: 'none', 
              color: role === 'lecturer' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 700, 
              fontSize: '0.9rem', 
              cursor: 'pointer',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'color 0.2s'
            }}
          >
            <BookOpen size={18} /> Lecturer
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '0.5rem' }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
            {isRegister ? 'Join your academic community today.' : 'Sign in to your hub.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isRegister && (
            <div className="animate-fade-in">
              <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Full Name</label>
              <input 
                className="input-field" 
                placeholder="Sarah Jenkins" 
                required 
                value={name} 
                onChange={e => setName(e.target.value)} 
                style={{ padding: '0.875rem 1.125rem', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.9375rem' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Email Address</label>
            <input 
              className="input-field" 
              type="email" 
              placeholder="name@university.edu" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ padding: '0.875rem 1.125rem', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.9375rem' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Password</label>
              {!isRegister && <a href="#" style={{ fontSize: '0.82rem', color: themeColor, textDecoration: 'none', fontWeight: 700 }}>Forgot?</a>}
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                className="input-field" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ padding: '0.875rem 3.5rem 0.875rem 1.125rem', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.9375rem' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={16} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '1.125rem', 
              borderRadius: '16px', 
              background: themeColor, 
              color: '#fff', 
              fontWeight: 800, 
              fontSize: '1rem',
              boxShadow: `0 12px 24px -6px ${themeColor}40`,
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Authenticating...' : (isRegister ? 'Get Started' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.9375rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <button 
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: themeColor, fontWeight: 800, cursor: 'pointer', padding: 0, borderBottom: `2px solid ${themeColor}20` }}
          >
            {isRegister ? 'Sign In' : 'Create One'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: '3rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        &copy; 2026 Collaborate Inc.
      </p>
    </div>
  );
};
