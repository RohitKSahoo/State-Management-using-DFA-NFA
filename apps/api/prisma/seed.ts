import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding demo workflows...');

  // Clean existing demo data
  await prisma.transition.deleteMany();
  await prisma.workflowState.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.project.deleteMany();

  // 1. E-Commerce Checkout Flow
  const ecomProj = await prisma.project.create({
    data: {
      name: 'E-Commerce Platform',
      description: 'Multi-stage checkout & payment retry state machine'
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

  // 2. Digital Banking & 2FA Wire Transfer Flow
  const bankProj = await prisma.project.create({
    data: {
      name: 'Digital Banking Portal',
      description: 'Fund transfer state machine with 2FA OTP & anti-fraud verification'
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

  // 3. Rideshare & Food Delivery Logistics Pipeline (Complex NFA / DFA)
  const deliveryProj = await prisma.project.create({
    data: {
      name: 'On-Demand Delivery Network',
      description: 'Complex courier matching, dispatch, active tracking & exception pipeline'
    }
  });

  await prisma.workflow.create({
    data: {
      projectId: deliveryProj.id,
      name: 'Order Lifecycle State Machine',
      states: {
        create: [
          { id: 'dl_created', name: 'ORDER_PLACED', isInitial: true, isFinal: false, positionX: 50, positionY: 150 },
          { id: 'dl_prep', name: 'KITCHEN_PREPARING', isInitial: false, isFinal: false, positionX: 250, positionY: 150 },
          { id: 'dl_searching', name: 'SEARCHING_DRIVER', isInitial: false, isFinal: false, positionX: 450, positionY: 150 },
          { id: 'dl_assigned', name: 'DRIVER_ASSIGNED', isInitial: false, isFinal: false, positionX: 650, positionY: 150 },
          { id: 'dl_en_route', name: 'EN_ROUTE_PICKUP', isInitial: false, isFinal: false, positionX: 650, positionY: 320 },
          { id: 'dl_picked_up', name: 'ORDER_PICKED_UP', isInitial: false, isFinal: false, positionX: 850, positionY: 150 },
          { id: 'dl_delivering', name: 'DELIVERING_TO_CUSTOMER', isInitial: false, isFinal: false, positionX: 1050, positionY: 150 },
          { id: 'dl_delivered', name: 'DELIVERY_SUCCESSFUL', isInitial: false, isFinal: true, positionX: 1250, positionY: 150 },
          { id: 'dl_canceled', name: 'ORDER_CANCELED', isInitial: false, isFinal: true, positionX: 450, positionY: 320 },
          { id: 'dl_refunded', name: 'REFUND_DISPATCHED', isInitial: false, isFinal: true, positionX: 850, positionY: 320 }
        ]
      },
      transitions: {
        create: [
          { id: 'dlt_1', fromStateId: 'dl_created', toStateId: 'dl_prep', event: 'restaurant_accept' },
          { id: 'dlt_2', fromStateId: 'dl_created', toStateId: 'dl_canceled', event: 'customer_cancel' },
          { id: 'dlt_3', fromStateId: 'dl_prep', toStateId: 'dl_searching', event: 'ready_for_pickup' },
          { id: 'dlt_4', fromStateId: 'dl_searching', toStateId: 'dl_assigned', event: 'driver_accept' },
          { id: 'dlt_5', fromStateId: 'dl_searching', toStateId: 'dl_searching', event: 'driver_decline' }, // Self cycle search retry
          { id: 'dlt_6', fromStateId: 'dl_assigned', toStateId: 'dl_en_route', event: 'start_transit' },
          { id: 'dlt_7', fromStateId: 'dl_en_route', toStateId: 'dl_picked_up', event: 'arrived_merchant' },
          { id: 'dlt_8', fromStateId: 'dl_picked_up', toStateId: 'dl_delivering', event: 'depart_merchant' },
          { id: 'dlt_9', fromStateId: 'dl_delivering', toStateId: 'dl_delivered', event: 'dropoff_verified' },
          { id: 'dlt_10', fromStateId: 'dl_delivering', toStateId: 'dl_refunded', event: 'package_damaged' }
        ]
      }
    }
  });

  // 4. SaaS Subscription & Recurring Billing Automation Engine
  const saasProj = await prisma.project.create({
    data: {
      name: 'SaaS Subscription Gateway',
      description: 'Dunning management, trial conversions, upgrade/downgrade & grace periods'
    }
  });

  await prisma.workflow.create({
    data: {
      projectId: saasProj.id,
      name: 'Subscription Lifecycle',
      states: {
        create: [
          { id: 'sa_trial', name: 'TRIAL_ACTIVE', isInitial: true, isFinal: false, positionX: 50, positionY: 150 },
          { id: 'sa_active', name: 'SUBSCRIBED_ACTIVE', isInitial: false, isFinal: false, positionX: 300, positionY: 150 },
          { id: 'sa_past_due', name: 'PAST_DUE_DUNNING', isInitial: false, isFinal: false, positionX: 550, positionY: 150 },
          { id: 'sa_grace', name: 'GRACE_PERIOD', isInitial: false, isFinal: false, positionX: 800, positionY: 150 },
          { id: 'sa_canceled', name: 'SUBSCRIPTION_CANCELED', isInitial: false, isFinal: true, positionX: 550, positionY: 340 },
          { id: 'sa_expired', name: 'TRIAL_EXPIRED', isInitial: false, isFinal: true, positionX: 50, positionY: 340 }
        ]
      },
      transitions: {
        create: [
          { id: 'sat_1', fromStateId: 'sa_trial', toStateId: 'sa_active', event: 'enter_payment_info' },
          { id: 'sat_2', fromStateId: 'sa_trial', toStateId: 'sa_expired', event: 'trial_ends_no_card' },
          { id: 'sat_3', fromStateId: 'sa_active', toStateId: 'sa_past_due', event: 'invoice_payment_failed' },
          { id: 'sat_4', fromStateId: 'sa_past_due', toStateId: 'sa_active', event: 'dunning_retry_success' },
          { id: 'sat_5', fromStateId: 'sa_past_due', toStateId: 'sa_grace', event: 'dunning_max_retries' },
          { id: 'sat_6', fromStateId: 'sa_grace', toStateId: 'sa_active', event: 'update_card_success' },
          { id: 'sat_7', fromStateId: 'sa_grace', toStateId: 'sa_canceled', event: 'grace_expired_revoke' },
          { id: 'sat_8', fromStateId: 'sa_active', toStateId: 'sa_canceled', event: 'user_cancel_sub' }
        ]
      }
    }
  });

  // 5. Problematic Workflows Sample (Deterministic conflicts, Unreachable nodes & Cycles)
  const probProj = await prisma.project.create({
    data: {
      name: 'Flawed State Machines (Lint Benchmark)',
      description: 'Sample with intentional non-deterministic splits, unreachable states, & dead ends'
    }
  });

  await prisma.workflow.create({
    data: {
      projectId: probProj.id,
      name: 'Ambiguous & Dead-End Automaton',
      states: {
        create: [
          { id: 'pr_init', name: 'START_PAGE', isInitial: true, isFinal: false, positionX: 50, positionY: 150 },
          { id: 'pr_step1', name: 'STEP_1', isInitial: false, isFinal: false, positionX: 250, positionY: 150 },
          { id: 'pr_step2', name: 'STEP_2', isInitial: false, isFinal: false, positionX: 450, positionY: 150 },
          { id: 'pr_unreachable', name: 'UNREACHABLE_ADMIN', isInitial: false, isFinal: false, positionX: 250, positionY: 340 },
          { id: 'pr_dead', name: 'DEAD_END_TRAP', isInitial: false, isFinal: false, positionX: 650, positionY: 340 },
          { id: 'pr_done', name: 'SUCCESS_FINAL', isInitial: false, isFinal: true, positionX: 650, positionY: 150 }
        ]
      },
      transitions: {
        create: [
          { id: 'prt_1', fromStateId: 'pr_init', toStateId: 'pr_step1', event: 'next' },
          { id: 'prt_2', fromStateId: 'pr_init', toStateId: 'pr_dead', event: 'next' }, // Determinism Conflict on 'next'
          { id: 'prt_3', fromStateId: 'pr_step1', toStateId: 'pr_step2', event: 'forward' },
          { id: 'prt_4', fromStateId: 'pr_step2', toStateId: 'pr_step1', event: 'back' }, // Cycle
          { id: 'prt_5', fromStateId: 'pr_step2', toStateId: 'pr_done', event: 'finish' }
        ]
      }
    }
  });

  console.log('5 Complex demo workflows seeded successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
