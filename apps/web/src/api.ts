import type { Project, Workflow, AnalysisResult, SimulationResult, TestSequence } from './types';

const API_BASE = '/api';

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function createWorkflow(projectId: string, name: string): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create workflow');
  return res.json();
}

export async function fetchWorkflow(id: string): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/workflows/${id}`);
  if (!res.ok) throw new Error('Failed to fetch workflow');
  return res.json();
}

export async function saveWorkflow(id: string, name: string, states: any[], transitions: any[]): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/workflows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, states, transitions })
  });
  if (!res.ok) throw new Error('Failed to save workflow');
  return res.json();
}

export async function analyzeWorkflow(id: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/workflows/${id}/analyze`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to analyze workflow');
  return res.json();
}

export async function simulateWorkflow(id: string, events: string[]): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/workflows/${id}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events })
  });
  if (!res.ok) throw new Error('Failed to simulate workflow');
  return res.json();
}

export async function generateTests(id: string): Promise<{ count: number; tests: TestSequence[] }> {
  const res = await fetch(`${API_BASE}/workflows/${id}/tests/generate`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate tests');
  return res.json();
}

export async function generateAIWorkflow(prompt: string): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/generate-ai-workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Invalid app description provided');
  }
  return res.json();
}

export async function convertNFAToDFA(id: string): Promise<{ result: any; workflow: Workflow }> {
  const res = await fetch(`${API_BASE}/workflows/${id}/nfa-to-dfa`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to convert NFA to DFA');
  }
  return res.json();
}

export async function minimizeDFA(id: string): Promise<{ result: any; workflow: Workflow }> {
  const res = await fetch(`${API_BASE}/workflows/${id}/minimize`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to minimize DFA');
  }
  return res.json();
}


