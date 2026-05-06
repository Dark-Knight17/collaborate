import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import TaskBoard from './TaskBoard';
import TaskDetails from './TaskDetails';

const ProjectDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  
  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getProject(id);
      setProject(data.project);
      setTasks(data.tasks);
      
      // If just created and not generating yet, trigger generation
      if (data.project.status === 'created' && !generating) {
        setGenerating(true);
        const genData = await api.generateTasks(id, data.project.topic);
        setTasks(genData.tasks);
        setProject((prev: any) => ({ ...prev, status: 'tasks_generated' }));
        setGenerating(false);
      }
    } catch (err) {
      console.error('Failed to fetch project', err);
    } finally {
      setLoading(false);
    }
  }, [id, generating]);

  useEffect(() => {
    fetchProjectData();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchProjectData, 5000);
    return () => clearInterval(interval);
  }, [fetchProjectData]);
  
  const handleSelectTask = (task: any) => {
    setSelectedTask(task);
  };

  if (loading && !project) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="badge badge-pending">Loading Project...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '4rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto 4rem auto' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '1rem' }}>PROJECT HUB • {id}</p>
        <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
          {project?.topic}
        </h1>
        {generating && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="badge" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)', animation: 'pulse 2s infinite' }}></div>
                AI Agent is Structuring Tasks...
              </div>
            </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <TaskBoard 
            tasks={tasks} 
            onSelectTask={handleSelectTask}
            onRefresh={fetchProjectData}
          />
        </div>
        
        {selectedTask && (
          <TaskDetails 
            taskId={selectedTask.id} 
            taskTitle={selectedTask.title} 
            onSuccess={() => {
              setSelectedTask(null);
              fetchProjectData();
            }}
            onCancel={() => setSelectedTask(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;
