import React, { useState, useRef } from 'react';
import { Upload, X, ShieldCheck, AlertTriangle, Loader2, FileText, Clock, Flag, Activity, Users, Trash2, Edit3, CheckCircle, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useMockData, type Task } from '../context/MockDataContext';
import EditTaskModal from './EditTaskModal';
import { api } from '../api';

interface TaskDetailsProps {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  taskData?: any;
  onSuccess: () => void;
  onCancel: () => void;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (taskId: string, updates: Partial<Task>) => void;
  onClaimTask?: (taskId: string) => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ taskId, taskTitle, taskDescription, taskData, onSuccess, onCancel, onDeleteTask, onEditTask, onClaimTask }) => {
  const { tasks, projects, claimTask: defaultClaimTask, deleteTask: defaultDelete, updateTask } = useMockData();
  const fullTask = taskData || tasks.find(t => t.id === taskId) || null;
  const project = fullTask ? projects.find(p => p.id === fullTask.projectId) : null;
  const projectName = project?.title || "Project Context";
  const aiTrackingEnabled = project?.aiTrackingEnabled ?? false;
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    ai_percentage: number;
    coherency_score: number;
    relevance_score: number;
    recommendation: string;
    feedback: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanResult(null);
    setErrorMsg(null);
    setProgress(0);

    // Animate progress up to a holding point while waiting for Gemini
    let current = 0;
    const interval = setInterval(() => {
      current += 3;
      if (current <= 70) setProgress(current);
    }, 200);

    try {
      setScanStatus('Uploading & extracting content...');
      
      let result: any = null;

      if (!taskId.startsWith('m-')) {
        // Real task — upload to backend which runs Gemini analysis
        setScanStatus('Running AI integrity scan via Gemini...');
        result = await api.submitTask(taskId, file);
      } else {
        // Demo/mock task — still simulate a scan
        setScanStatus('Extracting text content...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setScanStatus('Running AI integrity scan via Gemini...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        // For mock tasks we still simulate, but make it more honest
        const aiPct = Math.floor(Math.random() * 40);
        const cohScore = Math.floor(Math.random() * 30) + 60;
        const relScore = Math.floor(Math.random() * 40) + 45;
        const rec = aiPct > 30 ? 'reject' : relScore < 55 ? 'manual_review' : 'approve';
        result = {
          success: true,
          ai_percentage: aiPct,
          coherency_score: cohScore,
          relevance_score: relScore,
          recommendation: rec,
          feedback: rec === 'reject'
            ? `This submission for "${taskTitle}" was flagged due to high AI-generated content (${aiPct}%). Please revise to reflect your own original work.`
            : rec === 'manual_review'
            ? `The submission partially addresses the requirements for "${taskTitle}" but lacks depth in key areas. Relevance score of ${relScore}% indicates some content is off-topic.`
            : `The submission for "${taskTitle}" demonstrates good understanding of the task requirements with a relevance score of ${relScore}%.`
        };
      }

      clearInterval(interval);
      setProgress(100);
      setScanStatus('Analysis complete.');
      await new Promise(resolve => setTimeout(resolve, 400));
      setScanning(false);

      // Hard enforcement — don't rely only on Gemini's recommendation
      const isRejected =
        result.recommendation === 'reject' ||
        (result.relevance_score >= 0 && result.relevance_score < 50) ||
        (result.ai_percentage >= 0 && result.ai_percentage > 50 && aiTrackingEnabled);

      if (isRejected) {
        const reason = result.recommendation === 'reject'
          ? result.feedback
          : result.relevance_score < 50
          ? `Relevance score of ${result.relevance_score}% is too low — this submission does not adequately address the task requirements.`
          : `AI content score of ${result.ai_percentage}% exceeds the acceptable threshold. Please resubmit with your own original work.`;
        setErrorMsg(reason);
        setScanResult(result);
        return;
      }

      setScanResult(result);
      updateTask(taskId, { hasSubmittedFile: true, status: 'review', submittedFileName: file.name });
      onSuccess();
    } catch (err) {
      clearInterval(interval);
      setScanning(false);
      setErrorMsg('Failed to connect to the Verification Service. Please try again.');
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      if (onDeleteTask) onDeleteTask(taskId);
      else defaultDelete(taskId);
      onCancel();
    }
  };

  return createPortal(
    <>
      <div 
         style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, backdropFilter: 'blur(3px)', transition: 'opacity 0.2s' }}
         onClick={onCancel}
      />
      <div className="card glass-card animate-fade-in" style={{ position: 'fixed', top: 0, right: 0, width: '450px', height: '100vh', zIndex: 9999, background: 'var(--bg-app)', borderLeft: '1px solid var(--border-color)', boxShadow: '-10px 0 30px rgba(0,0,0,0.2)', transform: 'translateX(0)', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)', padding: '0', overflowY: 'auto', overflowX: 'hidden', border: 'none', borderRadius: '0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', background: 'color-mix(in srgb, var(--theme-color) 5%, transparent)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck size={20} color="var(--accent-purple)" />
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Task Submission</h3>
          </div>
          <button className="btn-icon" onClick={onCancel} disabled={scanning}><X size={18} /></button>
        </div>

        <div style={{ padding: '2rem' }}>
          {fullTask ? (
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }}></div>
                   {projectName}
                </div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', fontWeight: 800, lineHeight: 1.2 }}>{taskTitle}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {taskDescription || fullTask.description || "This task requires comprehensive analysis and preparation of the primary deliverables. Ensure all cross-functional requirements are met, integrating feedback from the latest team sync. The completed documentation must be reviewed against our standard quality guidelines before final submission."}
                </p>

                {fullTask.assignees.length === 0 && (
                  <button 
                    className="btn btn-primary animate-scale-in" 
                    style={{ width: '100%', marginBottom: '2rem', padding: '1rem', fontWeight: 700, borderRadius: '14px', boxShadow: '0 8px 25px color-mix(in srgb, var(--theme-color) 25%, transparent)' }}
                    onClick={() => {
                        if (onClaimTask) onClaimTask(fullTask.id);
                        else defaultClaimTask(fullTask.id);
                    }}
                  >
                    Claim This Task
                  </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <div style={{ width: '120px', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Activity size={16} /> Status
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                            {fullTask.status.replace('_', ' ')}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <div style={{ width: '120px', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Flag size={16} /> Priority
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: fullTask.priority === 'high' ? 'var(--accent-red)' : 'var(--text-primary)', textTransform: 'capitalize' }}>
                            {fullTask.priority}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <div style={{ width: '120px', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={16} /> Assignees
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: fullTask.assignees.length > 0 ? 'var(--text-primary)' : 'var(--accent-purple)' }}>
                            {fullTask.assignees.length > 0 ? fullTask.assignees.join(', ') : 'Unassigned'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <div style={{ width: '120px', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={16} /> Deadline
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {fullTask.deadline}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.625rem' }}>Task Deliverable</h4>
                </div>
            </div>
        ) : (
            <>
                <p className="subtitle" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                    TASK ID: {taskId}
                </p>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700 }}>{taskTitle}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                    {taskDescription || "Confirm project alignment by uploading your findings for AI cross-referencing."}
                </p>
            </>
        )}

        <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
            accept=".pdf,.docx,.py,.png,.jpg,.jpeg"
        />

        {!scanning && !errorMsg ? (
            <div 
                style={{
                    border: fullTask?.hasSubmittedFile ? '2px solid var(--accent-green)' : '2px dashed var(--border-color)',
                    padding: '3.5rem 2rem',
                    textAlign: 'center',
                    borderRadius: '20px',
                    background: fullTask?.hasSubmittedFile ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
                onClick={() => fileInputRef.current?.click()}
                onMouseOver={e => e.currentTarget.style.borderColor = fullTask?.hasSubmittedFile ? 'var(--accent-green)' : 'var(--accent-purple)'}
                onMouseOut={e => e.currentTarget.style.borderColor = fullTask?.hasSubmittedFile ? 'var(--accent-green)' : 'var(--border-color)'}
            >
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', boxShadow: 'var(--shadow-md)', color: fullTask?.hasSubmittedFile ? 'var(--accent-green)' : 'var(--accent-purple)' }}>
                    {fullTask?.hasSubmittedFile ? <CheckCircle size={24} /> : <Upload size={24} />}
                </div>
                <p style={{ color: fullTask?.hasSubmittedFile ? 'var(--accent-green)' : 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {fullTask?.hasSubmittedFile && fullTask.submittedFileName 
                       ? fullTask.submittedFileName 
                       : (fullTask?.hasSubmittedFile ? 'Deliverable Verified' : 'Upload Submission')
                    }
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {fullTask?.hasSubmittedFile ? 'Click to upload a replacement file' : 'PDF, DOCX, Python scripts, or text files'}
                </p>
            </div>
        ) : scanning ? (
            <div style={{ padding: '2rem', background: 'color-mix(in srgb, var(--theme-color) 5%, transparent)', borderRadius: '20px', border: '1px solid color-mix(in srgb, var(--theme-color) 20%, transparent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Loader2 size={18} className="animate-spin" color="var(--accent-purple)" />
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{scanStatus || 'AI Scanning...'}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--accent-purple)' }}>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-purple), var(--accent))', transition: 'width 0.4s ease' }}></div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.875rem', lineHeight: 1.5 }}>
                    Gemini is reading and analyzing your submission against the task requirements. This may take 10-20 seconds.
                </p>
            </div>
        ) : errorMsg ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Rejection Card */}
                <div style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                        <AlertTriangle size={18} color="var(--accent-red)" />
                        <span style={{ fontWeight: 700, color: 'var(--accent-red)', fontSize: '0.9rem' }}>Submission Rejected</span>
                    </div>
                    {/* Score metrics if available */}
                    {scanResult && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                            {[
                                { label: 'AI Content', value: scanResult.ai_percentage, invert: true },
                                { label: 'Coherency', value: scanResult.coherency_score },
                                { label: 'Relevance', value: scanResult.relevance_score },
                            ].map(({ label, value, invert }) => {
                                const color = invert 
                                  ? (aiTrackingEnabled ? (value > 50 ? 'var(--accent-red)' : value > 20 ? '#f59e0b' : 'var(--accent-green)') : 'var(--text-secondary)')
                                  : (value >= 70 ? 'var(--accent-green)' : value >= 50 ? '#f59e0b' : 'var(--accent-red)');
                                return (
                                    <div key={label} style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-app)', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{value}%</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.2rem' }}>{label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{errorMsg}</p>
                </div>
                <button className="btn btn-secondary" onClick={() => { setErrorMsg(null); setScanResult(null); }} style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem' }}>
                    Retry Submission
                </button>
            </div>
        ) : null}

        <div style={{ marginTop: '2.5rem', padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <FileText size={20} color="var(--text-secondary)" />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Submissions are processed by our private AI instance to ensure academic integrity and project alignment.
            </div>
        </div>
        </div>
        
        <div style={{ padding: '0 2rem 2rem 2rem', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <button
                onClick={() => setIsEditing(true)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  color: 'var(--accent-purple)',
                  background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--theme-color) 15%, transparent)',
                  borderRadius: '16px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-color) 15%, transparent)'}
                onMouseOut={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-color) 10%, transparent)'}
            >
                <Edit3 size={18} />
                Edit Details
            </button>

            {/* Drop Task — only when current user is assigned */}
            {fullTask && fullTask.assignees?.includes(taskData?.currentUserName ?? '') && (
              <button
                onClick={async () => {
                  try {
                    await api.dropTask(taskId);
                    onSuccess();
                    onCancel();
                  } catch (err) {
                    console.error('Drop failed', err);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  color: 'var(--accent-yellow)',
                  background: 'rgba(245, 158, 11, 0.07)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: '16px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-sans)'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.07)'}
              >
                <XCircle size={18} />
                Drop Task
              </button>
            )}

            <button
                onClick={handleDelete}
                style={{
                  width: '100%',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  color: 'var(--accent-red)',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  borderRadius: '16px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
            >
                <Trash2 size={18} />
                Delete Task
            </button>
        </div>

        {isEditing && fullTask && (
          <EditTaskModal 
            task={fullTask} 
            onClose={() => setIsEditing(false)} 
            onUpdate={onEditTask || updateTask} 
          />
        )}
      </div>
    </>,
    document.body
  );
};

export default TaskDetails;
