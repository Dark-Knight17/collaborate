import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckSquare, Flag, Layout } from 'lucide-react';
import { useMockData } from '../context/MockDataContext';
import type { TaskStatus, TaskPriority } from '../context/MockDataContext';
import CustomSelect from './shared/CustomSelect';

interface CreateTaskModalProps {
  defaultStatus?: TaskStatus;
  onClose: () => void;
  onTaskCreated?: (task: any) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ defaultStatus = 'todo', onClose, onTaskCreated }) => {
  const { projects, addTask } = useMockData();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState('');

  const selectedProject = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
  const members = selectedProject?.members || [];

  const projectOptions = projects.map(p => ({ 
    value: p.id, 
    label: p.title,
    icon: <Layout size={14} className="text-secondary" />
  }));

  const priorityOptions = [
    { value: 'low', label: 'Low', icon: <Flag size={14} color="var(--text-secondary)" /> },
    { value: 'medium', label: 'Medium', icon: <Flag size={14} color="var(--accent-yellow)" /> },
    { value: 'high', label: 'High', icon: <Flag size={14} color="var(--accent-red)" /> },
  ];

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...members.map(m => ({ 
      value: m, 
      label: m, 
      icon: <div style={{ 
        width: '20px', 
        height: '20px', 
        borderRadius: '50%', 
        background: 'var(--accent-purple)', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '10px', 
        fontWeight: 700 
      }}>{m[0]}</div> 
    }))
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask = {
      id: `t-${Date.now()}`,
      projectId,
      title: title.trim(),
      description: description.trim(),
      status: defaultStatus,
      priority,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignees: assignee ? [assignee] : [],
    };

    if (onTaskCreated) {
      onTaskCreated(newTask);
    } else {
      addTask(newTask);
    }

    onClose();
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.5rem',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-app)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '0.875rem 1.125rem',
    fontSize: '0.9375rem',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    appearance: 'none' as any,
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9998, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '520px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 9999,
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.75rem 2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'color-mix(in srgb, var(--theme-color) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
              <CheckSquare size={18} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>New Task</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Task Name */}
          <div>
            <label style={labelStyle}>Task Name *</label>
            <input
              style={inputStyle}
              placeholder="e.g. Write literature review"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, height: '100px', resize: 'vertical', lineHeight: 1.6, appearance: undefined }}
              placeholder="Provide context, deliverables, or acceptance criteria..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Project */}
          <div>
            <label style={labelStyle}>Project</label>
            <CustomSelect
              options={projectOptions}
              value={projectId}
              onChange={(val) => { setProjectId(val); setAssignee(''); }}
            />
          </div>

          {/* Priority */}
          <div>
            <label style={labelStyle}>Priority</label>
            <CustomSelect
              options={priorityOptions}
              value={priority}
              onChange={(val) => setPriority(val as TaskPriority)}
            />
          </div>

          {/* Assignee (optional dropdown) */}
          <div>
            <label style={labelStyle}>Assignee <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.75rem' }}>(optional)</span></label>
            <CustomSelect
              options={assigneeOptions}
              value={assignee}
              onChange={(val) => setAssignee(val)}
              placeholder="Assign to..."
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2, boxShadow: '0 4px 20px color-mix(in srgb, var(--theme-color) 35%, transparent)' }}
              disabled={!title.trim()}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
};

export default CreateTaskModal;
