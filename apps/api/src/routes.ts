import { Router } from 'express';
import { prisma } from './db.js';
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
      await seedDefaultBenchmarks();
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

async function seedDefaultBenchmarks() {
  try {
    const ecomProj = await prisma.project.create({
      data: {
        name: 'E-Commerce Platform',
        description: 'Standard multi-stage checkout & payment retry state machine'
      }
    });

    await prisma.workflow.create({
      data: {
        projectId: ecomProj.id,
        name: 'Checkout Flow',
        states: {
          create: [
            { id: 'ec_login', name: 'LOGIN', isInitial: true, isFinal: false, positionX: 50, positionY: 150 },
            { id: 'ec_home', name: 'HOME', isInitial: false, isFinal: false, positionX: 250, positionY: 150 },
            { id: 'ec_cart', name: 'CART', isInitial: false, isFinal: false, positionX: 450, positionY: 150 },
            { id: 'ec_checkout', name: 'CHECKOUT', isInitial: false, isFinal: false, positionX: 650, positionY: 150 },
            { id: 'ec_payment', name: 'PAYMENT', isInitial: false, isFinal: false, positionX: 850, positionY: 150 },
            { id: 'ec_failed', name: 'FAILED', isInitial: false, isFinal: true, positionX: 850, positionY: 320 },
            { id: 'ec_confirmed', name: 'ORDER_CONFIRMED', isInitial: false, isFinal: true, positionX: 1050, positionY: 150 }
          ]
        },
        transitions: {
          create: [
            { id: 'ect_1', fromStateId: 'ec_login', toStateId: 'ec_home', event: 'auth_success' },
            { id: 'ect_2', fromStateId: 'ec_home', toStateId: 'ec_cart', event: 'add_item' },
            { id: 'ect_3', fromStateId: 'ec_cart', toStateId: 'ec_checkout', event: 'proceed_checkout' },
            { id: 'ect_4', fromStateId: 'ec_checkout', toStateId: 'ec_payment', event: 'submit_payment' },
            { id: 'ect_5', fromStateId: 'ec_payment', toStateId: 'ec_confirmed', event: 'pay_success' },
            { id: 'ect_6', fromStateId: 'ec_payment', toStateId: 'ec_failed', event: 'pay_error' }
          ]
        }
      }
    });

    const bankProj = await prisma.project.create({
      data: {
        name: 'Digital Banking Portal',
        description: 'Standard fund transfer state machine with 2FA OTP & anti-fraud verification'
      }
    });

    await prisma.workflow.create({
      data: {
        projectId: bankProj.id,
        name: 'Fund Transfer Flow',
        states: {
          create: [
            { id: 'bk_login', name: 'LOGIN', isInitial: true, isFinal: false, positionX: 50, positionY: 150 },
            { id: 'bk_dash', name: 'DASHBOARD', isInitial: false, isFinal: false, positionX: 250, positionY: 150 },
            { id: 'bk_account', name: 'SELECT_ACCOUNT', isInitial: false, isFinal: false, positionX: 450, positionY: 150 },
            { id: 'bk_transfer', name: 'TRANSFER_FORM', isInitial: false, isFinal: false, positionX: 650, positionY: 150 },
            { id: 'bk_fraud_check', name: 'FRAUD_RISK_AUDIT', isInitial: false, isFinal: false, positionX: 650, positionY: 320 },
            { id: 'bk_confirm', name: 'CONFIRM_OTP', isInitial: false, isFinal: false, positionX: 850, positionY: 150 },
            { id: 'bk_success', name: 'TRANSFER_COMPLETE', isInitial: false, isFinal: true, positionX: 1050, positionY: 150 },
            { id: 'bk_blocked', name: 'ACCOUNT_BLOCKED', isInitial: false, isFinal: true, positionX: 850, positionY: 320 }
          ]
        },
        transitions: {
          create: [
            { id: 'bkt_1', fromStateId: 'bk_login', toStateId: 'bk_dash', event: 'login_2fa' },
            { id: 'bkt_2', fromStateId: 'bk_dash', toStateId: 'bk_account', event: 'click_transfer' },
            { id: 'bkt_3', fromStateId: 'bk_account', toStateId: 'bk_transfer', event: 'select_target' },
            { id: 'bkt_4', fromStateId: 'bk_transfer', toStateId: 'bk_fraud_check', event: 'submit_high_value' },
            { id: 'bkt_5', fromStateId: 'bk_fraud_check', toStateId: 'bk_confirm', event: 'risk_approved' },
            { id: 'bkt_6', fromStateId: 'bk_fraud_check', toStateId: 'bk_blocked', event: 'risk_flagged' },
            { id: 'bkt_7', fromStateId: 'bk_transfer', toStateId: 'bk_confirm', event: 'submit_normal' },
            { id: 'bkt_8', fromStateId: 'bk_confirm', toStateId: 'bk_success', event: 'authorize_otp' }
          ]
        }
      }
    });

    const regexNFAProj = await prisma.project.create({
      data: {
        name: 'NFA Regex Pattern Matcher (a*b+ & ε-Transitions)',
        description: 'NFA with spontaneous ε-transitions & non-deterministic branching. Simplifies to a minimal canonical DFA.'
      }
    });

    await prisma.workflow.create({
      data: {
        projectId: regexNFAProj.id,
        name: 'NFA Pattern Matching Machine',
        states: {
          create: [
            { id: 'nfa_q0', name: 'q0 (Start)', isInitial: true, isFinal: false, positionX: 50, positionY: 150 },
            { id: 'nfa_q1', name: 'q1 (Choice A)', isInitial: false, isFinal: false, positionX: 250, positionY: 100 },
            { id: 'nfa_q2', name: 'q2 (Choice B)', isInitial: false, isFinal: false, positionX: 250, positionY: 250 },
            { id: 'nfa_q3', name: 'q3 (Loop A)', isInitial: false, isFinal: false, positionX: 450, positionY: 100 },
            { id: 'nfa_q4', name: 'q4 (Loop B)', isInitial: false, isFinal: false, positionX: 450, positionY: 250 },
            { id: 'nfa_q5', name: 'q5 (Sync)', isInitial: false, isFinal: false, positionX: 650, positionY: 175 },
            { id: 'nfa_q6', name: 'q6 (Match Success)', isInitial: false, isFinal: true, positionX: 850, positionY: 175 }
          ]
        },
        transitions: {
          create: [
            { id: 'nfat_1', fromStateId: 'nfa_q0', toStateId: 'nfa_q1', event: 'ε' },
            { id: 'nfat_2', fromStateId: 'nfa_q0', toStateId: 'nfa_q2', event: 'ε' },
            { id: 'nfat_3', fromStateId: 'nfa_q1', toStateId: 'nfa_q1', event: 'data_chunk' },
            { id: 'nfat_4', fromStateId: 'nfa_q1', toStateId: 'nfa_q3', event: 'data_chunk' },
            { id: 'nfat_5', fromStateId: 'nfa_q2', toStateId: 'nfa_q4', event: 'data_chunk' },
            { id: 'nfat_6', fromStateId: 'nfa_q3', toStateId: 'nfa_q5', event: 'process' },
            { id: 'nfat_7', fromStateId: 'nfa_q4', toStateId: 'nfa_q5', event: 'process' },
            { id: 'nfat_8', fromStateId: 'nfa_q5', toStateId: 'nfa_q6', event: 'commit' }
          ]
        }
      }
    });
  } catch (e) {
    console.error('Auto-seed error:', e);
  }
}

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

