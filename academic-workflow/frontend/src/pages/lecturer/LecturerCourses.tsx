import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../../context/MockDataContext';
import type { Course, CourseGroup } from '../../context/MockDataContext';
import { Plus, BookOpen, Users, Copy, Check, X, Layers, Edit2, Trash2, ExternalLink, Loader, Clock } from 'lucide-react';
import { api } from '../../api';

// ─── Create / Edit Course Modal ─────────────────────────────────────────────
const CourseModal: React.FC<{
  existing?: Course | null;
  onClose: () => void;
  onSave: (data: { title: string; course_code: string; description: string }) => Promise<void>;
}> = ({ existing, onClose, onSave }) => {
  const [title, setTitle] = useState(existing?.title || '');
  const [code, setCode] = useState(existing?.courseCode || '');
  const [desc, setDesc] = useState(existing?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim() || !code.trim()) { setError('Title and course code are required.'); return; }
    setLoading(true);
    try { await onSave({ title: title.trim(), course_code: code.trim().toUpperCase(), description: desc.trim() }); onClose(); }
    catch (e: any) { setError(e.response?.data?.detail || 'Failed to save course.'); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="card glass-card shadow-lg animate-scale-in" style={{ width: '460px', padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>{existing ? 'Edit Course' : 'Create Course'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Course Title *</label>
            <input id="course-title-input" className="input-field" placeholder="e.g. Introduction to Database Systems" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Course Code *</label>
            <input id="course-code-input" className="input-field" placeholder="e.g. CSC301" value={code} onChange={e => setCode(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <textarea className="input-field" placeholder="Brief course description…" value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          </div>
          {error && <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', fontWeight: 500 }}>{error}</div>}
          <button
            id="course-save-btn"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', boxShadow: '0 4px 16px color-mix(in srgb, var(--theme-color) 25%, transparent)' }}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving…' : (existing ? 'Save Changes' : 'Create Course')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Course Groups Modal ─────────────────────────────────────────────────────
const CourseGroupsModal: React.FC<{ course: Course; onClose: () => void }> = ({ course, onClose }) => {
  const { fetchCourseGroups } = useMockData();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [navigatingGroup, setNavigatingGroup] = useState<number | null>(null);
  const [groupError, setGroupError] = useState<number | null>(null);

  useEffect(() => {
    fetchCourseGroups(course.id)
      .then(g => setGroups(g))
      .catch(e => console.error(e))
      .finally(() => setLoadingGroups(false));
  }, [course.id]);

  const handleGroupClick = async (groupNumber: number) => {
    setNavigatingGroup(groupNumber);
    setGroupError(null);
    try {
      const { projectId } = await api.getGroupProject(course.id, groupNumber);
      navigate(`/lecturer/project/${projectId}?viewOnly=true`);
    } catch {
      setGroupError(groupNumber);
      setTimeout(() => setGroupError(null), 3000);
    } finally {
      setNavigatingGroup(null);
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="card animate-scale-in" style={{ width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.15rem' }}>
            <Layers size={20} color="var(--theme-color)" /> {course.title} Groups
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem', flex: 1 }} className="custom-scrollbar">
          {loadingGroups && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '1rem', textAlign: 'center' }}>Loading groups…</div>}
          {!loadingGroups && groups.length === 0 && (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '2rem 1rem', textAlign: 'center', background: 'var(--bg-app)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              No groups assigned yet. Post an announcement with group assignments.
            </div>
          )}
          {groups.map(g => (
            <div
              key={g.id}
              onClick={() => handleGroupClick(g.groupNumber)}
              style={{
                position: 'relative',
                padding: '0.875rem 1rem',
                paddingBottom: (g.projectId && g.progress !== undefined) ? 'calc(0.875rem + 3px)' : '0.875rem',
                borderRadius: '12px',
                background: groupError === g.groupNumber ? 'rgba(239,68,68,0.07)' : 'var(--bg-app)',
                border: groupError === g.groupNumber ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-color)',
                cursor: navigatingGroup === g.groupNumber ? 'wait' : 'pointer',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { if (navigatingGroup !== g.groupNumber) (e.currentTarget as HTMLDivElement).style.borderColor = 'color-mix(in srgb, var(--theme-color) 50%, transparent)'; }}
              onMouseLeave={e => { if (groupError !== g.groupNumber) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Group {g.groupNumber}</div>
                  {g.projectId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Users size={12} /> {g.memberCount} members</span>
                      {g.dueDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: new Date(g.dueDate) < new Date() ? 'var(--accent-red)' : 'inherit' }}>
                          <Clock size={12} /> Due {g.dueDate}
                        </span>
                      )}
                      {g.progress !== undefined && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--theme-color)', marginLeft: '0.2rem' }}>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} /> 
                          {g.progress}% Complete
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', minWidth: '85px', justifyContent: 'flex-end', zIndex: 2 }}>
                    {navigatingGroup === g.groupNumber ? (
                      <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Opening…
                      </div>
                    ) : groupError === g.groupNumber ? (
                      <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>No project yet</span>
                    ) : (
                      <div style={{ color: 'var(--theme-color)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                        <ExternalLink size={12} /> View Project
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Bottom-Edge Progress Bar */}
              {g.projectId && g.progress !== undefined && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(0,0,0,0.03)', borderBottomLeftRadius: '11px', borderBottomRightRadius: '11px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${g.progress}%`, background: 'var(--theme-color)', transition: 'width 0.4s ease' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Course Card ─────────────────────────────────────────────────────────────
const CourseCard: React.FC<{
  course: Course;
  onDelete: () => void;
  onEdit: () => void;
}> = ({ course, onDelete, onEdit }) => {
  const [copied, setCopied] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(course.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {showGroups && <CourseGroupsModal course={course} onClose={() => setShowGroups(false)} />}
      <div className="card glass-card shadow-lg" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}
      >
      {/* Header row */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'color-mix(in srgb, var(--theme-color) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={22} color="var(--theme-color)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--theme-color)', fontWeight: 600, marginTop: '2px' }}>{course.courseCode}</div>
          {course.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.description}</div>}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          <button className="btn-icon" onClick={onEdit} title="Edit course"><Edit2 size={15} /></button>
          <button className="btn-icon" onClick={onDelete} title="Delete course" style={{ color: 'var(--accent-red)' }}><Trash2 size={15} /></button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          <Users size={14} /> {course.studentCount} students
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          <Layers size={14} /> {course.groupCount} groups
        </div>
      </div>

      {/* Join code row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', borderRadius: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Join Code</div>
          <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.1em', color: 'var(--theme-color)' }}>{course.joinCode}</div>
        </div>
        <button
          onClick={copyCode}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.4rem 0.75rem', borderRadius: '8px',
            background: copied ? 'rgba(16,185,129,0.1)' : 'color-mix(in srgb, var(--theme-color) 8%, transparent)',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'color-mix(in srgb, var(--theme-color) 20%, transparent)'}`,
            color: copied ? '#10b981' : 'var(--theme-color)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: 'var(--font-sans)'
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <button
        className="btn"
        onClick={() => setShowGroups(true)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          width: '100%', padding: '0.625rem', borderRadius: '10px',
          background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--theme-color) 20%, transparent)',
          color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem',
          transition: 'all 0.2s', marginTop: '0.25rem'
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--theme-color) 15%, transparent)'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--theme-color) 10%, transparent)'}
      >
        <Layers size={16} /> View Student Groups
      </button>
    </div>
    </>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const LecturerCourses: React.FC = () => {
  const { courses, createCourse, updateCourse, deleteCourse, refreshCourses } = useMockData();
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    refreshCourses();
  }, []);

  const handleSave = async (data: { title: string; course_code: string; description: string }) => {
    if (editingCourse) {
      await updateCourse(editingCourse.id, {
        title: data.title,
        courseCode: data.course_code,
        description: data.description
      });
    } else {
      await createCourse(data);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!window.confirm('Delete this course? This action cannot be undone.')) return;
    try { await deleteCourse(courseId); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      {(showModal || editingCourse) && (
        <CourseModal
          existing={editingCourse}
          onClose={() => { setShowModal(false); setEditingCourse(null); }}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.3rem' }}>Courses</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your courses and share join codes with students.</p>
        </div>
        <button
          id="create-course-btn"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 16px color-mix(in srgb, var(--theme-color) 25%, transparent)', flexShrink: 0 }}
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} /> New Course
        </button>
      </div>

      {/* Grid */}
      {courses.length === 0 ? (
        <div className="card glass-card shadow-sm" style={{ padding: '4rem', textAlign: 'center' }}>
          <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No courses yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Create your first course to get started.</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} /> Create Course
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {courses.map(c => (
            <CourseCard
              key={c.id}
              course={c}
              onDelete={() => handleDelete(c.id)}
              onEdit={() => setEditingCourse(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
