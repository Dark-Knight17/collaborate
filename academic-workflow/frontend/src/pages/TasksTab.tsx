import React, { useState } from 'react';
import { useMockData } from '../context/MockDataContext';
import { KanbanBoard } from '../components/shared/KanbanBoard';
import { LayoutGrid, List as ListIcon, Search, Filter, Clock, AlertCircle, Sparkles, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import TaskDetails from '../components/TaskDetails';

export const TasksTab: React.FC = () => {
    const { user, tasks, projects } = useMockData();
    const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('kanban');
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [filterBy, setFilterBy] = useState('my_tasks');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        if (filterBy === 'completed' || filterBy === 'overdue') {
            setView('list');
        }
    }, [filterBy]);

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (filterBy === 'my_tasks') {
            return (user && t.assignees.includes(user.name)) || t.assignees.includes('Alex') || t.assignees.includes('You');
        }
        if (filterBy === 'completed') {
            return t.status === 'completed';
        }
        if (filterBy === 'overdue') {
            const isOverdue = new Date(t.deadline) < new Date();
            return isOverdue && t.status !== 'completed';
        }
        return true;
    });

    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const renderCalendar = () => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const daysInMonth = getDaysInMonth(calendarMonth);
        const firstDay = getFirstDayOfMonth(calendarMonth);
        const days = [];

        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);

        return (
            <div className="card glass-card animate-fade-in" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 700 }}>
                        {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-icon" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} style={{ borderRadius: '8px' }}>
                            <ChevronLeft size={18} />
                        </button>
                        <button className="btn-icon" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} style={{ borderRadius: '8px' }}>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '0.5rem 0' }}>{d}</div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                    {days.map((day, i) => {
                        if (day === null) return <div key={`empty-${i}`} />;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const tasksOnDay = filteredTasks.filter(t => t.deadline?.startsWith(dateStr));
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        return (
                            <div key={day} style={{
                                minHeight: '80px', padding: '0.5rem', borderRadius: '10px',
                                background: isToday ? 'color-mix(in srgb, var(--theme-color) 8%, transparent)' : 'var(--bg-app)',
                                border: isToday ? '1px solid color-mix(in srgb, var(--theme-color) 30%, transparent)' : '1px solid transparent',
                                display: 'flex', flexDirection: 'column', gap: '0.25rem'
                            }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>{day}</span>
                                {tasksOnDay.map(t => (
                                    <div key={t.id} onClick={() => setSelectedTask(t)} style={{
                                        fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.4rem',
                                        borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        background: t.priority === 'high' ? 'rgba(239, 68, 68, 0.15)' : t.priority === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 'color-mix(in srgb, var(--theme-color) 10%, transparent)',
                                        color: t.priority === 'high' ? 'var(--accent-red)' : t.priority === 'medium' ? 'var(--accent-yellow)' : 'var(--accent-purple)'
                                    }}>{t.title}</div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '2.5rem' }}>
            <div className="flex-between" style={{ alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>All Tasks</h1>
                    <p className="text-secondary" style={{ fontSize: isMobile ? '0.9rem' : '1.1rem' }}>Cross-project task management and resource allocation.</p>
                </div>
            </div>

            <div className="flex-between" style={{ 
              background: 'var(--bg-card)', 
              padding: '0.75rem', 
              borderRadius: '16px', 
              border: '1px solid var(--border-color)', 
              boxShadow: 'var(--shadow-sm)',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '1rem',
              alignItems: 'stretch'
            }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: isMobile ? '100%' : '900px', flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ position: 'relative', flex: 2 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Locate tasks..."
                            className="input-field"
                            style={{ paddingLeft: '3.25rem', background: 'var(--bg-app)', border: 'none' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        <select
                            className="input-field"
                            style={{ background: 'var(--bg-app)', appearance: 'none', cursor: 'pointer', border: 'none', width: '100%' }}
                            value={filterBy}
                            onChange={(e) => setFilterBy(e.target.value)}
                        >
                            <option value="my_tasks">My Tasks</option>
                            <option value="all">Global Workspace</option>
                            <option value="completed">Completed Tasks</option>
                            <option value="overdue">Overdue Tasks</option>
                        </select>
                        <Filter size={14} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '0.1rem', justifyContent: 'center' }}>
                    <button
                        className={`btn-icon ${view === 'list' ? 'active' : ''}`}
                        onClick={() => setView('list')}
                        style={{
                            background: view === 'list' ? 'var(--bg-card)' : 'transparent',
                            boxShadow: view === 'list' ? 'var(--shadow-sm)' : 'none',
                            color: view === 'list' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                            borderRadius: '8px',
                            flex: isMobile ? 1 : 'none'
                        }}
                    >
                        <ListIcon size={18} />
                    </button>
                    <button
                        className={`btn-icon ${view === 'kanban' ? 'active' : ''}`}
                        onClick={() => setView('kanban')}
                        style={{
                            background: view === 'kanban' ? 'var(--bg-card)' : 'transparent',
                            boxShadow: view === 'kanban' ? 'var(--shadow-sm)' : 'none',
                            color: view === 'kanban' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                            borderRadius: '8px',
                            flex: isMobile ? 1 : 'none'
                        }}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        className={`btn-icon ${view === 'calendar' ? 'active' : ''}`}
                        onClick={() => setView('calendar')}
                        style={{
                            background: view === 'calendar' ? 'var(--bg-card)' : 'transparent',
                            boxShadow: view === 'calendar' ? 'var(--shadow-sm)' : 'none',
                            color: view === 'calendar' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                            borderRadius: '8px',
                            flex: isMobile ? 1 : 'none'
                        }}
                    >
                        <CalendarDays size={18} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
                <div style={{ overflowY: 'auto', paddingRight: selectedTask ? '0.5rem' : '0', width: '100%' }}>
                    {view === 'kanban' ? (
                        <KanbanBoard tasks={filteredTasks} showProjectName={true} onTaskClick={(taskId) => {
                            const task = tasks.find(t => t.id === taskId);
                            if (task) setSelectedTask(task);
                        }} />
                    ) : view === 'calendar' ? (
                        renderCalendar()
                    ) : (
                        <div className="card glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Assignment</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Origin Project</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Current Phase</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Milestone</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Priority</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.length > 0 ? filteredTasks.map(task => (
                                        <tr
                                            key={task.id}
                                            style={{
                                                borderBottom: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s ease',
                                                background: selectedTask?.id === task.id ? 'color-mix(in srgb, var(--theme-color) 5%, transparent)' : 'transparent'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-color) 3%, transparent)'}
                                            onMouseOut={e => e.currentTarget.style.background = selectedTask?.id === task.id ? 'color-mix(in srgb, var(--theme-color) 5%, transparent)' : 'transparent'}
                                            onClick={() => setSelectedTask(task)}
                                        >
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{task.title}</div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span className="badge" style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                    {projects.find(p => p.id === task.projectId)?.title ?? task.projectId}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)', fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase' }}>
                                                    <Sparkles size={12} /> {task.status.replace('_', ' ')}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Clock size={12} /> {task.deadline}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span className="badge" style={{
                                                    background: task.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-app)',
                                                    color: task.priority === 'high' ? 'var(--accent-red)' : 'var(--text-secondary)',
                                                    fontWeight: 800,
                                                    fontSize: '0.65rem'
                                                }}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                                                <AlertCircle size={32} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                                <div style={{ color: 'var(--text-secondary)' }}>No matches found in current workspace</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {selectedTask && (
                     <TaskDetails
                         taskId={selectedTask.id}
                         taskTitle={selectedTask.title}
                         onSuccess={() => {
                             setSelectedTask(null);
                         }}
                         onCancel={() => setSelectedTask(null)}
                     />
                 )}
            </div>
        </div>
    );
};
