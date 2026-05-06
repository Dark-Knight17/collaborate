import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Check, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { useMockData, type Project } from '../context/MockDataContext';
import { api } from '../api';

interface HydrateBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onComplete: (formData: any) => void;
}

export const HydrateBlueprintModal: React.FC<HydrateBlueprintModalProps> = ({ isOpen, onClose, project, onComplete }) => {
  const { updateProject, courses } = useMockData();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    courseCode: project.courseCode || '',
    description: project.description || '',
    dueDate: project.dueDate || '',
    projectType: '',
    aiTrackingEnabled: project.aiTrackingEnabled ?? true,
    deliverable: '',
    collaborationStyle: ''
  });

  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setFormData({
        courseCode: project.courseCode || '',
        description: project.description || '',
        dueDate: project.dueDate || '',
        projectType: '',
        aiTrackingEnabled: project.aiTrackingEnabled ?? true,
        deliverable: '',
        collaborationStyle: ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    // Focus input when step changes
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [step, isOpen]);

  const handleHydrateProject = async () => {
    setSaving(true);
    
    try {
      const rawDesc = (formData.description || '').trim();
      let finalDesc = project.description;
      
      if (rawDesc || !project.description) {
        try {
          const aiData = await api.generateDescription(rawDesc);
          finalDesc = aiData.description;
        } catch(e) {
          // Fallback if API fails
          let formattedDesc = rawDesc;
          if (formattedDesc) {
            formattedDesc = formattedDesc.charAt(0).toUpperCase() + formattedDesc.slice(1).toLowerCase();
            if (!formattedDesc.endsWith('.')) formattedDesc += '.';
          }
          finalDesc = formattedDesc || project.description;
        }
      }

      updateProject(project.id, {
        description: finalDesc,
        courseCode: formData.courseCode || undefined,
        dueDate: formData.dueDate,
        aiTrackingEnabled: formData.aiTrackingEnabled,
        minGrade: formData.aiTrackingEnabled ? 65 : undefined
      });
      onComplete(formData);
    } finally {
      setSaving(false);
    }
  };

  const courseStep = courses.length > 0 ? [{
    id: 'courseCode',
    label: "Which course is this for?",
    desc: "Select the course this project belongs to.",
    content: (
      <select
        ref={inputRef}
        className="typeform-sidebar-input"
        value={formData.courseCode}
        onChange={e => setFormData({ ...formData, courseCode: e.target.value })}
        style={{ fontSize: '1.5rem', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
      >
        <option value="">— No course / standalone —</option>
        {courses.map(c => (
          <option key={c.id} value={c.courseCode}>{c.courseCode} · {c.title}</option>
        ))}
      </select>
    )
  }] : [];

  const steps = [
    ...courseStep,
    {
      id: 'description',
      label: "Could you briefly describe the project?",
      desc: "What are the primary goals or topics of research?",
      content: (
        <textarea 
          ref={inputRef}
          className="typeform-sidebar-input"
          placeholder="Type your description..."
          rows={4}
          style={{ resize: 'none' }}
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          onKeyDown={handleKeyDown}
        />
      )
    },
    {
      id: 'deliverable',
      label: "What is the primary final deliverable?",
      desc: "Select the output you'll submit at the end of this project.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {[
            'Written Report / Essay',
            'Working Software / App',
            'Video / Film',
            'Presentation Slides',
            'Dataset & Analysis',
            'Design Mockups / Prototype',
            'Poster / Infographic',
            'Code Repository',
            'Other',
          ].map(opt => (
            <button
              key={opt}
              style={{
                width: '100%',
                background: formData.deliverable === opt ? 'color-mix(in srgb, var(--theme-color) 15%, transparent)' : 'var(--bg-app)',
                border: `2px solid ${formData.deliverable === opt ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                color: formData.deliverable === opt ? 'var(--accent-purple)' : 'var(--text-secondary)',
                padding: '1.1rem 1.25rem',
                borderRadius: '16px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
              onClick={() => {
                setFormData({ ...formData, deliverable: opt });
                setTimeout(() => nextStep(), 300);
              }}
            >
              <div style={{
                width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0,
                background: formData.deliverable === opt ? 'var(--accent-purple)' : 'var(--bg-card)',
                color: formData.deliverable === opt ? 'white' : 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px'
              }}>
                {formData.deliverable === opt ? <Check size={13} /> : opt.charAt(0)}
              </div>
              {opt}
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'dueDate',
      label: "When is the deadline?",
      desc: "A required deadline helps the AI structure milestones.",
      content: (
        <input 
          ref={inputRef}
          type="date"
          className="typeform-sidebar-input"
          value={formData.dueDate}
          onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
          onKeyDown={handleKeyDown}
          style={{ width: '100%', color: formData.dueDate ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        />
      )
    },
    {
      id: 'projectType',
      label: "What type of project is this?",
      desc: "Choose the category that best fits your workflow.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {[
            'Research Paper',
            'Software Development',
            'Video Production',
            'Design Project',
            'Business Report',
            'Case Study',
            'Presentation',
            'Literature Review',
            'Data Analysis',
            'Other',
          ].map(type => (
            <button
              key={type}
              style={{
                width: '100%',
                background: formData.projectType === type ? 'color-mix(in srgb, var(--theme-color) 15%, transparent)' : 'var(--bg-app)',
                border: `2px solid ${formData.projectType === type ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                color: formData.projectType === type ? 'var(--accent-purple)' : 'var(--text-secondary)',
                padding: '1.1rem 1.25rem',
                borderRadius: '16px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
              onClick={() => {
                setFormData({ ...formData, projectType: type });
                setTimeout(() => nextStep(), 300);
              }}
            >
              <div style={{
                width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0,
                background: formData.projectType === type ? 'var(--accent-purple)' : 'var(--bg-card)',
                color: formData.projectType === type ? 'white' : 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px'
              }}>
                {formData.projectType === type ? <Check size={13} /> : type.charAt(0)}
              </div>
              {type}
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'collaborationStyle',
      label: "Who's working on this project?",
      desc: "This helps the AI calibrate task distribution and workload allocation.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {[
            {
              id: 'Solo — just me',
              emoji: '🧑‍💻',
              label: 'Solo — just me',
              desc: 'Tasks are structured sequentially for one person.',
            },
            {
              id: 'Pair — 2 people',
              emoji: '👥',
              label: 'Pair — 2 people',
              desc: 'Tasks split into two parallel workstreams.',
            },
            {
              id: 'Small group — 3–4 people',
              emoji: '🤝',
              label: 'Small group — 3–4 people',
              desc: 'Balanced task distribution across a small team.',
            },
            {
              id: 'Full team — 5 or more',
              emoji: '🏢',
              label: 'Full team — 5 or more',
              desc: 'Tasks broken into workstreams with role specialisation.',
            },
          ].map(opt => {
            const selected = formData.collaborationStyle === opt.id;
            return (
              <button
                key={opt.id}
                style={{
                  width: '100%',
                  background: selected ? 'color-mix(in srgb, var(--theme-color) 12%, transparent)' : 'var(--bg-app)',
                  border: `2px solid ${selected ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                  borderRadius: '18px',
                  padding: '1.1rem 1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
                onClick={() => {
                  setFormData({ ...formData, collaborationStyle: opt.id });
                  setTimeout(() => nextStep(), 300);
                }}
              >
                <div style={{
                  width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                  background: selected ? 'color-mix(in srgb, var(--theme-color) 20%, transparent)' : 'var(--bg-card)',
                  border: `1px solid ${selected ? 'color-mix(in srgb, var(--theme-color) 35%, transparent)' : 'var(--border-color)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                  transition: 'all 0.2s',
                }}>
                  {opt.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1rem', fontWeight: 700,
                    color: selected ? 'var(--accent-purple)' : 'var(--text-primary)',
                    marginBottom: '0.2rem',
                    transition: 'color 0.2s',
                  }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {opt.desc}
                  </div>
                </div>
                {selected && (
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-purple)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={13} color="white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )
    },

    {
      id: 'aiTracking',
      label: "Enable Strict AI Tracking?",
      desc: "If enabled, submissions will be scanned for AI plagiarism.",
      content: (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button
            style={{
              flex: 1,
              background: formData.aiTrackingEnabled ? 'color-mix(in srgb, var(--theme-color) 15%, transparent)' : 'var(--bg-app)',
              border: `2px solid ${formData.aiTrackingEnabled ? 'var(--accent-purple)' : 'var(--border-color)'}`,
              color: formData.aiTrackingEnabled ? 'var(--accent-purple)' : 'var(--text-secondary)',
              padding: '1.5rem',
              borderRadius: '16px',
              fontSize: '1.25rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => setFormData({ ...formData, aiTrackingEnabled: true })}
          >
            Yes
          </button>
          <button
             style={{
              flex: 1,
              background: !formData.aiTrackingEnabled ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-app)',
              border: `2px solid ${!formData.aiTrackingEnabled ? 'var(--accent-red)' : 'var(--border-color)'}`,
              color: !formData.aiTrackingEnabled ? 'var(--accent-red)' : 'var(--text-secondary)',
              padding: '1.5rem',
              borderRadius: '16px',
              fontSize: '1.25rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => setFormData({ ...formData, aiTrackingEnabled: false })}
          >
            No
          </button>
        </div>
      )
    }
  ];

  const dueDateStepIdx = steps.findIndex(s => s.id === 'dueDate');

  const nextStep = () => {
    // Validation: require dueDate before advancing past that step
    if (step === dueDateStepIdx && !formData.dueDate) return;
    
    if (step < steps.length - 1) setStep(s => s + 1);
    else handleHydrateProject();
  };

  const prevStep = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const currentStep = steps[step];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (step === 1 && e.shiftKey) return; 
      e.preventDefault();
      nextStep();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <style>
        {`
          .typeform-sidebar-input {
            width: 100%;
            background: transparent;
            border: none;
            border-bottom: 2px solid color-mix(in srgb, var(--theme-color) 30%, transparent);
            color: var(--text-primary);
            font-size: 2rem;
            padding: 0.75rem 0;
            outline: none;
            transition: all 0.3s ease;
            font-family: inherit;
          }
          .typeform-sidebar-input:focus {
            border-bottom: 2px solid var(--accent-purple);
          }
          .typeform-sidebar-input::placeholder {
            color: rgba(255,255,255,0.2);
          }
          [data-theme='light'] .typeform-sidebar-input::placeholder {
            color: rgba(0,0,0,0.2);
          }
        `}
      </style>
      
      {/* Header */}
      <div style={{ padding: '2rem 3rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.25rem' }}>
          <Sparkles size={24} color="var(--accent-purple)" />
          <span>Generate Work Blueprint</span>
        </div>
        <button className="btn-icon" onClick={onClose}><X size={24} /></button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div className="animate-fade-in" key={step} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '700px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)', fontWeight: 800, fontSize: '1.25rem' }}>
            <span>{step + 1}</span> <ArrowRight size={18} />
          </div>
          
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, lineHeight: 1.25 }}>
            {currentStep.label}
          </h2>
          
          {currentStep.desc && (
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 500 }}>
              {currentStep.desc}
            </p>
          )}

          <div style={{ marginBottom: '2rem' }}>
            {currentStep.content}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', marginTop: '2rem' }}>
            <button 
              className="btn btn-primary" 
              style={{ 
                padding: '1.25rem 3rem', 
                fontSize: '1.25rem', 
                borderRadius: '16px', 
                fontWeight: 800, 
                gap: '0.75rem', 
                background: 'var(--accent-purple)',
                opacity: (step === dueDateStepIdx && !formData.dueDate) ? 0.5 : 1
              }}
              onClick={nextStep}
              disabled={saving || (step === dueDateStepIdx && !formData.dueDate)}
            >
              {step === steps.length - 1 ? (saving ? 'Generating...' : 'Hydrate Blueprint') : 'Continue'} <Check size={24} />
            </button>
            {step < steps.length - 1 && step !== 4 && step !== 5 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem' }}>
                press <span style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.875rem' }}>Enter ↵</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Progress & Nav */}
      <div className="flex-between" style={{ padding: '2rem 3rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
           <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
             Step {step + 1} of {steps.length}
           </div>
           <div style={{ flex: 1, maxWidth: '250px', height: '8px', background: 'var(--bg-app)', borderRadius: '100px', overflow: 'hidden' }}>
             <div style={{ width: `${((step + 1) / steps.length) * 100}%`, height: '100%', background: 'var(--accent-purple)', transition: 'width 0.3s ease' }} />
           </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn-icon" 
            onClick={prevStep}
            disabled={step === 0}
            style={{ width: '48px', height: '48px', background: 'var(--bg-app)', borderRadius: '12px', opacity: step === 0 ? 0.3 : 1 }}
          >
            <ChevronUp size={24} />
          </button>
          <button 
            className="btn-icon" 
            onClick={nextStep}
            disabled={step === steps.length - 1 || (step === dueDateStepIdx && !formData.dueDate)}
            style={{ width: '48px', height: '48px', background: 'var(--bg-app)', borderRadius: '12px', opacity: step === steps.length - 1 ? 0.3 : 1 }}
          >
            <ChevronDown size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
