import React, { useState, useEffect } from 'react';
import type { Project } from './types';
import { fetchProjects, createProject, deleteProject, createWorkflow, generateAIWorkflow } from './api';
import { Plus, Trash2, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { InteractiveGridBackground } from './InteractiveGrid';

interface DashboardProps {
  onOpenWorkflow: (workflowId: string) => void;
  onBackToLanding: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenWorkflow, onBackToLanding }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [showModal, setShowModal] = useState(false);

  // AI Prompt Modal States
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const p = await createProject(newProjectName.trim(), newProjectDesc.trim());
      const wf = await createWorkflow(p.id, 'Main Workflow');
      setShowModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      onOpenWorkflow(wf.id);
    } catch (err) {
      alert('Error creating project');
    }
  }

  async function handleGenerateAI(e: React.FormEvent) {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setGeneratingAI(true);
    try {
      const createdWorkflow = await generateAIWorkflow(aiPrompt.trim());
      setShowAIModal(false);
      setAiPrompt('');
      onOpenWorkflow(createdWorkflow.id);
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI workflow');
    } finally {
      setGeneratingAI(false);
    }
  }

  async function handleDeleteProject(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      loadProjects();
    } catch (err) {
      alert('Failed to delete project');
    }
  }

  const exampleKeywords = ['e-commerce', 'digital banking', 'problematic sample'];
  const exampleProjects = projects.filter((p) =>
    exampleKeywords.some((k) => p.name.toLowerCase().includes(k))
  );
  const userProjects = projects.filter(
    (p) => !exampleKeywords.some((k) => p.name.toLowerCase().includes(k))
  );

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: 'var(--bg-main)', padding: '4rem 2rem', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', overflow: 'hidden' }}>
      
      {/* Interactive Mouse Grid Canvas */}
      <InteractiveGridBackground />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '2rem' }}>
          <div>
            <button
              onClick={onBackToLanding}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '0', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', marginBottom: '1rem', display: 'block' }}
            >
              ← OVERVIEW
            </button>
            <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Project Workspace
            </h1>
            <p style={{ margin: '0.375rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              Custom user models & segregated example automata benchmarks.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowAIModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--text-primary)',
                padding: '0.75rem 1.25rem',
                borderRadius: '0px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={16} /> GENERATE WITH AI
            </button>

            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-main)',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> NEW PROJECT
            </button>
          </div>
        </header>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>Loading workspace projects...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            
            {/* User Projects Section */}
            <section>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>
                CUSTOM USER PROJECTS ({userProjects.length})
              </div>

              {userProjects.length === 0 ? (
                <div style={{ padding: '3rem 2rem', border: '1px solid var(--border-light)', borderRadius: '0px', textAlign: 'center', background: 'var(--bg-card)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>No custom projects created yet.</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                      onClick={() => setShowAIModal(true)}
                      style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--text-primary)', padding: '0.5rem 1.25rem', borderRadius: '0px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}
                    >
                      ✨ Generate with AI
                    </button>
                    <button
                      onClick={() => setShowModal(true)}
                      style={{ background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '0px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}
                    >
                      Create Custom Project
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {userProjects.map((p) => {
                    const defaultWf = p.workflows && p.workflows.length > 0 ? p.workflows[0] : null;
                    return (
                      <div
                        key={p.id}
                        onClick={() => defaultWf && onOpenWorkflow(defaultWf.id)}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '0px',
                          padding: '1.5rem',
                          cursor: defaultWf ? 'pointer' : 'default',
                          transition: 'border-color 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--text-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{p.name}</h3>
                          <button
                            onClick={(e) => handleDeleteProject(p.id, e)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                            title="Delete project"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', minHeight: '2.5rem', lineHeight: 1.5 }}>
                          {p.description || 'No description provided.'}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>{p.workflows?.length || 0} WORKFLOW</span>
                          {defaultWf && (
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              OPEN <ArrowRight size={14} />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Segregated Pre-defined Benchmark Projects Section */}
            <section style={{ borderTop: '1px solid var(--border-light)', paddingTop: '3rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>
                PRE-DEFINED AUTOMATA BENCHMARKS ({exampleProjects.length})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {exampleProjects.map((p) => {
                  const defaultWf = p.workflows && p.workflows.length > 0 ? p.workflows[0] : null;
                  return (
                    <div
                      key={p.id}
                      onClick={() => defaultWf && onOpenWorkflow(defaultWf.id)}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '0px',
                        padding: '1.5rem',
                        cursor: defaultWf ? 'pointer' : 'default',
                        transition: 'border-color 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--text-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{p.name}</h3>
                      </div>

                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', minHeight: '2.5rem', lineHeight: 1.5 }}>
                        {p.description || 'Pre-defined benchmark workflow.'}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>BENCHMARK</span>
                        {defaultWf && (
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            INSPECT <ArrowRight size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        )}

        {/* AI Prompt Generator Modal */}
        {showAIModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleGenerateAI} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--text-primary)', padding: '2.5rem', borderRadius: '0px', width: '540px', maxWidth: '90vw' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Sparkles size={20} style={{ color: 'var(--text-primary)' }} />
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>AI APP STATE GENERATOR</h2>
              </div>
              
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
                  DESCRIBE YOUR APPLICATION FLOW
                </label>
                <textarea
                  required
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. An audio player app with loading track, playing, pause, stop, and reset actions..."
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem 0.875rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '0px', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  💡 Try: "Food delivery app with menu, cart, payment, kitchen prep, driver and delivery steps"
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  disabled={generatingAI}
                  style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '0px', cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={generatingAI}
                  style={{ padding: '0.625rem 1.5rem', background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', borderRadius: '0px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'var(--font-display)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {generatingAI ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> GENERATING GRAPH...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> GENERATE & OPEN
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Regular Manual New Project Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleCreateProject} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--text-primary)', padding: '2.5rem', borderRadius: '0px', width: '420px', maxWidth: '90vw' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>INITIALIZE PROJECT</h2>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: '0.375rem', letterSpacing: '0.1em' }}>PROJECT NAME *</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. E-Commerce Checkout"
                  style={{ width: '100%', padding: '0.625rem 0.875rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '0px', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}
                />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: '0.375rem', letterSpacing: '0.1em' }}>DESCRIPTION</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Workflow context..."
                  rows={3}
                  style={{ width: '100%', padding: '0.625rem 0.875rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '0px', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '0px', cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.625rem 1.5rem', background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', borderRadius: '0px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}
                >
                  CREATE
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
