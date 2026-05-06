import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const LandingPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (topic.trim()) {
      setLoading(true);
      try {
        const res = await api.createProject(topic);
        const { project_id } = res;
        navigate(`/project/${project_id}`);
      } catch (err) {
        console.error('Failed to create project', err);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', marginBottom: '5rem' }}>
        <p className="subtitle" style={{ marginBottom: '1.5rem' }}>COLLABORATIVE ACADEMIC WORKFLOW</p>
        <h1 className="title-hero">
          Academic, <span className="italic">not chaotic.</span><br/>
          The calm side of teamwork.
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Initiate a project</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1rem' }}>
            Set the thesis and let our robust AI structure the requisite tasks for your cohort.
          </p>
          <div className="flex-col gap-4">
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Machine Learning in Healthcare"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button className="btn btn-primary" onClick={handleCreate} disabled={loading} style={{ padding: '1rem' }}>
              {loading ? 'Starting...' : 'Start Project'}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Join the society</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1rem' }}>
            Have a formal invite code? Enter the space your team has already prepared.
          </p>
          <div className="flex-col gap-4">
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter invite code..."
            />
            <button className="btn btn-secondary" style={{ padding: '1rem' }}>Access Project</button>
          </div>
        </div>
      </div>
      
      {/* Decorative inspiration imagery */}
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '7rem', height: '400px', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div className="image-card" style={{ width: '280px', height: '320px', transform: 'translateY(4rem)' }}>
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Team collaborating" />
        </div>
        <div className="image-card" style={{ width: '400px', height: '400px' }}>
          <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Office space" />
        </div>
        <div className="image-card" style={{ width: '280px', height: '320px', transform: 'translateY(2rem)' }}>
          <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Focus work" />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
