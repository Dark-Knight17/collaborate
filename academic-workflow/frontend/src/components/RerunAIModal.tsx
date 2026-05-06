import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Loader2, ChevronDown } from 'lucide-react';

interface RerunAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  onSubmit: (data: { description: string; projectType: string; deliverable: string }) => void;
  isGenerating?: boolean;
}

const PROJECT_TYPES = [
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
];

const DELIVERABLES = [
  'Written Report / Essay',
  'Working Software / App',
  'Video / Film',
  'Presentation Slides',
  'Dataset & Analysis',
  'Design Mockups / Prototype',
  'Poster / Infographic',
  'Code Repository',
  'Other',
];

export const RerunAIModal: React.FC<RerunAIModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  onSubmit,
  isGenerating = false,
}) => {
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('');
  const [deliverable, setDeliverable] = useState('');

  if (!isOpen) return null;

  const isValid = description.trim().length > 10 && projectType && deliverable;

  const handleSubmit = () => {
    if (!isValid || isGenerating) return;
    onSubmit({ description: description.trim(), projectType, deliverable });
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100001,
        padding: '1rem',
      }}
      onClick={() => { if (!isGenerating) onClose(); }}
    >
      <div
        className="card animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '580px',
          background: 'var(--bg-card)',
          border: '1px solid color-mix(in srgb, var(--theme-color) 25%, transparent)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px color-mix(in srgb, var(--theme-color) 10%, transparent)',
          borderRadius: '24px',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.75rem 2rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-color) 6%, transparent), color-mix(in srgb, var(--theme-color) 2%, transparent))',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'color-mix(in srgb, var(--theme-color) 15%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-purple)',
              boxShadow: '0 0 0 1px color-mix(in srgb, var(--theme-color) 20%, transparent)',
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                Re-run AI Task Distribution
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {projectTitle}
              </div>
            </div>
          </div>
          {!isGenerating && (
            <button className="btn-icon" onClick={onClose} style={{ flexShrink: 0 }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Description */}
          <div>
            <label style={{
              fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em',
              textTransform: 'uppercase', color: 'var(--text-secondary)',
              display: 'block', marginBottom: '0.6rem',
            }}>
              Project Description
            </label>
            <textarea
              className="input-field"
              placeholder="Briefly describe what this project is about, its goals, and any key context the AI should know..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isGenerating}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                minHeight: '110px',
                resize: 'vertical',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                opacity: isGenerating ? 0.6 : 1,
              }}
            />
          </div>

          {/* Project Type */}
          <div>
            <label style={{
              fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em',
              textTransform: 'uppercase', color: 'var(--text-secondary)',
              display: 'block', marginBottom: '0.6rem',
            }}>
              Type of Project
            </label>
            <div style={{ position: 'relative' }}>
              <select
                className="input-field"
                value={projectType}
                onChange={e => setProjectType(e.target.value)}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  appearance: 'none',
                  paddingRight: '2.5rem',
                  cursor: 'pointer',
                  color: projectType ? 'var(--text-primary)' : 'var(--text-secondary)',
                  opacity: isGenerating ? 0.6 : 1,
                }}
              >
                <option value="" disabled>Select a project type…</option>
                {PROJECT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{
                position: 'absolute', right: '0.875rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-secondary)',
                pointerEvents: 'none',
              }} />
            </div>
          </div>

          {/* Expected Deliverable */}
          <div>
            <label style={{
              fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em',
              textTransform: 'uppercase', color: 'var(--text-secondary)',
              display: 'block', marginBottom: '0.6rem',
            }}>
              Expected Deliverable
            </label>
            <div style={{ position: 'relative' }}>
              <select
                className="input-field"
                value={deliverable}
                onChange={e => setDeliverable(e.target.value)}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  appearance: 'none',
                  paddingRight: '2.5rem',
                  cursor: 'pointer',
                  color: deliverable ? 'var(--text-primary)' : 'var(--text-secondary)',
                  opacity: isGenerating ? 0.6 : 1,
                }}
              >
                <option value="" disabled>What will you submit?</option>
                {DELIVERABLES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{
                position: 'absolute', right: '0.875rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-secondary)',
                pointerEvents: 'none',
              }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.25rem 2rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          background: 'rgba(0,0,0,0.08)',
        }}>
          {!isGenerating && (
            <button className="btn btn-secondary" onClick={onClose} style={{ whiteSpace: 'nowrap' }}>
              Cancel
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!isValid || isGenerating}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.75rem', fontWeight: 700, whiteSpace: 'nowrap',
              opacity: (!isValid || isGenerating) ? 0.6 : 1,
              cursor: (!isValid || isGenerating) ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Generating Tasks…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Tasks
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
