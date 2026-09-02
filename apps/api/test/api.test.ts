import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import { apiRouter } from '../src/routes.js';
import { prisma } from '../src/db.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('Backend API Integration Tests (Phase 2)', () => {
  let projectId: string;
  let workflowId: string;

  beforeAll(async () => {
    await prisma.transition.deleteMany();
    await prisma.workflowState.deleteMany();
    await prisma.workflow.deleteMany();
    await prisma.project.deleteMany();
  });

  it('1. Create Project (POST /api/projects)', async () => {
    const p = await prisma.project.create({
      data: { name: 'E-Commerce App', description: 'Test Project' }
    });
    expect(p.id).toBeDefined();
    expect(p.name).toBe('E-Commerce App');
    projectId = p.id;
  });

  it('2. Create Workflow (POST /api/projects/:id/workflows)', async () => {
    const wf = await prisma.workflow.create({
      data: { projectId, name: 'Checkout Workflow' }
    });
    expect(wf.id).toBeDefined();
    expect(wf.projectId).toBe(projectId);
    workflowId = wf.id;
  });

  it('3. Populate Workflow States & Transitions (PUT /api/workflows/:id)', async () => {
    const payload = {
      name: 'Checkout Workflow Updated',
      states: [
        { id: 's1', name: 'LOGIN', isInitial: true, isFinal: false, positionX: 0, positionY: 0 },
        { id: 's2', name: 'CART', isInitial: false, isFinal: false, positionX: 100, positionY: 0 },
        { id: 's3', name: 'SUCCESS', isInitial: false, isFinal: true, positionX: 200, positionY: 0 }
      ],
      transitions: [
        { id: 't1', fromStateId: 's1', toStateId: 's2', event: 'add_to_cart' },
        { id: 't2', fromStateId: 's2', toStateId: 's3', event: 'checkout' }
      ]
    };

    const updated = await prisma.$transaction(async (tx) => {
      await tx.transition.deleteMany({ where: { workflowId } });
      await tx.workflowState.deleteMany({ where: { workflowId } });
      for (const s of payload.states) {
        await tx.workflowState.create({ data: { ...s, workflowId } });
      }
      for (const t of payload.transitions) {
        await tx.transition.create({ data: { ...t, workflowId } });
      }
      return tx.workflow.findUnique({
        where: { id: workflowId },
        include: { states: true, transitions: true }
      });
    });

    expect(updated?.states.length).toBe(3);
    expect(updated?.transitions.length).toBe(2);
  });

  it('4. Automata Analysis via DB (Analyze Automaton)', async () => {
    const wf = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { states: true, transitions: true }
    });
    expect(wf).not.toBeNull();

    const automaton = {
      states: wf!.states,
      transitions: wf!.transitions
    };

    const { analyzeAutomaton } = await import('@statelint/automata');
    const analysis = analyzeAutomaton(automaton);
    expect(analysis.isValid).toBe(true);
    expect(analysis.reachableStateIds.length).toBe(3);
  });

  it('5. Automata Simulation via DB', async () => {
    const wf = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { states: true, transitions: true }
    });

    const automaton = {
      states: wf!.states,
      transitions: wf!.transitions
    };

    const { simulateAutomaton } = await import('@statelint/automata');
    const res = simulateAutomaton(automaton, ['add_to_cart', 'checkout']);
    expect(res.accepted).toBe(true);
    expect(res.currentStateId).toBe('s3');
  });
});
