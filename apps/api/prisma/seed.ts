import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding 4 curated demo workflows...');

  // Clean existing demo data
  await prisma.transition.deleteMany();
  await prisma.workflowState.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.project.deleteMany();

  // === 2 COMPLEX NFA PROJECTS ===

  // 1. Complex NFA Pattern Matcher (Regex & ε-Transitions)
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
          { id: 'nfat_1', fromStateId: 'nfa_q0', toStateId: 'nfa_q1', event: 'ε' }, // Epsilon transition
          { id: 'nfat_2', fromStateId: 'nfa_q0', toStateId: 'nfa_q2', event: 'ε' }, // Epsilon transition
          { id: 'nfat_3', fromStateId: 'nfa_q1', toStateId: 'nfa_q1', event: 'data_chunk' },
          { id: 'nfat_4', fromStateId: 'nfa_q1', toStateId: 'nfa_q3', event: 'data_chunk' }, // NFA non-deterministic split on 'data_chunk'
          { id: 'nfat_5', fromStateId: 'nfa_q2', toStateId: 'nfa_q4', event: 'data_chunk' },
          { id: 'nfat_6', fromStateId: 'nfa_q3', toStateId: 'nfa_q5', event: 'process' },
          { id: 'nfat_7', fromStateId: 'nfa_q4', toStateId: 'nfa_q5', event: 'process' },
          { id: 'nfat_8', fromStateId: 'nfa_q5', toStateId: 'nfa_q6', event: 'commit' }
        ]
      }
    }
  });

  // 2. Parallel Microservice Saga (NFA Powerset Simplifier)
  const sagaNFAProj = await prisma.project.create({
    data: {
      name: 'Parallel Microservice Saga (NFA Powerset Simplifier)',
      description: 'Distributed Saga workflow with overlapping parallel dispatch states. Converts to a clean deterministic DFA & collapses redundant states.'
    }
  });

  await prisma.workflow.create({
    data: {
      projectId: sagaNFAProj.id,
      name: 'Distributed Saga Orchestrator',
      states: {
        create: [
          { id: 'sg_init', name: 'SAGA_INIT', isInitial: true, isFinal: false, positionX: 50, positionY: 180 },
          { id: 'sg_fork_inv', name: 'DISPATCH_INVENTORY', isInitial: false, isFinal: false, positionX: 250, positionY: 100 },
          { id: 'sg_fork_pay', name: 'DISPATCH_PAYMENT', isInitial: false, isFinal: false, positionX: 250, positionY: 260 },
          { id: 'sg_inv_ok', name: 'INVENTORY_RESERVED', isInitial: false, isFinal: false, positionX: 500, positionY: 100 },
          { id: 'sg_pay_ok', name: 'PAYMENT_CHARGED', isInitial: false, isFinal: false, positionX: 500, positionY: 260 },
          { id: 'sg_join_ready', name: 'SAGA_JOIN_SYNC', isInitial: false, isFinal: false, positionX: 720, positionY: 180 },
          { id: 'sg_complete', name: 'TRANSACTION_COMMITTED', isInitial: false, isFinal: true, positionX: 920, positionY: 180 }
        ]
      },
      transitions: {
        create: [
          { id: 'sgt_1', fromStateId: 'sg_init', toStateId: 'sg_fork_inv', event: 'dispatch_event' },
          { id: 'sgt_2', fromStateId: 'sg_init', toStateId: 'sg_fork_pay', event: 'dispatch_event' }, // NFA non-deterministic branch
          { id: 'sgt_3', fromStateId: 'sg_fork_inv', toStateId: 'sg_inv_ok', event: 'ack' },
          { id: 'sgt_4', fromStateId: 'sg_fork_pay', toStateId: 'sg_pay_ok', event: 'ack' },
          { id: 'sgt_5', fromStateId: 'sg_inv_ok', toStateId: 'sg_join_ready', event: 'sync' },
          { id: 'sgt_6', fromStateId: 'sg_pay_ok', toStateId: 'sg_join_ready', event: 'sync' },
          { id: 'sgt_7', fromStateId: 'sg_join_ready', toStateId: 'sg_complete', event: 'finalize' }
        ]
      }
    }
  });

  // === 2 NORMAL SCENARIO PROJECTS ===

  // 3. E-Commerce Checkout Flow (Normal Scenario)
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

  // 4. Digital Banking & 2FA Wire Transfer Flow (Normal Scenario)
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

  console.log('Seeding complete! Exactly 4 curated projects created.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

