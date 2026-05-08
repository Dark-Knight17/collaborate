import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useMockData } from '../context/MockDataContext';
import { GraduationCap, BookOpen, Eye, EyeOff, Sparkles, X, Copy, Check, ArrowLeft } from 'lucide-react';

type Role = 'student' | 'lecturer';
type ForgotStep = 'email' | 'token';

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

  // ── Forgot Password State ──────────────────────────────
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleForgotSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const data = await api.forgotPassword(forgotEmail);
      if (data.found && data.reset_token) {
        setResetToken(data.reset_token);
        setForgotStep('token');
      } else {
        setForgotError('No account found with that email address.');
      }
    } catch {
      setForgotError('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.');
      return;
    }
    setForgotLoading(true);
    try {
      await api.resetPassword(resetToken, newPassword);
      setResetSuccess(true);
    } catch (err: any) {
      setForgotError(err.response?.data?.detail || 'Invalid or expired token.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(resetToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeForgotModal = () => {
    setShowForgot(false);
    setForgotStep('email');
    setForgotEmail('');
    setForgotError('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setResetSuccess(false);
  };



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
              {!isRegister && (
                <button
                  type="button"
                  id="forgot-password-btn"
                  onClick={() => setShowForgot(true)}
                  style={{ fontSize: '0.82rem', color: themeColor, background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Forgot?
                </button>
              )}
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

      {/* ── Forgot Password Modal ─────────────────────────── */}
      {showForgot && (
        <div
          id="forgot-password-modal"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeForgotModal(); }}
        >
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '28px',
            padding: isMobile ? '1.75rem' : '2.5rem',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 32px 64px rgba(0,0,0,0.12)',
            position: 'relative',
            animation: 'fadeIn 0.25s ease'
          }}>
            {/* Close */}
            <button
              onClick={closeForgotModal}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>

            {resetSuccess ? (
              /* ── Success State ── */
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <Check size={24} style={{ color: 'var(--accent-green)' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Password Reset!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Your password has been updated. You can now sign in with your new credentials.</p>
                <button
                  onClick={closeForgotModal}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '14px', background: themeColor, color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : forgotStep === 'email' ? (
              /* ── Step 1: Enter Email ── */
              <>
                <div style={{ marginBottom: '1.75rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem' }}>Forgot Password</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Enter your account email to generate a reset token.</p>
                </div>
                <form onSubmit={handleForgotSubmitEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 700 }}>Email Address</label>
                    <input
                      id="forgot-email-input"
                      className="input-field"
                      type="email"
                      required
                      placeholder="name@university.edu"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      style={{ padding: '0.875rem 1.125rem', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  {forgotError && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--accent-red)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {forgotError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{ padding: '0.9rem', borderRadius: '14px', background: themeColor, color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.95rem', boxShadow: `0 8px 20px -4px ${themeColor}40` }}
                  >
                    {forgotLoading ? 'Generating Token...' : 'Get Reset Token'}
                  </button>
                </form>
              </>
            ) : (
              /* ── Step 2: Copy Token & Set New Password ── */
              <>
                <button
                  onClick={() => { setForgotStep('email'); setForgotError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem', padding: 0 }}
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem' }}>Reset Your Password</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Your token has been generated below. Enter your new password.</p>
                </div>

                {/* Token Display Box */}
                <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '0.875rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <code style={{ flex: 1, fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>{resetToken}</code>
                  <button
                    id="copy-token-btn"
                    onClick={handleCopyToken}
                    title="Copy token"
                    style={{ flexShrink: 0, background: copied ? 'rgba(16,185,129,0.1)' : 'var(--bg-card)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`, borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', color: copied ? 'var(--accent-green)' : 'var(--text-secondary)', transition: 'all 0.2s' }}
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>

                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 700 }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="new-password-input"
                        className="input-field"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{ padding: '0.875rem 3rem 0.875rem 1.125rem', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 700 }}>Confirm Password</label>
                    <input
                      id="confirm-password-input"
                      className="input-field"
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{ padding: '0.875rem 1.125rem', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  {forgotError && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--accent-red)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {forgotError}
                    </div>
                  )}
                  <button
                    id="reset-password-submit-btn"
                    type="submit"
                    disabled={forgotLoading}
                    style={{ padding: '0.9rem', borderRadius: '14px', background: themeColor, color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.95rem', boxShadow: `0 8px 20px -4px ${themeColor}40`, marginTop: '0.25rem' }}
                  >
                    {forgotLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
