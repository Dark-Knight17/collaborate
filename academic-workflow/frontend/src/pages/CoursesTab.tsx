import React, { useState, useEffect } from 'react';
import { useMockData } from '../context/MockDataContext';
import type { Course } from '../context/MockDataContext';
import {
  BookOpen, Users, Copy, Check, Hash, LogIn,
  X, Layers
} from 'lucide-react';

import { createPortal } from 'react-dom';

// ─── Join Course Modal ────────────────────────────────────────────────────────
const JoinCourseModal: React.FC<{ onClose: () => void; onJoined: (c: Course) => void }> = ({ onClose, onJoined }) => {
  const { joinCourse } = useMockData();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const course = await joinCourse(code.trim().toUpperCase());
      onJoined(course);
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Invalid join code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="card animate-scale-in"
        style={{ width: isMobile ? 'calc(100% - 2rem)' : '420px', padding: isMobile ? '1.5rem' : '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.15rem' }}>
            <LogIn size={20} color="var(--accent-purple)" /> Join a Course
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Enter the join code shared by your lecturer to enrol in a course.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            id="join-course-code-input"
            className="input-field"
            placeholder="e.g. MOD9ZLWV"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            style={{ flex: 1, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em', fontSize: '1rem', textTransform: 'uppercase' }}
            autoFocus
          />
          <button
            id="join-course-submit-btn"
            className="btn btn-primary"
            onClick={handleJoin}
            disabled={loading || !code.trim()}
            style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            {loading ? 'Joining…' : 'Join'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.875rem', fontWeight: 500 }}>
            {error}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ─── Course Card ─────────────────────────────────────────────────────────────
const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(course.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        className="card"
        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem', transition: 'transform 0.2s' }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}
      >
      {/* Header */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={22} color="var(--accent-purple)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: 700, marginTop: '2px' }}>{course.courseCode}</div>
          {course.description && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.description}</div>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          <Users size={13} /> {course.studentCount} students
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          <Layers size={13} /> {course.groupCount} groups
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          <Hash size={13} /> Taught by {course.lecturerName}
        </div>
      </div>

      {/* Join code */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', borderRadius: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Join Code</div>
          <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.1em', color: 'var(--accent-purple)' }}>{course.joinCode}</div>
        </div>
        <button
          onClick={copyCode}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.35rem 0.7rem', borderRadius: '8px',
            background: copied ? 'rgba(16,185,129,0.1)' : 'color-mix(in srgb, var(--theme-color) 8%, transparent)',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'color-mix(in srgb, var(--theme-color) 20%, transparent)'}`,
            color: copied ? '#10b981' : 'var(--accent-purple)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: 'var(--font-sans)'
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

    </div>
    </>
  );
};

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export const CoursesTab: React.FC = () => {
  const { courses, refreshCourses } = useMockData();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinedToast, setJoinedToast] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { refreshCourses(); }, []);

  const handleJoined = (course: Course) => {
    setJoinedToast(`Enrolled in ${course.courseCode} — ${course.title}`);
    setTimeout(() => setJoinedToast(null), 4000);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px' }}>
      {showJoinModal && (
        <JoinCourseModal
          onClose={() => setShowJoinModal(false)}
          onJoined={handleJoined}
        />
      )}

      {/* Toast */}
      {joinedToast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000,
          padding: '0.875rem 1.25rem', borderRadius: '14px',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          color: '#10b981', fontWeight: 600, fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          backdropFilter: 'blur(12px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          <Check size={16} /> {joinedToast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.3rem' }}>My Courses</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Courses you're enrolled in. Expand any card to view announcements from your lecturer.
          </p>
        </div>
        <button
          id="join-course-btn"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, width: isMobile ? '100%' : 'auto' }}
          onClick={() => setShowJoinModal(true)}
        >
          <LogIn size={16} /> Join a Course
        </button>
      </div>

      {/* Empty state */}
      {courses.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No courses yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.75rem' }}>
            Use the join code given by your lecturer to enrol in a course and see their announcements and group assignments.
          </p>
          <button
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setShowJoinModal(true)}
          >
            <LogIn size={16} /> Join a Course
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {courses.map(c => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
};
