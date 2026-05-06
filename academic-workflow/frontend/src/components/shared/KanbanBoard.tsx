import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMockData } from '../../context/MockDataContext';
import type { Task, TaskStatus } from '../../context/MockDataContext';
import { Clock, MoreVertical, Plus, User, CheckCircle2, ChevronRight, Upload, Edit3, Wand2 } from 'lucide-react';
import CreateTaskModal from '../CreateTaskModal';
import EditTaskModal from '../EditTaskModal';

interface KanbanBoardProps {
  tasks: any[];
  onTaskClick?: (taskId: string) => void;
  showProjectName?: boolean;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onAssigneeChange?: (taskId: string, assignees: string[]) => void;
  onClaimTask?: (taskId: string) => void;
  onClaimSuccess?: (taskId: string, status: string, assignees: string[]) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (taskId: string, updates: any) => void;
  onCreateTask?: (task: any) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks, onTaskClick, showProjectName,
  onStatusChange, onAssigneeChange, onClaimSuccess, onDeleteTask, onEditTask, onCreateTask
}) => {
  const { 
    updateTaskStatus: defaultUpdateStatus, 
    projects, 
    user,
    claimTask: defaultClaim, 
    breakDownTask,
    deleteTask: defaultDelete,
    addTask: defaultAddTask
  } = useMockData();

  const handleUpdateStatus = (taskId: string, status: TaskStatus) => {
    if (onStatusChange) onStatusChange(taskId, status);
    else defaultUpdateStatus(taskId, status);
  };

  const handleClaim = async (taskId: string) => {
    try {
      const res = await import('../../api').then(m => m.api.claimTask(taskId));
      // Use onClaimSuccess to update state WITHOUT triggering PATCH requests
      // (onStatusChange/onAssigneeChange both fire PATCH which logs redundant "updated" entries)
      if (onClaimSuccess) {
        onClaimSuccess(taskId, res.status, res.assignees ?? []);
      } else if (!onStatusChange && !onAssigneeChange) {
        defaultClaim(taskId); // mock context fallback
      } else {
        // Fallback for boards without onClaimSuccess
        if (onStatusChange && res.status) onStatusChange(taskId, res.status);
        if (onAssigneeChange) onAssigneeChange(taskId, res.assignees ?? []);
      }
    } catch (err) {
      console.error('Claim task failed', err);
    }
  };

  const handleDrop = async (taskId: string) => {
    try {
      const res = await import('../../api').then(m => m.api.dropTask(taskId));
      if (onClaimSuccess) {
        onClaimSuccess(taskId, res.status, res.assignees ?? []);
      } else {
        if (onStatusChange && res.status) onStatusChange(taskId, res.status);
        if (onAssigneeChange) onAssigneeChange(taskId, res.assignees ?? []);
      }
    } catch (err) {
      console.error('Drop task failed', err);
    }
  };

  const handleDelete = (taskId: string) => {
    if (onDeleteTask) onDeleteTask(taskId);
    else defaultDelete(taskId);
  };

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
  const [createTaskForStatus, setCreateTaskForStatus] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [breakingDownTaskId, setBreakingDownTaskId] = useState<string | null>(null);
  const menuBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const handleClickOutside = () => { setActiveDropdown(null); setDropdownPos(null); };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'var(--text-secondary)' },
    { id: 'in_progress', label: 'Processing', color: 'var(--accent-purple)' },
    { id: 'review', label: 'Review', color: 'var(--accent-yellow)' },
    { id: 'completed', label: 'Completed', color: 'var(--accent)' }
  ];

  return (
    <>
    <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1.5rem', minHeight: '600px', alignItems: 'flex-start' }}>
      {columns.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.id);
        
        return (
          <div key={col.id} style={{ 
            flex: '1 0 320px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.25rem', 
            background: 'var(--bg-app)', 
            padding: '1.25rem', 
            borderRadius: '24px', 
            border: '1px solid var(--border-color)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div className="flex-between" style={{ padding: '0 0.25rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color, boxShadow: `0 0 10px ${col.color}66` }}></div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>{col.label}</h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '0.2rem 0.6rem', borderRadius: '100px' }}>{columnTasks.length}</span>
               </div>
               <button
                 className="btn-icon"
                 style={{ padding: '0.4rem', borderRadius: '10px', background: 'var(--bg-card)' }}
                 onClick={(e) => { e.stopPropagation(); setCreateTaskForStatus(col.id); }}
               >
                 <Plus size={14} />
               </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {columnTasks.map(task => (
                 <div 
                   key={task.id} 
                   className="card glass-card shadow-sm" 
                   style={{ 
                     padding: '1.25rem', 
                     cursor: 'pointer', 
                     border: '1px solid var(--border-color)',
                     transition: 'transform 0.2s ease, border-color 0.2s ease',
                     background: 'var(--bg-card)',
                     position: 'relative',
                     overflow: 'hidden'
                   }}
                   onClick={() => onTaskClick?.(task.id)}
                   onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
                   onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    {breakingDownTaskId === task.id && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'var(--bg-card)', opacity: 0.9,
                        zIndex: 10,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Wand2 size={24} color="var(--accent-purple)" className="animate-pulse" style={{ marginBottom: '0.5rem' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-purple)' }}>Breaking down...</span>
                      </div>
                    )}
                    <div className="flex-between" style={{ marginBottom: '1rem', position: 'relative' }}>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                         <span className="badge" style={{ 
                             background: task.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : task.priority === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-app)', 
                             color: task.priority === 'high' ? 'var(--accent-red)' : task.priority === 'medium' ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                             fontSize: '0.65rem',
                             fontWeight: 800,
                             textTransform: 'capitalize'
                         }}>
                           {task.priority}
                         </span>
                       </div>
                       {(onDeleteTask || onEditTask || onStatusChange) && (<>
                       <button 
                           ref={el => { menuBtnRefs.current[task.id] = el; }}
                           className="btn-icon" 
                           style={{ borderRadius: '10px' }}
                           onClick={(e) => { 
                             e.stopPropagation();

                             if (activeDropdown === task.id) {
                               setActiveDropdown(null);
                               setDropdownPos(null);
                             } else {
                               const btn = menuBtnRefs.current[task.id];
                               if (btn) {
                                 const rect = btn.getBoundingClientRect();
                                 setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                               }
                               setActiveDropdown(task.id);
                               setHoveredMenuItem(null);
                             }
                           }}
                           title="Menu"
                         >
                           <MoreVertical size={16} />
                         </button>

                        {activeDropdown === task.id && dropdownPos && createPortal(

                          <div 
                            className="dropdown-menu animate-scale-in" 
                            style={{ 
                                position: 'fixed', 
                                top: dropdownPos.top, 
                                right: dropdownPos.right, 
                                background: 'var(--bg-card)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '12px', 
                                padding: '0.5rem', 
                                boxShadow: 'var(--shadow-lg)', 
                                zIndex: 99999, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '0.25rem',
                                minWidth: '180px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                             {/* Claim Task (only if unassigned) */}
                             {task.assignees.length === 0 && (
                                <>
                                  <button
                                    onClick={() => { handleClaim(task.id); setActiveDropdown(null); }}
                                    style={{
                                      padding: '0.75rem 1.125rem',
                                      fontSize: '0.8125rem',
                                      fontWeight: 700,
                                      color: 'var(--accent-purple)',
                                      background: 'color-mix(in srgb, var(--theme-color) 8%, transparent)',
                                      border: 'none',
                                      borderRadius: '10px',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.875rem',
                                      marginBottom: '0.25rem',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-color) 12%, transparent)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-color) 8%, transparent)'}
                                  >
                                    <CheckCircle2 size={16} />
                                    <span>Claim Task</span>
                                  </button>
                                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
                                </>
                             )}

                             {/* Change Status */}
                             <div 
                                style={{ position: 'relative' }}
                                onMouseEnter={() => setHoveredMenuItem('status')}
                                onMouseLeave={() => setHoveredMenuItem(null)}
                             >
                                <button
                                  className="dropdown-item"
                                  style={{
                                    padding: '0.75rem 1.125rem',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    background: hoveredMenuItem === 'status' ? 'color-mix(in srgb, var(--theme-color) 10%, transparent)' : 'transparent',
                                    border: 'none',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <span>Change Status</span>
                                  <ChevronRight size={14} />
                                </button>
                                
                                {hoveredMenuItem === 'status' && (
                                  <div style={{
                                    position: 'absolute',
                                    right: '100%',
                                    marginRight: '4px',
                                    top: 0,
                                    width: '160px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '0.4rem',
                                    boxShadow: 'var(--shadow-md)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.2rem'
                                  }}>
                                    {(() => {
                                      const projectForTask = projects.find(p => p.id === task.projectId);
                                      const userIsAdmin = projectForTask?.admins?.includes(user?.name ?? '') || false;
                                      return [
                                        { id: 'todo', label: 'To Do' },
                                        { id: 'in_progress', label: 'In Progress' },
                                        { id: 'review', label: 'Review' },
                                        { id: 'completed', label: 'Completed' }
                                      ].filter(s => s.id !== 'completed' || userIsAdmin).map(s => (
                                        <button
                                          key={s.id}
                                          onClick={() => { 
                                            if ((s.id === 'review' || s.id === 'completed') && (task.status === 'todo' || task.status === 'in_progress') && !task.hasSubmittedFile) {
                                              onTaskClick?.(task.id);
                                            } else {
                                              handleUpdateStatus(task.id, s.id as TaskStatus); 
                                            }
                                            setActiveDropdown(null); 
                                          }}
                                          style={{
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            color: task.status === s.id ? 'var(--accent-purple)' : 'var(--text-secondary)',
                                            background: 'transparent',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.2s',
                                            width: '100%',
                                            textAlign: 'left'
                                          }}
                                          onMouseOver={e => {
                                             if (task.status !== s.id) {
                                                e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-color) 8%, transparent)';
                                                e.currentTarget.style.color = 'var(--text-primary)';
                                             }
                                          }}
                                          onMouseOut={e => {
                                             if (task.status !== s.id) {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                             }
                                          }}
                                        >
                                          {s.label}
                                          {task.status === s.id && <CheckCircle2 size={12} color="var(--accent-purple)" />}
                                        </button>
                                      ));
                                    })()}
                                  </div>
                                )}
                             </div>

                             {/* Edit Task */}
                             <button
                               onClick={() => { setEditingTask(task); setActiveDropdown(null); }}
                               style={{
                                 padding: '0.75rem 1.125rem',
                                 fontSize: '0.8125rem',
                                 fontWeight: 600,
                                 color: 'var(--text-secondary)',
                                 background: 'transparent',
                                 border: 'none',
                                 borderRadius: '10px',
                                 textAlign: 'left',
                                 cursor: 'pointer',
                                 width: '100%',
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '0.875rem',
                                 transition: 'all 0.2s'
                               }}
                               onMouseOver={e => {
                                 e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-color) 10%, transparent)';
                                 e.currentTarget.style.color = 'var(--text-primary)';
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                              >
                                <Edit3 size={16} />
                                <span>Edit Task</span>
                              </button>
                             <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />

                             {/* Break Down Task */}
                             <button
                               onClick={async () => {
                                 setBreakingDownTaskId(task.id);
                                 setActiveDropdown(null);
                                 try {
                                   await breakDownTask(task.id);
                                 } finally {
                                   setBreakingDownTaskId(null);
                                 }
                               }}
                               disabled={breakingDownTaskId === task.id}
                               style={{
                                 padding: '0.75rem 1.125rem',
                                 fontSize: '0.8125rem',
                                 fontWeight: 600,
                                 color: 'var(--text-secondary)',
                                 background: 'transparent',
                                 border: 'none',
                                 borderRadius: '10px',
                                 textAlign: 'left',
                                 cursor: breakingDownTaskId === task.id ? 'wait' : 'pointer',
                                 width: '100%',
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '0.875rem',
                                 transition: 'all 0.2s'
                               }}
                               onMouseOver={e => {
                                 if (breakingDownTaskId !== task.id) {
                                   e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-color) 10%, transparent)';
                                   e.currentTarget.style.color = 'var(--accent-purple)';
                                 }
                               }}
                               onMouseOut={e => {
                                 e.currentTarget.style.background = 'transparent';
                                 e.currentTarget.style.color = 'var(--text-secondary)';
                               }}
                             >
                                <Wand2 size={16} />
                                <span>Break Down Task</span>
                             </button>
                             <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />

                             {/* Upload Submission */}
                             <button
                               onClick={() => { onTaskClick?.(task.id); setActiveDropdown(null); }}
                               style={{
                                 padding: '0.75rem 1.125rem',
                                 fontSize: '0.8125rem',
                                 fontWeight: 600,
                                 color: 'var(--text-secondary)',
                                 background: 'transparent',
                                 border: 'none',
                                 borderRadius: '10px',
                                 textAlign: 'left',
                                 cursor: 'pointer',
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '0.875rem',
                                 transition: 'all 0.2s'
                               }}
                               onMouseOver={e => {
                                 e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-color) 10%, transparent)';
                                 e.currentTarget.style.color = 'var(--text-primary)';
                               }}
                               onMouseOut={e => {
                                 e.currentTarget.style.background = 'transparent';
                                 e.currentTarget.style.color = 'var(--text-secondary)';
                               }}
                             >
                                <Upload size={14} />
                                <span>Upload Submission</span>
                             </button>

                              {/* Drop Task — only if current user is an assignee */}
                             {task.assignees.includes(user?.name ?? '') && (
                               <>
                                 <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
                                 <button
                                   onClick={async () => { await handleDrop(task.id); setActiveDropdown(null); }}
                                   style={{
                                     padding: '0.75rem 1.125rem',
                                     fontSize: '0.8125rem',
                                     fontWeight: 600,
                                     color: 'var(--accent-yellow)',
                                     background: 'transparent',
                                     border: 'none',
                                     borderRadius: '10px',
                                     textAlign: 'left',
                                     cursor: 'pointer',
                                     width: '100%',
                                     display: 'flex',
                                     alignItems: 'center',
                                     gap: '0.875rem',
                                     transition: 'all 0.2s'
                                   }}
                                   onMouseOver={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)'}
                                   onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                 >
                                   <User size={16} />
                                   <span>Drop Task</span>
                                 </button>
                               </>
                             )}

                             <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />

                             <button
                               style={{
                                 padding: '0.75rem 1.125rem',
                                 fontSize: '0.8125rem',
                                 fontWeight: 600,
                                 color: 'var(--accent-red)',
                                 background: 'transparent',
                                 border: 'none',
                                 borderRadius: '10px',
                                 textAlign: 'left',
                                 cursor: 'pointer',
                                 width: '100%',
                                 transition: 'all 0.2s'
                               }}
                               onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                               onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                               onClick={() => { handleDelete(task.id); setActiveDropdown(null); }}
                             >
                               Delete Task
                             </button>
                          </div>,
                          document.body
                        )}
                     </>)}
                    </div>
                    
                    {showProjectName && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                           {projects.find(p => p.id === task.projectId)?.title || "Global Workspace"}
                        </div>
                    )}

                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, lineHeight: 1.4, color: 'var(--text-primary)' }}>{task.title}</h4>
                    {task.description && (
                      <p className="line-clamp-2" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: task.description ? '0' : '1.25rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                         <Clock size={12} />
                         <span>{new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
                       </div>
                       
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <span style={{ fontSize: '0.75rem', color: task.assignees.length > 0 ? 'var(--text-secondary)' : 'var(--accent-purple)', fontWeight: 600 }}>
                             {task.assignees.length > 0 ? task.assignees[0] : 'Unassigned'}
                           </span>
                           {task.assignees.length > 0 ? (
                             <div style={{ 
                                 width: '28px', 
                                 height: '28px', 
                                 borderRadius: '10px', 
                                 background: 'linear-gradient(135deg, var(--theme-color), var(--accent))', 
                                 fontSize: '11px', 
                                 fontWeight: 700,
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center', 
                                 color: 'white',
                                 boxShadow: '0 2px 8px color-mix(in srgb, var(--theme-color) 20%, transparent)'
                             }}>
                                {task.assignees[0].charAt(0)}
                             </div>
                           ) : (
                             <div style={{ 
                                 width: '28px', 
                                 height: '28px', 
                                 borderRadius: '10px', 
                                 background: 'var(--bg-app)', 
                                 border: '1px dashed var(--border-color)',
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center',
                                 color: 'var(--text-secondary)'
                             }}>
                                <User size={14} />
                             </div>
                           )}
                       </div>
                    </div>
                 </div>
               ))}
               
               {columnTasks.length === 0 && (
                 <div style={{ 
                    padding: '3rem 1.5rem', 
                    textAlign: 'center', 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.8125rem', 
                    border: '2px dashed var(--border-color)', 
                    borderRadius: '20px',
                    opacity: 0.5
                 }}>
                    Queue empty
                 </div>
               )}
            </div>
          </div>
        )
      })}
    </div>

    {createTaskForStatus && (
      <CreateTaskModal
        defaultStatus={createTaskForStatus ?? undefined}
        onClose={() => setCreateTaskForStatus(null)}
        onTaskCreated={onCreateTask ?? ((task) => defaultAddTask(task))}
      />
    )}
    
    {editingTask && (
      <EditTaskModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onUpdate={onEditTask}
      />
    )}
    </>
  );
}
