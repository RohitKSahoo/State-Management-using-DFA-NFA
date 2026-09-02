import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Workflow, WorkflowState, Transition, AnalysisResult, SimulationResult, TestSequence } from './types';
import { fetchWorkflow, saveWorkflow, analyzeWorkflow, simulateWorkflow, generateTests, convertNFAToDFA, minimizeDFA } from './api';
import { CustomStateNode } from './CustomNode';
import { ArrowLeft, Save, Play, Search, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, FileText, HelpCircle, Zap, Minimize2, X } from 'lucide-react';

interface EditorProps {
  workflowId: string;
  onBack: () => void;
}

export const WorkflowEditor: React.FC<EditorProps> = ({ workflowId, onBack }) => {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [tests, setTests] = useState<TestSequence[]>([]);
  const [simInput, setSimInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Active hover tooltip key
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showHelpMode, setShowHelpMode] = useState(false);

  // Custom Styled Result Modal & Comparison State
  const [modalConfig, setModalConfig] = useState<{ title: string; subtitle: string; details: string[]; badgeColor: string } | null>(null);
  const [nfaVersion, setNfaVersion] = useState<{ states: WorkflowState[]; transitions: Transition[] } | null>(null);
  const [dfaVersion, setDfaVersion] = useState<{ states: WorkflowState[]; transitions: Transition[] } | null>(null);
  const [minimizedVersion, setMinimizedVersion] = useState<{ states: WorkflowState[]; transitions: Transition[] } | null>(null);
  const [activeVersion, setActiveVersion] = useState<'NFA' | 'DFA' | 'MINIMIZED'>('NFA');

  const nodeTypes = useMemo(() => ({ customState: CustomStateNode }), []);

  useEffect(() => {
    loadWorkflow();
  }, [workflowId]);

  async function loadWorkflow() {
    try {
      const data = await fetchWorkflow(workflowId);
      setWorkflow(data);
      setNfaVersion({ states: data.states, transitions: data.transitions });
      initGraph(data.states, data.transitions);
    } catch (err) {
      alert('Failed to load workflow');
    }
  }

  function initGraph(states: WorkflowState[], transitions: Transition[]) {
    const flowNodes: Node[] = states.map((s) => ({
      id: s.id,
      type: 'customState',
      position: { x: s.positionX || 0, y: s.positionY || 0 },
      data: { label: s.name, isInitial: s.isInitial, isFinal: s.isFinal }
    }));

    const flowEdges: Edge[] = transitions.map((t) => ({
      id: t.id,
      source: t.fromStateId,
      target: t.toStateId,
      label: t.event,
      animated: true,
      style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 }
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      const eventName = prompt('Enter transition event name (e.g., submit, pay, cancel):');
      if (!eventName) return;
      const newEdge: Edge = {
        ...params,
        id: `e-${Date.now()}`,
        label: eventName.trim(),
        animated: true,
        style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    []
  );

  function handleAddNode() {
    const name = prompt('Enter state name (e.g., IDLE, PAYMENT, DONE):');
    if (!name) return;
    const newNode: Node = {
      id: `state-${Date.now()}`,
      type: 'customState',
      position: { x: 250 + Math.random() * 100, y: 150 + Math.random() * 100 },
      data: { label: name.trim().toUpperCase(), isInitial: nodes.length === 0, isFinal: false }
    };
    setNodes((nds) => [...nds, newNode]);
  }

  function handleToggleInitial(nodeId: string) {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isInitial: n.id === nodeId ? !n.data.isInitial : false
        }
      }))
    );
  }

  function handleToggleFinal(nodeId: string) {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isFinal: n.id === nodeId ? !n.data.isFinal : n.data.isFinal
        }
      }))
    );
  }

  function handleDeleteNode(nodeId: string) {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const states: WorkflowState[] = nodes.map((n) => ({
        id: n.id,
        workflowId,
        name: n.data.label as string,
        isInitial: !!n.data.isInitial,
        isFinal: !!n.data.isFinal,
        positionX: n.position.x,
        positionY: n.position.y
      }));

      const transitions: Transition[] = edges.map((e) => ({
        id: e.id,
        workflowId,
        fromStateId: e.source,
        toStateId: e.target,
        event: (e.label as string) || 'UNKNOWN'
      }));

      await saveWorkflow(workflowId, workflow?.name || 'Workflow', states, transitions);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyze() {
    await handleSave();
    try {
      const res = await analyzeWorkflow(workflowId);
      setAnalysis(res);
    } catch (err) {
      alert('Analysis failed');
    }
  }

  async function handleSimulate(overrideSeq?: string) {
    await handleSave();
    const raw = typeof overrideSeq === 'string' ? overrideSeq : simInput;
    const events = raw.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      const res = await simulateWorkflow(workflowId, events);
      setSimulation(res);

      if (res.currentStateId) {
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              isCurrentSim: n.id === res.currentStateId
            }
          }))
        );
      }
    } catch (err) {
      alert('Simulation failed');
    }
  }

  async function handleGenerateTests() {
    await handleSave();
    try {
      const res = await generateTests(workflowId);
      setTests(res.tests);
    } catch (err) {
      alert('Test generation failed');
    }
  }

  async function handleConvertNFA() {
    await handleSave();
    try {
      const res = await convertNFAToDFA(workflowId);
      setDfaVersion({ states: res.workflow.states, transitions: res.workflow.transitions });
      initGraph(res.workflow.states, res.workflow.transitions);
      setActiveVersion('DFA');

      setModalConfig({
        title: 'NFA → DFA CONVERSION SUCCESSFUL',
        subtitle: 'Subset Construction (Powerset) Algorithm',
        details: [
          `Original NFA States: ${res.result.originalNFAStateCount}`,
          `Converted DFA States: ${res.result.convertedDFAStateCount}`,
          `Determinism: Guaranteed 0 Ambiguity`,
          `Powerset Mappings: ${res.result.subsetMap.map((m: any) => `${m.dfaStateName} (${m.nfaStateIds.length} states)`).slice(0, 3).join(', ')}...`
        ],
        badgeColor: '#f59e0b'
      });
    } catch (err: any) {
      setModalConfig({
        title: 'NFA → DFA CONVERSION FAILED',
        subtitle: 'Automata Validation Exception',
        details: [
          `Error Reason: ${err.message || 'No initial state defined or invalid graph structure.'}`,
          `Required Fix: Ensure your workflow graph has at least 1 Initial State ($q_0$) before converting.`
        ],
        badgeColor: '#ef4444'
      });
    }
  }

  async function handleMinimize() {
    await handleSave();
    try {
      const res = await minimizeDFA(workflowId);
      setMinimizedVersion({ states: res.workflow.states, transitions: res.workflow.transitions });
      initGraph(res.workflow.states, res.workflow.transitions);
      setActiveVersion('MINIMIZED');

      setModalConfig({
        title: 'HOPCROFT STATE MINIMIZATION COMPLETE',
        subtitle: 'Canonical Minimization Algorithm',
        details: [
          `Original States: ${res.result.originalStateCount}`,
          `Minimized States: ${res.result.minimizedStateCount}`,
          `Merged Groups: ${res.result.mergedGroups.map((g: any) => g.mergedName).slice(0, 3).join(', ')}...`,
          `Memory Reduction: ${Math.round((1 - res.result.minimizedStateCount / (res.result.originalStateCount || 1)) * 100)}% Overhead Saved`
        ],
        badgeColor: '#6366f1'
      });
    } catch (err: any) {
      setModalConfig({
        title: 'HOPCROFT MINIMIZATION FAILED',
        subtitle: 'Minimization Engine Exception',
        details: [
          `Error Reason: ${err.message || 'Workflow graph has invalid structure or no states.'}`,
          `Required Fix: Add states and transitions before running Hopcroft minimization.`
        ],
        badgeColor: '#ef4444'
      });
    }
  }

  function handleSwitchVersion(version: 'NFA' | 'DFA' | 'MINIMIZED') {
    setActiveVersion(version);
    if (version === 'NFA' && nfaVersion) {
      initGraph(nfaVersion.states, nfaVersion.transitions);
    } else if (version === 'DFA' && dfaVersion) {
      initGraph(dfaVersion.states, dfaVersion.transitions);
    } else if (version === 'MINIMIZED' && minimizedVersion) {
      initGraph(minimizedVersion.states, minimizedVersion.transitions);
    }
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-main)', fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
      {/* Header Bar */}
      <header style={{ height: '60px', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Back to Projects">
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} style={{ color: 'var(--text-primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '1rem', fontFamily: 'var(--font-display)' }}>{workflow?.name || 'Notebook Workflow'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          
          {/* VERSION COMPARISON TABS */}
          {nfaVersion && (
            <div style={{ display: 'flex', border: '1px solid var(--border-light)', backgroundColor: '#121212', padding: '2px', marginRight: '0.5rem' }}>
              <button
                onClick={() => handleSwitchVersion('NFA')}
                style={{
                  padding: '0.25rem 0.625rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  border: 'none',
                  background: activeVersion === 'NFA' ? 'var(--text-primary)' : 'transparent',
                  color: activeVersion === 'NFA' ? 'var(--bg-main)' : 'var(--text-tertiary)',
                  cursor: 'pointer'
                }}
              >
                NFA VERSION
              </button>
              {dfaVersion && (
                <button
                  onClick={() => handleSwitchVersion('DFA')}
                  style={{
                    padding: '0.25rem 0.625rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    border: 'none',
                    background: activeVersion === 'DFA' ? '#f59e0b' : 'transparent',
                    color: activeVersion === 'DFA' ? '#000000' : 'var(--text-tertiary)',
                    cursor: 'pointer'
                  }}
                >
                  DFA VERSION
                </button>
              )}
              {minimizedVersion && (
                <button
                  onClick={() => handleSwitchVersion('MINIMIZED')}
                  style={{
                    padding: '0.25rem 0.625rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    border: 'none',
                    background: activeVersion === 'MINIMIZED' ? '#6366f1' : 'transparent',
                    color: activeVersion === 'MINIMIZED' ? '#ffffff' : 'var(--text-tertiary)',
                    cursor: 'pointer'
                  }}
                >
                  MINIMIZED DFA
                </button>
              )}
            </div>
          )}
          
          {/* SPECIAL ENGINE FEATURES BADGES */}
          {/* NFA -> DFA CONVERT BUTTON & BUBBLE */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleConvertNFA}
              onMouseEnter={() => showHelpMode && setActiveTooltip('nfa')}
              onMouseLeave={() => setActiveTooltip(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', background: '#1c1917', border: '1px solid #f59e0b', color: '#fbbf24', borderRadius: '0px', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)' }}
            >
              <Zap size={14} /> NFA → DFA
            </button>

            {showHelpMode && activeTooltip === 'nfa' && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '10px', width: '240px', background: '#121212', border: '1px solid #f59e0b', padding: '0.625rem 0.875rem', color: '#ffffff', fontSize: '0.75rem', lineHeight: 1.4, zIndex: 100, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                <strong>Special Feature: NFA → DFA</strong><br />Runs Subset Construction algorithm to resolve nondeterministic & epsilon transitions.
              </div>
            )}
          </div>

          {/* HOPCROFT MINIMIZATION BUTTON & BUBBLE */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleMinimize}
              onMouseEnter={() => showHelpMode && setActiveTooltip('minimize')}
              onMouseLeave={() => setActiveTooltip(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', background: '#1e1b4b', border: '1px solid #6366f1', color: '#a5b4fc', borderRadius: '0px', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)' }}
            >
              <Minimize2 size={14} /> MINIMIZE DFA
            </button>

            {showHelpMode && activeTooltip === 'minimize' && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '10px', width: '240px', background: '#121212', border: '1px solid #6366f1', padding: '0.625rem 0.875rem', color: '#ffffff', fontSize: '0.75rem', lineHeight: 1.4, zIndex: 100, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                <strong>Special Feature: Hopcroft Minimization</strong><br />Merges equivalent redundant states into their minimal canonical form.
              </div>
            )}
          </div>

          {/* HELP Toggle Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowHelpMode(!showHelpMode);
                setActiveTooltip(null);
              }}
              onMouseEnter={() => setActiveTooltip('help')}
              onMouseLeave={() => setActiveTooltip(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.4rem 0.875rem',
                background: showHelpMode ? 'var(--text-primary)' : 'transparent',
                color: showHelpMode ? 'var(--bg-main)' : 'var(--text-primary)',
                border: '1px solid var(--text-primary)',
                borderRadius: '0px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-display)'
              }}
            >
              <HelpCircle size={14} /> {showHelpMode ? 'HELP MODE ON' : 'HELP GUIDES'}
            </button>
            
            {activeTooltip === 'help' && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', width: '220px', background: '#121212', border: '1px solid var(--text-primary)', padding: '0.625rem 0.875rem', color: '#fff', fontSize: '0.75rem', lineHeight: 1.4, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                <strong>Help Guides:</strong> Toggle Help Mode to enable or disable text bubbles over buttons!
              </div>
            )}
          </div>

          {/* SAVE BUTTON & BUBBLE */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              onMouseEnter={() => showHelpMode && setActiveTooltip('save')}
              onMouseLeave={() => setActiveTooltip(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: '0px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' }}
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>

            {showHelpMode && activeTooltip === 'save' && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '10px', width: '200px', background: '#121212', border: '1px solid var(--text-primary)', padding: '0.625rem 0.875rem', color: '#ffffff', fontSize: '0.75rem', lineHeight: 1.4, zIndex: 100, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                <strong>Save Button:</strong><br />Saves graph states & transitions to local database.
              </div>
            )}
          </div>

          {/* ANALYZE BUTTON & BUBBLE */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleAnalyze}
              onMouseEnter={() => showHelpMode && setActiveTooltip('analyze')}
              onMouseLeave={() => setActiveTooltip(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', borderRadius: '0px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' }}
            >
              <Search size={14} /> Analyze
            </button>

            {showHelpMode && activeTooltip === 'analyze' && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '10px', width: '220px', background: '#121212', border: '1px solid var(--text-primary)', padding: '0.625rem 0.875rem', color: '#ffffff', fontSize: '0.75rem', lineHeight: 1.4, zIndex: 100, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                <strong>Analyze Button:</strong><br />Audits graph for missing start nodes, collisions, or dead ends.
              </div>
            )}
          </div>

          {/* GENERATE TESTS BUTTON & BUBBLE */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleGenerateTests}
              onMouseEnter={() => showHelpMode && setActiveTooltip('tests')}
              onMouseLeave={() => setActiveTooltip(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: '0px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' }}
            >
              <RefreshCw size={14} /> Generate Tests
            </button>

            {showHelpMode && activeTooltip === 'tests' && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', width: '220px', background: '#121212', border: '1px solid var(--text-primary)', padding: '0.625rem 0.875rem', color: '#ffffff', fontSize: '0.75rem', lineHeight: 1.4, zIndex: 100, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                <strong>Generate Tests:</strong><br />Calculates shortest valid execution traces and invalid test suites.
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Workspace Grid & Side Audit Inspector */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Canvas Graph Editor */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#333" gap={24} size={1} />
            <Controls style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)', color: 'var(--text-primary)', borderRadius: '0px' }} />
          </ReactFlow>

          {/* Floating Canvas Controls & BUBBLE */}
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: '0.5rem', zIndex: 10 }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={handleAddNode}
                onMouseEnter={() => showHelpMode && setActiveTooltip('addNode')}
                onMouseLeave={() => setActiveTooltip(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', borderRadius: '0px', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'var(--font-display)', cursor: 'pointer' }}
              >
                <Plus size={14} /> ADD STATE NODE
              </button>

              {showHelpMode && activeTooltip === 'addNode' && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '10px', width: '220px', background: '#121212', border: '1px solid var(--text-primary)', padding: '0.625rem 0.875rem', color: '#ffffff', fontSize: '0.75rem', lineHeight: 1.4, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                  <strong>Add State Node:</strong><br />Creates a new state bubble (e.g. IDLE, CART, PAID) on your diagram canvas.
                </div>
              )}
            </div>
          </div>

          {/* Floating State Color Legend Badge */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '0.75rem 1rem', borderRadius: '0px', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', zIndex: 10, display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>LEGEND:</span>
            <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>■ Start ($q_0$)</span>
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>■ Final ($F$)</span>
            <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>■ Transaction</span>
            <span style={{ color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>■ Processing</span>
            <span style={{ color: '#fb923c', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>■ Exception</span>
          </div>
        </div>

        {/* Right Inspector & Audit Panel */}
        <div style={{ width: '380px', borderLeft: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Node Inspector */}
          <section>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>NODE INSPECTOR</h3>
            {selectedNode ? (
              <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: '0px' }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>{selectedNode.data.label as string}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!selectedNode.data.isInitial} onChange={() => handleToggleInitial(selectedNode.id)} />
                    Set as Initial State (q0)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!selectedNode.data.isFinal} onChange={() => handleToggleFinal(selectedNode.id)} />
                    Set as Final / Accepting State (F)
                  </label>
                </div>
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', width: '100%', justifyContent: 'center', padding: '0.5rem', background: '#3b1212', color: '#ff6b6b', border: 'none', borderRadius: '0px', fontSize: '0.8125rem', cursor: 'pointer' }}
                >
                  <Trash2 size={14} /> DELETE STATE
                </button>
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontStyle: 'italic' }}>Click any state node in the graph to inspect properties.</div>
            )}
          </section>

          {/* Analysis Report */}
          <section style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>STATIC AUTOMATA AUDIT</h3>
            {analysis ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: analysis.valid ? '#4ade80' : '#f87171' }}>
                  {analysis.valid ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {analysis.valid ? 'Automaton Deterministic & Valid' : 'DFA Violations Detected'}
                </div>

                {analysis.errors.length > 0 && (
                  <div style={{ background: '#261212', border: '1px solid #5c1d1d', padding: '0.75rem', borderRadius: '0px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f87171', marginBottom: '0.375rem' }}>ERRORS:</div>
                    {analysis.errors.map((e, idx) => (
                      <div key={idx} style={{ fontSize: '0.8125rem', color: '#fca5a5', marginBottom: '0.25rem' }}>• {e}</div>
                    ))}
                  </div>
                )}

                {analysis.warnings.length > 0 && (
                  <div style={{ background: '#262012', border: '1px solid #5c4b1d', padding: '0.75rem', borderRadius: '0px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24', marginBottom: '0.375rem' }}>WARNINGS:</div>
                    {analysis.warnings.map((w, idx) => (
                      <div key={idx} style={{ fontSize: '0.8125rem', color: '#fde68a', marginBottom: '0.25rem' }}>• {w}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Click "Analyze" to run DFA determinism & reachability static audit.</div>
            )}
          </section>

          {/* Event Simulator & BUBBLE */}
          <section style={{ position: 'relative', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>EVENT SEQUENCE SIMULATOR</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                placeholder="e.g. submit_cart, pay"
                style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', fontSize: '0.8125rem', borderRadius: '0px', fontFamily: 'var(--font-mono)' }}
              />
              <div style={{ position: 'relative' }}>
                <button
                  onClick={handleSimulate}
                  onMouseEnter={() => showHelpMode && setActiveTooltip('simulate')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  style={{ padding: '0.5rem 0.875rem', background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem', borderRadius: '0px', fontFamily: 'var(--font-display)' }}
                >
                  <Play size={14} />
                </button>

                {showHelpMode && activeTooltip === 'simulate' && (
                  <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '10px', width: '210px', background: '#121212', border: '1px solid var(--text-primary)', padding: '0.625rem 0.875rem', color: '#ffffff', fontSize: '0.75rem', lineHeight: 1.4, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                    <strong>Simulate Action:</strong><br />Executes sequence of comma-separated events step-by-step.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Event Chip Suggestions & Full Sequence Presets */}
            {edges.length > 0 && (
              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                {/* Full Sequence Presets */}
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#4ade80', fontFamily: 'var(--font-mono)', marginBottom: '0.375rem', fontWeight: 600 }}>
                    ⚡ COMPLETE SEQUENCE PRESETS (CLICK TO RUN DIRECTLY):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {(tests.length > 0 ? tests : [
                      { type: 'ACCEPTANCE_PATH', events: Array.from(new Set(edges.map(e => e.label as string))).slice(0, 4) }
                    ]).map((seq, idx) => {
                      const eventStr = Array.isArray(seq.events) ? seq.events.join(', ') : '';
                      if (!eventStr) return null;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSimInput(eventStr);
                            handleSimulate(eventStr);
                          }}
                          style={{
                            padding: '0.3rem 0.6rem',
                            background: '#142918',
                            border: '1px solid #22c55e',
                            color: '#86efac',
                            fontSize: '0.6875rem',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                            borderRadius: '0px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Click to populate and execute full sequence directly"
                        >
                          <Play size={10} /> {eventStr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Event Chips */}
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '0.375rem' }}>
                    + INDIVIDUAL EVENT CHIPS:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {Array.from(new Set(edges.map((e) => (e.label as string) || '').filter(Boolean))).map((evt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const trimmed = simInput.trim();
                          if (!trimmed) {
                            setSimInput(evt);
                          } else if (trimmed.endsWith(',')) {
                            setSimInput(`${trimmed} ${evt}`);
                          } else {
                            setSimInput(`${trimmed}, ${evt}`);
                          }
                        }}
                        style={{
                          padding: '0.2rem 0.5rem',
                          background: '#18181b',
                          border: '1px solid var(--border-light)',
                          color: '#a1a1aa',
                          fontSize: '0.6875rem',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                          borderRadius: '0px'
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.borderColor = 'var(--text-primary)';
                          (e.target as HTMLElement).style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.borderColor = 'var(--border-light)';
                          (e.target as HTMLElement).style.color = '#a1a1aa';
                        }}
                      >
                        + {evt}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {simulation && (
              <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '0.75rem', borderRadius: '0px', fontSize: '0.8125rem' }}>
                <div style={{ color: simulation.accepted ? '#4ade80' : '#f87171', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {simulation.accepted ? '✓ Sequence Accepted' : '✗ Sequence Rejected'}
                </div>
                {simulation.failureReason && (
                  <div style={{ color: '#f87171', fontSize: '0.75rem', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                    Reason: {simulation.failureReason}
                  </div>
                )}
                <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  Path: {simulation.path && simulation.path.length > 0 ? simulation.path.map((step) => step.fromStateId).concat(simulation.currentStateId).join(' → ') : (simulation.currentStateId || 'Initial State')}
                </div>
              </div>
            )}
          </section>

          {/* Generated Test Cases */}
          {tests.length > 0 && (
            <section style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>GENERATED TEST SUITES ({tests.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {tests.map((t, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '0.5rem 0.75rem', borderRadius: '0px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ color: t.expectedResult === 'ACCEPT' ? '#4ade80' : '#f87171', fontWeight: 600 }}>{t.name} [{t.expectedResult}]</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>[{t.events.join(', ')}]</div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>

      {/* CUSTOM IN-APP ALGORITHM RESULT POPUP MODAL */}
      {modalConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '480px',
            backgroundColor: '#09090b',
            border: `1px solid ${modalConfig.badgeColor}`,
            padding: '1.75rem',
            borderRadius: '0px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
            position: 'relative',
            fontFamily: 'var(--font-body)',
            margin: 'auto'
          }}>
            <button
              onClick={() => setModalConfig(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'inline-block', padding: '0.25rem 0.5rem', backgroundColor: `${modalConfig.badgeColor}22`, border: `1px solid ${modalConfig.badgeColor}`, color: modalConfig.badgeColor, fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
              SPECIAL AUTOMATA ENGINE RESULT
            </div>

            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
              {modalConfig.title}
            </h2>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.8125rem', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
              {modalConfig.subtitle}
            </p>

            <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '1rem', marginBottom: '1.25rem' }}>
              {modalConfig.details.map((detail, idx) => (
                <div key={idx} style={{ fontSize: '0.8125rem', color: '#e4e4e7', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                  • {detail}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalConfig(null)}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: modalConfig.badgeColor,
                  color: '#000000',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)'
                }}
              >
                PROCEED TO CANVAS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
