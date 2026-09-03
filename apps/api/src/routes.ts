import { Router } from 'express';
import { prisma } from './db.js';
import { seedDatabase } from './seedData.js';
import { analyzeAutomaton, simulateAutomaton, generateTestSequences, convertNFAToDFA, minimizeDFA, Automaton } from '@statelint/automata';

export const apiRouter = Router();

// --- Projects CRUD ---
apiRouter.post('/projects', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const project = await prisma.project.create({
      data: { name, description }
    });
    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/projects', async (_req, res) => {
  try {
    let projects = await prisma.project.findMany({
      include: { workflows: true },
      orderBy: { updatedAt: 'desc' }
    });

    if (projects.length === 0) {
      // Auto-populate default benchmark projects if DB is clean/empty
      await seedDatabase(prisma);
      projects = await prisma.project.findMany({
        include: { workflows: true },
        orderBy: { updatedAt: 'desc' }
      });
    }

    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/projects/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { workflows: { include: { states: true, transitions: true } } }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/projects/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name, description }
    });
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/projects/:id', async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Workflows CRUD & Actions ---
apiRouter.post('/projects/:id/workflows', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Workflow name is required' });

    const workflow = await prisma.workflow.create({
      data: {
        projectId: req.params.id,
        name
      },
      include: { states: true, transitions: true }
    });
    res.status(201).json(workflow);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/workflows/:id', async (req, res) => {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id },
      include: { states: true, transitions: true }
    });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    res.json(workflow);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save/Update Workflow States & Transitions (Full Sync)
