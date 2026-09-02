import React, { useState } from 'react';
import { ArrowRight, HelpCircle, X, CheckCircle, Terminal } from 'lucide-react';
import { InteractiveGridBackground } from './InteractiveGrid';

interface LandingProps {
  onProceed: () => void;
}

export const LandingPage: React.FC<LandingProps> = ({ onProceed }) => {
  const [showGuideModal, setShowGuideModal] = useState(false);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', padding: '5rem 2rem 8rem', overflow: 'hidden' }}>
      
      {/* Mouse Interactive Grid Canvas Background */}
      <InteractiveGridBackground />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Editorial Top Mark */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '6rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>
            STATELINT / AUTOMATA AUDITOR
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            VER 1.0 (DFA)
          </div>
        </div>

        {/* Sharp High-Craft Hero */}
        <section style={{ marginBottom: '7rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '4.5rem',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: '0 0 2.5rem 0',
              color: 'var(--text-primary)'
            }}
          >
            Mathematical rigour for application state machines.
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '4rem', alignItems: 'start' }}>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontWeight: 400 }}>
              StateLint models application workflows as formal Deterministic Finite Automata (DFA). It statically identifies missing start nodes, non-deterministic transition collisions, unreachable paths, and dead ends before execution.
            </p>

            <div style={{ borderLeft: '2px solid var(--text-primary)', paddingLeft: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
                DIRECTIVE
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Verify system determinism, simulate event vectors, and export bounded test suites.
              </div>

              <button
                onClick={onProceed}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  backgroundColor: 'var(--text-primary)',
                  color: 'var(--bg-main)',
                  border: 'none',
                  padding: '0.875rem 1.75rem',
                  borderRadius: '0px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.05em',
                  cursor: 'pointer'
                }}
              >
                OPEN WORKSPACE <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Updated Footer Section: Learn How to Use StateLint */}
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '3rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontStyle: 'italic' }}>New to StateLint?</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Learn how to model, lint, and simulate state machines in 4 simple steps.</div>
          </div>

          <button
            onClick={() => setShowGuideModal(true)}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--text-primary)',
              padding: '0.875rem 2rem',
              borderRadius: '0px',
              fontWeight: 700,
              fontSize: '0.875rem',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <HelpCircle size={16} /> HOW TO USE STATELINT
          </button>
        </section>

        {/* Simple & Direct English Guide Pop-Up Modal */}
        {showGuideModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--text-primary)', padding: '2.5rem', width: '640px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '0px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>How to Use StateLint</h2>
                <button onClick={() => setShowGuideModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-tertiary)', paddingTop: '2px' }}>01</div>
                  <div>
                    <strong>Create or Select a Project</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      Click "Open Workspace" to access your dashboard. You can create a fresh custom project or explore pre-loaded benchmarks like E-Commerce or Digital Banking.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-tertiary)', paddingTop: '2px' }}>02</div>
                  <div>
                    <strong>Build Your State Diagram</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      Inside the editor, add state nodes (e.g. LOGIN, CART, PAYMENT) and draw transition lines between them by connecting nodes. Name each action/event (e.g. submit_payment). Mark one state as <em>Initial</em> and target end states as <em>Final</em>.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-tertiary)', paddingTop: '2px' }}>03</div>
                  <div>
                    <strong>Click "Analyze" to Find Errors</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      StateLint will instantly scan your diagram and highlight problems: unreachable screens, dead-end states, conflicting duplicate events, or infinite loops.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-tertiary)', paddingTop: '2px' }}>04</div>
                  <div>
                    <strong>Simulate & Generate Tests</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      Type a sequence of user actions (e.g. login, add_item, checkout) into the simulator to test if it reaches a final state. Click "Generate Tests" to automatically get valid and invalid test suites for your code.
                    </div>
                  </div>
                </div>

              </div>

              <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={() => setShowGuideModal(false)}
                  style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}
                >
                  CLOSE
                </button>
                <button
                  onClick={() => {
                    setShowGuideModal(false);
                    onProceed();
                  }}
                  style={{ padding: '0.625rem 1.5rem', background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}
                >
                  PROCEED TO WORKSPACE →
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
