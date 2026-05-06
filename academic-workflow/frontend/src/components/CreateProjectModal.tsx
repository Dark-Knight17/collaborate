import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Layers, BookOpen, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useMockData } from '../context/MockDataContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCourseId?: string;
  initialGroupNumber?: string;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, initialCourseId, initialGroupNumber }) => {
  const navigate = useNavigate();
  const { addProject, user, courses } = useMockData();

  const [newTopic, setNewTopic] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId || '');
  const [groupNumber, setGroupNumber] = useState(initialGroupNumber || '');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedCourseId(initialCourseId || '');
      setGroupNumber(initialGroupNumber || '');
      setNewTopic('');
      setCreateError(null);
    }
  }, [isOpen, initialCourseId, initialGroupNumber]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const showGroupField = !!selectedCourseId;

  const handleCreateProject = async () => {
    if (!newTopic.trim()) return;

    // Naming convention: if group number supplied, prefix title
    let finalTopic = newTopic.trim().split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const parsedGroup = groupNumber.trim() ? parseInt(groupNumber.trim(), 10) : undefined;

    if (selectedCourseId && parsedGroup !== undefined) {
      finalTopic = `Group ${parsedGroup} — ${finalTopic}`;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const data = await api.createProject(
        finalTopic,
        selectedCourseId || undefined,
        parsedGroup
      );

      addProject({
        id: data.project_id,
        title: finalTopic,
        description: '',
        courseCode: selectedCourse?.courseCode || '',
        dueDate: '',
        members: [user?.name || ''],
        admins: [user?.name || ''],
        progress: 0,
        aiTrackingEnabled: false,
        courseId: selectedCourseId || undefined,
        groupNumber: parsedGroup,
      });

      onClose();
      setNewTopic('');
      setSelectedCourseId('');
      setGroupNumber('');
      navigate(`/app/project/${data.project_id}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 409) {
        setCreateError(`⚠️ ${detail || 'That group number already exists in this course. Choose a different group number.'}`);
      } else {
        setCreateError(detail || 'Failed to create project. Is the backend running?');
      }
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(6px)' }}>
      <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.375rem', border: '1px solid var(--border-color)', boxShadow: '0 24px 48px rgba(0,0,0,0.35)', background: 'var(--bg-card)' }}>
        <div className="flex-between">
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>New Project</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Project name */}
        <div>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Project Name *
          </label>
          <input
            id="new-project-name-input"
            className="input-field"
            style={{ width: '100%', boxSizing: 'border-box', fontSize: '1rem', padding: '0.9rem' }}
            placeholder="e.g. Machine Learning in Healthcare"
            value={newTopic}
            onChange={e => setNewTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
            autoFocus
          />
        </div>

        {/* Optional: link to a course — Only show if not provided */}
        {!initialCourseId && courses.length > 0 && (
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              <BookOpen size={13} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
              Link to Course <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
            </label>
            <select
              id="project-course-select"
              className="input-field"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={selectedCourseId}
              onChange={e => { setSelectedCourseId(e.target.value); setGroupNumber(''); setCreateError(null); }}
            >
              <option value="">— No course (standalone project) —</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.courseCode} · {c.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Group number — only shown when a course is chosen AND not provided */}
        {showGroupField && !initialGroupNumber && (
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              <Layers size={13} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
              Group Number
              <span style={{ fontWeight: 400, opacity: 0.6 }}> (unique per course)</span>
            </label>
            <input
              id="project-group-number-input"
              className="input-field"
              style={{ width: '100%', boxSizing: 'border-box' }}
              type="number"
              min={1}
              placeholder="e.g. 3"
              value={groupNumber}
              onChange={e => { setGroupNumber(e.target.value); setCreateError(null); }}
            />
          </div>
        )}

        {/* Info text for linked projects */}
        {selectedCourse && groupNumber && (
          <div style={{ 
            marginTop: '-0.5rem', padding: '0.75rem', borderRadius: '8px', 
            background: 'var(--bg-app)', border: '1px solid var(--border-color)',
            fontSize: '0.8rem', color: 'var(--text-secondary)' 
          }}>
            <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--theme-color)' }} />
            Creating project for <strong>{selectedCourse.courseCode} — Group {groupNumber}</strong>
          </div>
        )}

        {createError && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
            padding: '0.75rem 1rem', borderRadius: '10px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', fontSize: '0.875rem', fontWeight: 500
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            {createError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={creating}>Cancel</button>
          <button
            id="create-project-submit-btn"
            className="btn btn-primary"
            onClick={handleCreateProject}
            disabled={creating || !newTopic.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {creating ? 'Creating...' : <><Sparkles size={15} /> Create Project</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
