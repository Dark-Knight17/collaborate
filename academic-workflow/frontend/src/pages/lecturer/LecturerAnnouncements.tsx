import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMockData } from '../../context/MockDataContext';
import type { Announcement } from '../../context/MockDataContext';
import { ROOT_URL } from '../../api/config';
import { Megaphone, Plus, X, Users, Trash2, BookOpen, ChevronRight, Clock, Layers, Paperclip, FileText, ExternalLink } from 'lucide-react';

// ─── Post Announcement Modal ──────────────────────────────────────────────────
const PostModal: React.FC<{
  courseId: string;
  onClose: () => void;
  onPosted: () => void;
}> = ({ courseId, onClose, onPosted }) => {
  const { createAnnouncement } = useMockData();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hasGroups, setHasGroups] = useState(false);
  const [numGroups, setNumGroups] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePost = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (hasGroups && (numGroups < 1 || isNaN(numGroups))) { 
      setError('Please enter a valid number of groups.'); return; 
    }

    setLoading(true);
    setError('');
    try {
      const groupPayload = hasGroups
        ? Array.from({ length: numGroups }).map((_, i) => ({
            group_number: i + 1,
            member_names: []
          }))
        : [];

      await createAnnouncement(courseId, {
        title: title.trim(),
        body: body.trim(),
        has_group_assignment: hasGroups,
        groups: groupPayload
      }, file || undefined);
      onPosted();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to post announcement.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="card glass-card shadow-lg animate-scale-in" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.15rem' }}>
            <Megaphone size={20} color="#f59e0b" /> Post Announcement
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Title *</label>
            <input id="ann-title-input" className="input-field" placeholder="e.g. Group Project Assignment — Phase 1" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Message Body</label>
            <textarea
              className="input-field"
              placeholder="Add details about this announcement, instructions, or deadlines…"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Group assignment toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: '12px', background: hasGroups ? 'color-mix(in srgb, var(--theme-color) 6%, transparent)' : 'var(--bg-app)', border: `1px solid ${hasGroups ? 'color-mix(in srgb, var(--theme-color) 20%, transparent)' : 'var(--border-color)'}`, transition: 'all 0.2s' }}>
            <input
              type="checkbox"
              id="toggle-groups"
              checked={hasGroups}
              onChange={e => setHasGroups(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-purple)' }}
            />
            <label htmlFor="toggle-groups" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={15} color="var(--accent-purple)" />
              Include Group Assignment
            </label>
          </div>

          {/* Groups */}
          {hasGroups && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Number of Groups
              </label>
              <input
                className="input-field"
                type="number"
                min={1}
                value={numGroups || ''}
                onChange={e => setNumGroups(parseInt(e.target.value, 10))}
                placeholder="e.g. 5"
              />
            </div>
          )}

          {/* File Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Attachments (PDF, DOCX, XLSX, etc.)</label>
            <div 
              style={{ 
                border: '1px dashed var(--border-color)', 
                borderRadius: '12px', 
                padding: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: file ? 'rgba(var(--theme-rgb), 0.03)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                <button className="btn btn-secondary" style={{ pointerEvents: 'none', height: '36px', fontSize: '0.8rem' }}>
                  <Paperclip size={14} /> {file ? 'Change File' : 'Choose File'}
                </button>
                <input 
                  type="file" 
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  accept=".pdf,.docx,.xlsx,.xls,.doc,.txt"
                />
              </div>
              {file && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  <FileText size={14} color="var(--theme-color)" />
                  {file.name}
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '2px' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
              {!file && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No file selected</span>}
            </div>
          </div>

          {error && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', boxShadow: '0 4px 16px color-mix(in srgb, var(--theme-color) 25%, transparent)', marginTop: '0.25rem' }}
            onClick={handlePost}
            disabled={loading}
          >
            <Megaphone size={15} /> {loading ? 'Posting…' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Announcement Card ────────────────────────────────────────────────────────
const AnnouncementCard: React.FC<{ ann: Announcement; now: number; onDelete: () => void }> = ({ ann, now, onDelete }) => {
  const timeAgo = (ts: string) => {
    const diff = now - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="card" style={{ padding: '1.375rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{ann.title}</span>
            {ann.hasGroupAssignment && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.55rem', borderRadius: '100px', background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-color) 20%, transparent)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                <Layers size={10} /> Group Assignment
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
            <Clock size={12} /> {timeAgo(ann.timestamp)}
          </div>
        </div>
        <button className="btn-icon" onClick={onDelete} style={{ color: 'var(--accent-red)', flexShrink: 0 }} title="Delete"><Trash2 size={15} /></button>
      </div>

      {ann.body && (
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ann.body}</p>
      )}

      {ann.files && ann.files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem' }}>
          {ann.files.map(f => (
            <div 
              key={f.id}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem', 
                padding: '0.5rem 0.75rem', 
                borderRadius: '8px', 
                background: 'var(--bg-app)', 
                border: '1px solid var(--border-color)',
                fontSize: '0.82rem'
              }}
            >
              <FileText size={14} color="var(--theme-color)" />
              <span style={{ fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.originalName}</span>
              <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '0.4rem' }}>
                <a 
                  href={`${ROOT_URL}/uploads/announcements/${f.filename}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-icon"
                  style={{ width: '24px', height: '24px', color: 'var(--theme-color)' }}
                  title="View"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export const LecturerAnnouncements: React.FC = () => {
  const { courses, announcements, fetchCourseAnnouncements, deleteAnnouncement, refreshCourses } = useMockData();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [loadingAnns, setLoadingAnns] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { refreshCourses(); }, []);

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) return;
    
    let isMounted = true;
    const load = async () => {
      setLoadingAnns(true);
      try {
        await fetchCourseAnnouncements(selectedCourseId);
      } finally {
        if (isMounted) setLoadingAnns(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [selectedCourseId]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const courseAnnouncements = announcements.filter(a => a.courseId === selectedCourseId);

  const handleDelete = async (annId: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try { await deleteAnnouncement(selectedCourseId, annId); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', height: '100%', gap: '1.5rem' }}>
      {showModal && selectedCourseId && (
        <PostModal
          courseId={selectedCourseId}
          onClose={() => setShowModal(false)}
          onPosted={() => fetchCourseAnnouncements(selectedCourseId)}
        />
      )}

      {/* ── Sidebar: Course List ── */}
      <div className="card" style={{ width: '280px', display: 'flex', flexDirection: 'column', padding: '1.25rem 0', flexShrink: 0 }}>
        <h3 style={{ padding: '0 1.25rem 0.875rem', borderBottom: '1px solid var(--border-color)', margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
          Your Courses
        </h3>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {courses.length === 0 && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No courses yet
            </div>
          )}
          {courses.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedCourseId(c.id)}
              style={{
                padding: '0.875rem 1.25rem', cursor: 'pointer',
                background: selectedCourseId === c.id ? 'var(--bg-app)' : 'transparent',
                borderLeft: selectedCourseId === c.id ? '3px solid var(--theme-color)' : '3px solid transparent',
                transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{c.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--theme-color)', fontWeight: 600 }}>{c.courseCode}</div>
              </div>
              <ChevronRight size={15} color="var(--text-secondary)" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Main: Announcements Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
        {!selectedCourse ? (
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', opacity: 0.5 }}>
            <BookOpen size={40} />
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>Select a course to view announcements</div>
          </div>
        ) : (
          <>
            {/* Course header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.3px' }}>{selectedCourse.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '5px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--theme-color)', fontWeight: 600 }}>{selectedCourse.courseCode}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Users size={12} style={{ verticalAlign: 'middle' }} /> {selectedCourse.studentCount} students</span>
                </div>
              </div>
              <button
                id="post-announcement-btn"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 16px color-mix(in srgb, var(--theme-color) 25%, transparent)' }}
                onClick={() => setShowModal(true)}
              >
                <Plus size={16} /> Post Announcement
              </button>
            </div>

            {/* Announcements feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loadingAnns && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading…</div>
              )}
              {!loadingAnns && courseAnnouncements.length === 0 && (
                <div className="card glass-card shadow-sm" style={{ padding: '3rem', textAlign: 'center' }}>
                  <Megaphone size={40} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                  <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>No announcements yet</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Post an announcement to share updates or assign groups.</div>
                </div>
              )}
              {courseAnnouncements.map(ann => (
                <AnnouncementCard
                  key={ann.id}
                  ann={ann}
                  now={now}
                  onDelete={() => handleDelete(ann.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