// --- AI Workflow Generator Endpoint ---
apiRouter.post('/generate-ai-workflow', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 8) {
      return res.status(400).json({ error: 'Please provide a valid application flow description (minimum 8 characters).' });
    }

    const cleaned = prompt.toLowerCase();

    // Application domain keywords validation
    const appKeywords = [
      'app', 'application', 'flow', 'workflow', 'system', 'player', 'audio', 'music', 
      'food', 'delivery', 'order', 'cart', 'checkout', 'payment', 'auth', 'login', 
      'signup', 'user', 'dashboard', 'booking', 'store', 'checkout', 'chat', 'messaging',
      'banking', 'transfer', 'ecommerce', 'checkout', 'game', 'level', 'process', 'state'
    ];

    const isValidAppDescription = appKeywords.some((k) => cleaned.includes(k)) || cleaned.split(' ').length >= 5;

    if (!isValidAppDescription) {
      return res.status(400).json({
        error: 'Invalid input. Please provide a clear application flow description (e.g. "Audio player app with play, pause, and stop" or "Food delivery checkout flow").'
      });
    }

    const isAudioPlayer = cleaned.includes('audio') || cleaned.includes('player') || cleaned.includes('music');
    const isFood = cleaned.includes('food') || cleaned.includes('delivery') || cleaned.includes('order');
    const isAuth = cleaned.includes('auth') || cleaned.includes('login') || cleaned.includes('signup');

    let projectName = 'AI Generated App Workflow';
    let rawStates: { id: string; name: string; isInitial: boolean; isFinal: boolean }[] = [];
    let rawTransitions: { from: string; to: string; event: string }[] = [];

    if (isAudioPlayer) {
      projectName = 'Audio Player State Machine';
      rawStates = [
        { id: 's1', name: 'IDLE', isInitial: true, isFinal: false },
        { id: 's2', name: 'LOADING_TRACK', isInitial: false, isFinal: false },
        { id: 's3', name: 'READY', isInitial: false, isFinal: false },
        { id: 's4', name: 'PLAYING', isInitial: false, isFinal: false },
        { id: 's5', name: 'PAUSED', isInitial: false, isFinal: false },
        { id: 's6', name: 'STOPPED', isInitial: false, isFinal: true }
      ];
      rawTransitions = [
        { from: 's1', to: 's2', event: 'load_track' },
        { from: 's2', to: 's3', event: 'track_loaded' },
        { from: 's3', to: 's4', event: 'press_play' },
        { from: 's4', to: 's5', event: 'press_pause' },
        { from: 's5', to: 's4', event: 'resume_play' },
        { from: 's4', to: 's6', event: 'press_stop' },
        { from: 's5', to: 's6', event: 'press_stop' },
        { from: 's6', to: 's1', event: 'reset' }
      ];
    } else if (isFood) {
      projectName = 'Food Delivery State Machine';
      rawStates = [
        { id: 's1', name: 'BROWNSING_MENU', isInitial: true, isFinal: false },
        { id: 's2', name: 'CART_ACTIVE', isInitial: false, isFinal: false },
        { id: 's3', name: 'PAYMENT_PENDING', isInitial: false, isFinal: false },
        { id: 's4', name: 'KITCHEN_PREPARING', isInitial: false, isFinal: false },
        { id: 's5', name: 'OUT_FOR_DELIVERY', isInitial: false, isFinal: false },
        { id: 's6', name: 'DELIVERED', isInitial: false, isFinal: true },
        { id: 's7', name: 'ORDER_CANCELLED', isInitial: false, isFinal: true }
      ];
      rawTransitions = [
        { from: 's1', to: 's2', event: 'add_item' },
        { from: 's2', to: 's3', event: 'proceed_checkout' },
        { from: 's3', to: 's4', event: 'pay_success' },
        { from: 's3', to: 's7', event: 'pay_failed' },
        { from: 's4', to: 's5', event: 'driver_assigned' },
        { from: 's4', to: 's7', event: 'cancel_order' },
        { from: 's5', to: 's6', event: 'arrive_location' }
      ];
    } else if (isAuth) {
      projectName = 'User Authentication Flow';
      rawStates = [
        { id: 's1', name: 'UNAUTHENTICATED', isInitial: true, isFinal: false },
        { id: 's2', name: 'ENTERING_CREDENTIALS', isInitial: false, isFinal: false },
        { id: 's3', name: 'VERIFYING_MFA', isInitial: false, isFinal: false },
        { id: 's4', name: 'AUTHENTICATED_SESSION', isInitial: false, isFinal: true },
        { id: 's5', name: 'ACCOUNT_LOCKED', isInitial: false, isFinal: true }
      ];
      rawTransitions = [
        { from: 's1', to: 's2', event: 'click_login' },
        { from: 's2', to: 's3', event: 'submit_password' },
        { from: 's3', to: 's4', event: 'verify_otp' },
        { from: 's2', to: 's5', event: 'max_attempts_exceeded' },
        { from: 's4', to: 's1', event: 'click_logout' }
      ];
    } else {
      // Dynamic General State Generator
      const words = prompt.split(' ').map(w => w.replace(/[^a-zA-Z]/g, '').toUpperCase()).filter(w => w.length > 3).slice(0, 4);
      projectName = `${words[0] || 'App'} Workflow`;
      rawStates = [
        { id: 's1', name: 'INITIAL', isInitial: true, isFinal: false },
        { id: 's2', name: words[0] || 'PROCESSING', isInitial: false, isFinal: false },
        { id: 's3', name: words[1] || 'VERIFIED', isInitial: false, isFinal: false },
        { id: 's4', name: words[2] || 'COMPLETED', isInitial: false, isFinal: true }
      ];
      rawTransitions = [
        { from: 's1', to: 's2', event: 'start_action' },
        { from: 's2', to: 's3', event: 'process_event' },
        { from: 's3', to: 's4', event: 'complete_action' },
        { from: 's2', to: 's1', event: 'retry' }
      ];
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
        name: projectName,
        description: `Generated from prompt: "${prompt}"`
      }
    });

    const newWorkflow = await prisma.workflow.create({
      data: {
        projectId: newProject.id,
        name: `${projectName} Graph`
      }
    });

    // Create states in DB
    const stateIdMap: Record<string, string> = {};
    for (const s of statesWithPositions) {
      const createdState = await prisma.workflowState.create({
        data: {
          workflowId: newWorkflow.id,
          name: s.name,
          isInitial: s.isInitial,
          isFinal: s.isFinal,
          positionX: s.positionX,
          positionY: s.positionY
        }
      });
      stateIdMap[s.id] = createdState.id;
    }

    // Create transitions in DB
    for (const t of rawTransitions) {
      await prisma.transition.create({
        data: {
          workflowId: newWorkflow.id,
          fromStateId: stateIdMap[t.from] || t.from,
          toStateId: stateIdMap[t.to] || t.to,
          event: t.event
        }
      });
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


