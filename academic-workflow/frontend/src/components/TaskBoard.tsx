import React from 'react';
import { api } from '../api';
import { CheckCircle2, Circle, Clock, PlayCircle, ShieldAlert, Sparkles, User } from 'lucide-react';

interface TaskBoardProps {
  tasks: any[];
  onSelectTask: (task: any) => void;
  onRefresh?: () => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onSelectTask, onRefresh }) => {
  const handleClaim = async (taskId: string) => {
    try {
      await api.claimTask(taskId, 'LocalUser');
      onRefresh?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to claim task');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
        case 'pending': return <Circle size={14} />;
        case 'claimed': return <PlayCircle size={14} />;
        case 'submitted': return <Clock size={14} />;
        case 'completed': return <CheckCircle2 size={14} />;
        case 'rejected': return <ShieldAlert size={14} />;
        default: return <Sparkles size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending': return 'var(--accent-purple)';
        case 'claimed': return 'var(--accent-yellow)';
        case 'submitted': return 'var(--accent-purple)';
        case 'completed': return 'var(--accent)';
        case 'rejected': return 'var(--accent-red)';
        default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {tasks.map(task => (
          <div key={task.id} className="card glass-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem', 
            padding: '1.75rem', 
            opacity: task.status === 'completed' ? 0.8 : 1,
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Status Indicator Bar */}
            <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '4px', 
                height: '100%', 
                background: getStatusColor(task.status) 
            }}></div>

            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
              <span className="badge" style={{ 
                background: `${getStatusColor(task.status)}1A`, 
                color: getStatusColor(task.status),
                border: `1px solid ${getStatusColor(task.status)}33`,
                padding: '0.4rem 0.8rem',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}>
                {getStatusIcon(task.status)}
                {task.status.replace('_', ' ')}
              </span>
              {task.priority === 'high' && (
                <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', fontSize: '0.7rem' }}>High Priority</span>
              )}
            </div>
            
            <h4 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 600, lineHeight: 1.4 }}>{task.title}</h4>
            
            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-app)', borderRadius: '12px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '10px', 
                  background: task.assignee ? 'var(--accent-purple)' : 'var(--bg-card-hover)', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: task.assignee ? '#fff' : 'var(--text-secondary)'
                }}>
                  <User size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Member</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{task.assignee || 'Awaiting Claim'}</span>
                </div>
              </div>

              <button 
                className={`btn ${task.status === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                disabled={task.status === 'completed' || task.status === 'submitted'}
                onClick={() => {
                  if (task.status === 'pending') handleClaim(task.id);
                  if (task.status === 'claimed' || task.status === 'rejected') onSelectTask(task);
                }}
                style={{ 
                    width: '100%', 
                    padding: '0.875rem', 
                    boxShadow: task.status === 'pending' ? '0 4px 15px color-mix(in srgb, var(--theme-color) 30%, transparent)' : 'none' 
                }}
              >
                {task.status === 'pending' && 'Claim Contribution'}
                {task.status === 'claimed' && 'Prepare Submission'}
                {task.status === 'submitted' && 'AI Integrity Check...'}
                {task.status === 'completed' && 'Verified & Logged'}
                {task.status === 'rejected' && 'Requires Resubmission'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;
