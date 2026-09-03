import React, { useEffect, useState } from 'react';
import { fetchProjects, createProject, deleteProject, createWorkflow, generateAIWorkflow, enhanceAIPrompt, previewAIWorkflow } from './api';
import type { Workflow, Project, WorkflowAIPreview } from './api';
import { Plus, Trash2, ArrowRight, Sparkles, Loader2, Wand2, CheckSquare, Square, ChevronRight } from 'lucide-react';
import { InteractiveGridBackground } from './InteractiveGrid';

interface DashboardProps {
  onOpenWorkflow: (workflowId: string) => void;
  onBackToLanding: () => void;
}

export function Dashboard({ onOpenWorkflow, onBackToLanding }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // AI Modal States
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiStep, setAiStep] = useState<1 | 2>(1);
  const [aiPrompt, setAiPrompt] = useState('');
  const [enhancingPrompt, setEnhancingPrompt] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [buildingWorkflow, setBuildingWorkflow] = useState(false);
  const [aiPreview, setAiPreview] = useState<WorkflowAIPreview | null>(null);
  const [selectedEdgeCases, setSelectedEdgeCases] = useState<Record<string, boolean>>({});

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
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
      const p = await createProject(newProjectName, newProjectDesc);
      const wf = await createWorkflow(p.id, `${p.name} Workflow`);
      setShowModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      onOpenWorkflow(wf.id);
    } catch (err) {
      alert('Error creating project');
    }
  }

  async function handleEnhancePrompt() {
    if (!aiPrompt.trim()) return;
    setEnhancingPrompt(true);
    try {
      const enhanced = await enhanceAIPrompt(aiPrompt.trim());
      setAiPrompt(enhanced);
    } catch (err: any) {
      alert(err.message || 'Failed to improve prompt');
    } finally {
      setEnhancingPrompt(false);
    }
  }

  async function handleGeneratePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setLoadingPreview(true);
    try {
      const preview = await previewAIWorkflow(aiPrompt.trim());
      setAiPreview(preview);
      // Default select all edge cases
      const edgeCaseMap: Record<string, boolean> = {};
      preview.edgeCaseStates.forEach((s) => {
        edgeCaseMap[s.id] = true;
      });
      setSelectedEdgeCases(edgeCaseMap);
      setAiStep(2);
    } catch (err: any) {
      alert(err.message || 'Failed to generate preview');
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleBuildCustomAIWorkflow() {
    if (!aiPreview) return;
    setBuildingWorkflow(true);
    try {
      const activeEdgeStates = aiPreview.edgeCaseStates.filter((s) => selectedEdgeCases[s.id]);
      const activeEdgeStateIds = new Set(activeEdgeStates.map((s) => s.id));

      const allStates = [...aiPreview.coreStates, ...activeEdgeStates];
      
      const activeTransitions = [
        ...aiPreview.coreTransitions,
        ...aiPreview.edgeCaseTransitions.filter(
          (t) => (!t.from.startsWith('e') || activeEdgeStateIds.has(t.from)) &&
                 (!t.to.startsWith('e') || activeEdgeStateIds.has(t.to))
        )
      ];

      const createdWorkflow = await generateAIWorkflow(aiPrompt.trim(), {
        projectName: aiPreview.projectName,
        states: allStates,
        transitions: activeTransitions
      });

      setShowAIModal(false);
      resetAIModalState();
      onOpenWorkflow(createdWorkflow.id);
    } catch (err: any) {
      alert(err.message || 'Failed to build workflow');
    } finally {
      setBuildingWorkflow(false);
    }
  }

  function resetAIModalState() {
    setAiStep(1);
    setAiPrompt('');
    setAiPreview(null);
    setSelectedEdgeCases({});
  }

  function toggleEdgeCase(id: string) {
    setSelectedEdgeCases((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleAllEdgeCases(selectAll: boolean) {
    if (!aiPreview) return;
    const edgeCaseMap: Record<string, boolean> = {};
    aiPreview.edgeCaseStates.forEach((s) => {
      edgeCaseMap[s.id] = selectAll;
    });
    setSelectedEdgeCases(edgeCaseMap);
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

  const exampleKeywords = [
    'nfa regex',
    'saga',
    'payment gateway',
    'rideshare dispatch',
    'iot smart home',
    'e-commerce',
    'digital banking'
  ];
  const exampleProjects = projects.filter((p) =>
    exampleKeywords.some((k) => p.name.toLowerCase().includes(k))
  );
  const userProjects = projects.filter(
    (p) => !exampleKeywords.some((k) => p.name.toLowerCase().includes(k))
  );

  return (
    <div className="dashboard-container" style={{ position: 'relative', minHeight: '100vh', backgroundColor: 'var(--bg-main)', padding: '4rem 2rem', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', overflow: 'hidden' }}>
      
      {/* Interactive Mouse Grid Canvas */}
      <InteractiveGridBackground />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Header */}
        <header className="responsive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '2rem' }}>
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

          <div className="responsive-btn-group" style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => { resetAIModalState(); setShowAIModal(true); }}
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
                      onClick={() => { resetAIModalState(); setShowAIModal(true); }}
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
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
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

              <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--text-primary)', padding: '2.5rem', borderRadius: '0px', width: '620px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} style={{ color: 'var(--text-primary)' }} />
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    AI STATE MACHINE GENERATOR
                  </h2>
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                  STEP {aiStep} OF 2
                </div>
              </div>

              {aiStep === 1 ? (
                <form onSubmit={handleGeneratePreview}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
                        DESCRIBE YOUR APP IDEA
                      </label>
                      
                      <button
                        type="button"
                        onClick={handleEnhancePrompt}
                        disabled={enhancingPrompt || !aiPrompt.trim()}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-light)',
                          color: 'var(--text-primary)',
                          padding: '0.25rem 0.625rem',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          cursor: aiPrompt.trim() ? 'pointer' : 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          opacity: aiPrompt.trim() ? 1 : 0.5
                        }}
                      >
                        {enhancingPrompt ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                        {enhancingPrompt ? 'IMPROVING IDEA...' : 'IMPROVE IDEA'}
                      </button>
                    </div>

                    <textarea
                      required
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. music player, food delivery app, audio stream, user auth..."
                      rows={5}
                      style={{ width: '100%', padding: '0.75rem 0.875rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '0px', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      💡 Tip: Click <strong>"IMPROVE IDEA"</strong> to automatically expand a simple concept into a full workflow.
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowAIModal(false)}
                      disabled={loadingPreview}
                      style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '0px', cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={loadingPreview || !aiPrompt.trim()}
                      style={{ padding: '0.625rem 1.5rem', background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', borderRadius: '0px', fontWeight: 600, cursor: aiPrompt.trim() ? 'pointer' : 'not-allowed', fontSize: '0.8125rem', fontFamily: 'var(--font-display)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', opacity: aiPrompt.trim() ? 1 : 0.5 }}
                    >
                      {loadingPreview ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> ANALYZING STATES & EDGE CASES...
                        </>
                      ) : (
                        <>
                          NEXT: REVIEW STATES <ChevronRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    {aiPreview?.projectName}
                  </h3>
                  <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Gemini AI extracted core states and identified suggested edge cases below. Select which ones to include.
                  </p>

                  {/* Core States Summary */}
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>
                      CORE STATES ({aiPreview?.coreStates.length || 0})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {aiPreview?.coreStates.map((s) => (
                        <span key={s.id} style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', padding: '0.25rem 0.5rem', border: '1px solid var(--text-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                          {s.name} {s.isInitial ? '(INITIAL)' : ''} {s.isFinal ? '(FINAL)' : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Edge Cases Checklist */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
                        SUGGESTED EDGE CASES & FAILURE STATES
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => toggleAllEdgeCases(true)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Accept All
                        </button>
                        <span style={{ color: 'var(--border-light)' }}>|</span>
                        <button
                          type="button"
                          onClick={() => toggleAllEdgeCases(false)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Decline All
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
                      {aiPreview?.edgeCaseStates.map((s) => {
                        const isChecked = Boolean(selectedEdgeCases[s.id]);
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleEdgeCase(s.id)}
                            style={{
                              padding: '0.875rem',
                              border: `1px solid ${isChecked ? 'var(--text-primary)' : 'var(--border-light)'}`,
                              background: isChecked ? 'var(--bg-main)' : 'var(--bg-card)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.75rem',
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ marginTop: '0.125rem', color: isChecked ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                              {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {s.name}
                                </span>
                                {s.reason && (
                                  <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', padding: '0.1rem 0.375rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                                    {s.reason}
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {s.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setAiStep(1)}
                      disabled={buildingWorkflow}
                      style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '0px', cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}
                    >
                      ← EDIT PROMPT
                    </button>
                    <button
                      type="button"
                      onClick={handleBuildCustomAIWorkflow}
                      disabled={buildingWorkflow}
                      style={{ padding: '0.625rem 1.5rem', background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', borderRadius: '0px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'var(--font-display)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      {buildingWorkflow ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> CREATING WORKFLOW...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} /> ACCEPT & BUILD WORKFLOW
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Regular Manual New Project Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form className="responsive-modal" onSubmit={handleCreateProject} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--text-primary)', padding: '2.5rem', borderRadius: '0px', width: '420px', maxWidth: '90vw' }}>
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
