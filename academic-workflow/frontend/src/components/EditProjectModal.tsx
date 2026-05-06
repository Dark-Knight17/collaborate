import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Sparkles, Trash2, LogOut } from 'lucide-react';
import { useMockData, type Project } from '../context/MockDataContext';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  isAdmin?: boolean;
  onSave?: (projectId: string, updates: Partial<Project>) => void;
  onRegenerateTasks?: () => void;
  onLeave?: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project, isAdmin = false, onSave, onRegenerateTasks, onLeave }) => {
  const { updateProject, deleteProject, courses } = useMockData();
  const [title, setTitle] = useState(project.title || '');
  const [description, setDescription] = useState(project.description || '');
  const [courseCode, setCourseCode] = useState(project.courseCode || '');
  const [dueDate, setDueDate] = useState(project.dueDate || '');
  const [aiTrackingEnabled, setAiTrackingEnabled] = useState(project.aiTrackingEnabled ?? false);
  const [minGrade, setMinGrade] = useState(project.minGrade ?? 65);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(project.title || '');
      setDescription(project.description || '');
      setCourseCode(project.courseCode || '');
      setDueDate(project.dueDate || '');
      setAiTrackingEnabled(project.aiTrackingEnabled ?? false);
      setMinGrade(project.minGrade ?? 65);
    }
  }, [isOpen, project]);

  const handleSave = () => {
    if (!title.trim()) return;

    setSaving(true);

    setTimeout(() => {
      let formattedDesc = description.trim();
      if (formattedDesc) {
        formattedDesc = formattedDesc.charAt(0).toUpperCase() + formattedDesc.slice(1).toLowerCase();
        if (!formattedDesc.endsWith('.')) formattedDesc += '.';
      }

      const updates = { title, description: formattedDesc, courseCode, dueDate, aiTrackingEnabled, minGrade };

      // Update global context
      updateProject(project.id, updates);

      // Update local state if provided
      if (onSave) onSave(project.id, updates);

      setSaving(false);
      onClose();
    }, 400);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      deleteProject(project.id);
      onClose();
    }
  };

  const handleLeave = () => {
    if (window.confirm('Are you sure you want to leave this project? You will lose access to all project content.')) {
      if (onLeave) onLeave();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
      <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '640px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex-between">
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>Edit Project</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Project Title</label>
            <input
              className="input-field"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
            <textarea
              className="input-field"
              style={{ width: '100%', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: courses.length > 0 ? '1fr 1fr' : '1fr', gap: '1rem' }}>
            {courses.length > 0 && (
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Course Code</label>
                <select
                  className="input-field"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={courseCode}
                  onChange={e => setCourseCode(e.target.value)}
                >
                  <option value="">— Select a course —</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.courseCode}>{c.courseCode} · {c.title}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ gridColumn: courses.length > 0 ? 'auto' : '1 / -1' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Due Date</label>
              <input
                type="date"
                className="input-field"
                style={{ width: '100%', boxSizing: 'border-box', color: dueDate ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', background: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} color="var(--accent-purple)" /> Enable AI Tracking
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Check submissions for up to 10% AI usage and auto-reject if exceeded.
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-purple)' }}
                  checked={aiTrackingEnabled}
                  onChange={e => setAiTrackingEnabled(e.target.checked)}
                />
              </label>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                <span>Minimum Passing Grade</span>
                <span style={{ color: 'var(--text-primary)' }}>{minGrade}/100</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                className="input-field"
                style={{ width: '100%', padding: '0', accentColor: 'var(--accent-purple)' }}
                value={minGrade}
                onChange={e => setMinGrade(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {isAdmin ? (
              <button className="btn btn-secondary" onClick={handleDelete} title="Delete Project" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0 1rem', borderRadius: '12px' }}>
                <Trash2 size={18} />
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={handleLeave} title="Leave Project" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0 1rem', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                <LogOut size={18} /> Leave
              </button>
            )}
            {onRegenerateTasks && (
              <button className="btn btn-secondary" onClick={() => { onClose(); onRegenerateTasks(); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)', borderColor: 'color-mix(in srgb, var(--theme-color) 30%, transparent)', whiteSpace: 'nowrap' }}>
                <Sparkles size={16} /> Re-run AI Tasks Distribution
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !title.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