apiRouter.put('/workflows/:id', async (req, res) => {
  try {
    const { name, states, transitions } = req.body;
    const workflowId = req.params.id;

    // Use transaction to replace states and transitions cleanly
    const updated = await prisma.$transaction(async (tx: any) => {
      if (name) {
        await tx.workflow.update({
          where: { id: workflowId },
          data: { name }
        });
      }

      // Delete existing states/transitions for workflow
      await tx.transition.deleteMany({ where: { workflowId } });
      await tx.workflowState.deleteMany({ where: { workflowId } });

      // Create new states
      if (states && Array.isArray(states)) {
        for (const s of states) {
          await tx.workflowState.create({
            data: {
              id: s.id,
              workflowId,
              name: s.name,
              isInitial: Boolean(s.isInitial),
              isFinal: Boolean(s.isFinal),
              positionX: s.positionX ?? 0,
              positionY: s.positionY ?? 0
            }
          });
        }
      }

      // Create new transitions
      if (transitions && Array.isArray(transitions)) {
        for (const t of transitions) {
          await tx.transition.create({
            data: {
              id: t.id,
              workflowId,
              fromStateId: t.fromStateId,
              toStateId: t.toStateId,
              event: t.event
            }
          });
        }
      }

      return tx.workflow.findUnique({
        where: { id: workflowId },
        include: { states: true, transitions: true }
      });
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/workflows/:id', async (req, res) => {
  try {
    await prisma.workflow.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Automata Integration Endpoints ---
async function fetchWorkflowAutomaton(workflowId: string): Promise<Automaton | null> {
  const wf = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { states: true, transitions: true }
  });
  if (!wf) return null;

  return {
    states: wf.states.map((s: any) => ({
      id: s.id,
      name: s.name,
      isInitial: s.isInitial,
      isFinal: s.isFinal
    })),
    transitions: wf.transitions.map((t: any) => ({
      id: t.id,
      fromStateId: t.fromStateId,
      toStateId: t.toStateId,
      event: t.event
    }))
  };
}

apiRouter.post('/workflows/:id/analyze', async (req, res) => {
  try {
    const automaton = await fetchWorkflowAutomaton(req.params.id);
    if (!automaton) return res.status(404).json({ error: 'Workflow not found' });

    const result = analyzeAutomaton(automaton);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/workflows/:id/simulate', async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) return res.status(400).json({ error: 'events array is required' });

    const automaton = await fetchWorkflowAutomaton(req.params.id);
    if (!automaton) return res.status(404).json({ error: 'Workflow not found' });

    const result = simulateAutomaton(automaton, events);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/workflows/:id/tests/generate', async (req, res) => {
  try {
    const automaton = await fetchWorkflowAutomaton(req.params.id);
    if (!automaton) return res.status(404).json({ error: 'Workflow not found' });

    const tests = generateTestSequences(automaton);
    res.json({ count: tests.length, tests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI Workflow Generator Endpoints ---

apiRouter.post('/ai/enhance-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return res.status(400).json({ error: 'Prompt must be at least 3 characters long.' });
    }
    const { enhanceUserPrompt } = await import('./services/llmService.js');
    const enhancedPrompt = await enhanceUserPrompt(prompt.trim());
    return res.json({ enhancedPrompt });
  } catch (err: any) {
    console.error('Enhance prompt API error:', err);
    return res.status(500).json({ error: 'Failed to enhance prompt.' });
  }
});

apiRouter.post('/ai/preview-workflow', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a valid application description.' });
    }
    const { generateLLMWorkflowPreview } = await import('./services/llmService.js');
    const preview = await generateLLMWorkflowPreview(prompt.trim());
    return res.json(preview);
  } catch (err: any) {
    console.error('Preview workflow API error:', err);
    return res.status(500).json({ error: 'Failed to generate workflow preview.' });
  }
});

apiRouter.post('/generate-ai-workflow', async (req, res) => {
  try {
    const { prompt, projectName, states, transitions } = req.body;

    let finalProjectName = projectName || 'AI Generated App Workflow';
    let rawStates: { id: string; name: string; isInitial: boolean; isFinal: boolean }[] = [];
    let rawTransitions: { from: string; to: string; event: string }[] = [];

    if (states && Array.isArray(states) && states.length > 0) {
      rawStates = states;
      rawTransitions = transitions || [];
    } else {
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
        return res.status(400).json({ error: 'Please provide a valid application flow description.' });
      }
      const { generateLLMWorkflowPreview } = await import('./services/llmService.js');
      const preview = await generateLLMWorkflowPreview(prompt.trim());
      finalProjectName = preview.projectName;
      rawStates = [...preview.coreStates, ...preview.edgeCaseStates];
      rawTransitions = [...preview.coreTransitions, ...preview.edgeCaseTransitions];
    }

    // Ensure at least one initial state exists
    if (!rawStates.some(s => s.isInitial) && rawStates.length > 0) {
      rawStates[0].isInitial = true;
    }

    // Calculate grid positions for states dynamically
    const statesWithPositions = rawStates.map((s, idx) => ({
      ...s,
      positionX: 150 + (idx % 3) * 260,
      positionY: 120 + Math.floor(idx / 3) * 180
    }));

    // Create DB Project & Workflow
    const newProject = await prisma.project.create({
      data: {
        name: finalProjectName,
        description: prompt ? `Generated from prompt: "${prompt}"` : 'AI Generated Workflow'
      }
    });

    const newWorkflow = await prisma.workflow.create({
      data: {
        projectId: newProject.id,
        name: `${finalProjectName} Graph`
      }
    });

    // Create states in DB
    const stateIdMap: Record<string, string> = {};
    for (const s of statesWithPositions) {
      const createdState = await prisma.workflowState.create({
        data: {
          workflowId: newWorkflow.id,
          name: s.name,
          isInitial: Boolean(s.isInitial),
          isFinal: Boolean(s.isFinal),
          positionX: s.positionX,
          positionY: s.positionY
        }
      });
      stateIdMap[s.id] = createdState.id;
    }

    // Create transitions in DB
    for (const t of rawTransitions) {
      const fromId = stateIdMap[t.from] || t.from;
      const toId = stateIdMap[t.to] || t.to;
      if (fromId && toId) {
        await prisma.transition.create({
          data: {
            workflowId: newWorkflow.id,
            fromStateId: fromId,
            toStateId: toId,
            event: t.event
          }
        });
      }
    }

    const result = await prisma.workflow.findUnique({
      where: { id: newWorkflow.id },
      include: { states: true, transitions: true }
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Advanced Engine Feature Endpoints ---
apiRouter.post('/workflows/:id/nfa-to-dfa', async (req, res) => {
  try {
    const automaton = await fetchWorkflowAutomaton(req.params.id);
    if (!automaton) return res.status(404).json({ error: 'Workflow not found' });

    const nfaResult = convertNFAToDFA(automaton);

    // Save converted DFA directly to DB
    const workflowId = req.params.id;
    await prisma.$transaction(async (tx: any) => {
      await tx.transition.deleteMany({ where: { workflowId } });
      await tx.workflowState.deleteMany({ where: { workflowId } });

      const stateMap: Record<string, string> = {};

      for (const s of nfaResult.automaton.states) {
        const created = await tx.workflowState.create({
          data: {
            workflowId,
            name: s.name,
            isInitial: Boolean(s.isInitial),
            isFinal: Boolean(s.isFinal),
            positionX: s.positionX ?? 0,
            positionY: s.positionY ?? 0
          }
        });
        stateMap[s.id] = created.id;
      }

      for (const t of nfaResult.automaton.transitions) {
        await tx.transition.create({
          data: {
            workflowId,
            fromStateId: stateMap[t.fromStateId] || t.fromStateId,
            toStateId: stateMap[t.toStateId] || t.toStateId,
            event: t.event
          }
        });
      }
    });

    const updatedWorkflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { states: true, transitions: true }
    });

    res.json({
      result: nfaResult,
      workflow: updatedWorkflow
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/workflows/:id/minimize', async (req, res) => {
  try {
    const automaton = await fetchWorkflowAutomaton(req.params.id);
    if (!automaton) return res.status(404).json({ error: 'Workflow not found' });

    const minResult = minimizeDFA(automaton);

    // Save minimized DFA directly to DB
    const workflowId = req.params.id;
    await prisma.$transaction(async (tx: any) => {
      await tx.transition.deleteMany({ where: { workflowId } });
      await tx.workflowState.deleteMany({ where: { workflowId } });

      const stateMap: Record<string, string> = {};

      for (const s of minResult.automaton.states) {
        const created = await tx.workflowState.create({
          data: {
            workflowId,
            name: s.name,
            isInitial: Boolean(s.isInitial),
            isFinal: Boolean(s.isFinal),
            positionX: s.positionX ?? 0,
            positionY: s.positionY ?? 0
          }
        });
        stateMap[s.id] = created.id;
      }

      for (const t of minResult.automaton.transitions) {
        await tx.transition.create({
          data: {
            workflowId,
            fromStateId: stateMap[t.fromStateId] || t.fromStateId,
            toStateId: stateMap[t.toStateId] || t.toStateId,
            event: t.event
          }
        });
      }
    });

    const updatedWorkflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { states: true, transitions: true }
    });

    res.json({
      result: minResult,
      workflow: updatedWorkflow
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


