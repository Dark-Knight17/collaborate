import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3, Flag, Circle, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useMockData } from '../context/MockDataContext';
import type { Task, TaskStatus, TaskPriority } from '../context/MockDataContext';
import CustomSelect from './shared/CustomSelect';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose, onUpdate }) => {
  const { projects, updateTask } = useMockData();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [deadline, setDeadline] = useState(task.deadline);
  const [assignee, setAssignee] = useState(task.assignees[0] || '');

  const selectedProject = useMemo(() => projects.find(p => p.id === task.projectId), [projects, task.projectId]);
  const members = selectedProject?.members || [];

  const statusOptions = [
    { value: 'todo', label: 'To Do', icon: <Circle size={14} className="text-secondary" /> },
    { value: 'in_progress', label: 'In Progress', icon: <Clock size={14} style={{ color: 'var(--accent-purple)' }} /> },
    { value: 'review', label: 'Review', icon: <Sparkles size={14} style={{ color: 'var(--accent-yellow)' }} /> },
    { value: 'completed', label: 'Completed', icon: <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} /> },
  ];

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

    const updates: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      deadline,
      assignees: assignee ? [assignee] : [],
    };

    if (onUpdate) {
      onUpdate(task.id, updates);
    } else {
      updateTask(task.id, updates);
    }

    onClose();
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
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
  };

  return createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9998, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '560px',
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
        <div style={{ padding: '1.5rem 2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'color-mix(in srgb, var(--theme-color) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
              <Edit3 size={18} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Edit Task</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>Task Name *</label>
            <input
              style={inputStyle}
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <CustomSelect
                options={statusOptions}
                value={status}
                onChange={(val) => setStatus(val as TaskStatus)}
              />
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <CustomSelect
                options={priorityOptions}
                value={priority}
                onChange={(val) => setPriority(val as TaskPriority)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Deadline</label>
              <input type="date" style={inputStyle} value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Assignee</label>
              <CustomSelect
                options={assigneeOptions}
                value={assignee}
                onChange={(val) => setAssignee(val)}
                placeholder="Assign to..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Update Task</button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
};

export default EditTaskModal;
