import { PrismaClient } from '@prisma/client';

export async function seedDatabase(prisma: PrismaClient) {
  const count = await prisma.project.count();
  if (count > 0) {
    return;
  }

  console.log('Seeding curated demo & benchmark workflows...');

  // 1. Payment Gateway Router & Fraud Engine (NFA with Non-Deterministic Retries & Redundant States)
  const paymentNFAProj = await prisma.project.create({
    data: {
      name: 'Payment Gateway Router & Fraud Engine (NFA -> DFA -> Minimized)',
      description: 'Real-life payment processing flow with parallel fraud audits, multi-acquirer fallback retries (NFA), and duplicate redundant verification states (Minimizable).'
    }
  });

  await prisma.workflow.create({
    data: {
      projectId: paymentNFAProj.id,
      name: 'Payment Orchestrator NFA',
      states: {
        create: [
          { id: 'pay_init', name: 'PAYMENT_INITIATED', isInitial: true, isFinal: false, positionX: 50, positionY: 150 },
          { id: 'pay_auth_primary', name: 'AUTH_PRIMARY_GATEWAY', isInitial: false, isFinal: false, positionX: 250, positionY: 80 },
          { id: 'pay_auth_backup', name: 'AUTH_BACKUP_GATEWAY', isInitial: false, isFinal: false, positionX: 250, positionY: 260 },
          { id: 'pay_verify_1', name: 'VERIFY_BALANCE_A', isInitial: false, isFinal: false, positionX: 480, positionY: 80 },
          { id: 'pay_verify_2', name: 'VERIFY_BALANCE_B', isInitial: false, isFinal: false, positionX: 480, positionY: 260 },
          { id: 'pay_settled', name: 'FUNDS_CAPTURED', isInitial: false, isFinal: true, positionX: 720, positionY: 120 },
          { id: 'pay_declined', name: 'PAYMENT_DECLINED', isInitial: false, isFinal: true, positionX: 720, positionY: 260 }
        ]
      },
      transitions: {
        create: [
          { id: 'payt_1', fromStateId: 'pay_init', toStateId: 'pay_auth_primary', event: 'process_payment' },
          { id: 'payt_2', fromStateId: 'pay_init', toStateId: 'pay_auth_backup', event: 'process_payment' },
          { id: 'payt_3', fromStateId: 'pay_auth_primary', toStateId: 'pay_verify_1', event: 'gateway_ack' },
          { id: 'payt_4', fromStateId: 'pay_auth_backup', toStateId: 'pay_verify_2', event: 'gateway_ack' },
          { id: 'payt_5', fromStateId: 'pay_verify_1', toStateId: 'pay_settled', event: 'capture_success' },
          { id: 'payt_6', fromStateId: 'pay_verify_2', toStateId: 'pay_settled', event: 'capture_success' },
          { id: 'payt_7', fromStateId: 'pay_verify_1', toStateId: 'pay_declined', event: 'insufficient_funds' },
          { id: 'payt_8', fromStateId: 'pay_verify_2', toStateId: 'pay_declined', event: 'insufficient_funds' }
        ]
      }
    }
  });

  // 2. Rideshare Dispatch & Driver Matching Engine (NFA with Epsilon Transitions & Equivalent Recovery States)
  const rideshareNFAProj = await prisma.project.create({
    data: {
      name: 'Rideshare Dispatch & Match Engine (NFA with ε-Transitions)',
      description: 'Real-life Uber/Lyft ride matching system using spontaneous ε-transitions to attempt simultaneous driver pairing, surge pricing checks, and redundant cancellation states.'
    }
  });

  await prisma.workflow.create({
    data: {
      projectId: rideshareNFAProj.id,
      name: 'Ride Matcher NFA',
      states: {
        create: [
          { id: 'ride_req', name: 'RIDE_REQUESTED', isInitial: true, isFinal: false, positionX: 50, positionY: 180 },
          { id: 'ride_search_nearby', name: 'SEARCHING_NEARBY_DRIVERS', isInitial: false, isFinal: false, positionX: 260, positionY: 100 },
          { id: 'ride_search_surge', name: 'SEARCHING_SURGE_POOL', isInitial: false, isFinal: false, positionX: 260, positionY: 260 },
          { id: 'ride_assigned_a', name: 'DRIVER_ACCEPTED_STANDARD', isInitial: false, isFinal: false, positionX: 520, positionY: 100 },
          { id: 'ride_assigned_b', name: 'DRIVER_ACCEPTED_PREMIUM', isInitial: false, isFinal: false, positionX: 520, positionY: 260 },
          { id: 'ride_in_transit', name: 'TRIP_IN_PROGRESS', isInitial: false, isFinal: false, positionX: 760, positionY: 180 },
          { id: 'ride_completed', name: 'TRIP_COMPLETED', isInitial: false, isFinal: true, positionX: 980, positionY: 180 },
          { id: 'ride_cancelled', name: 'TRIP_CANCELLED', isInitial: false, isFinal: true, positionX: 520, positionY: 380 }
        ]
      },
      transitions: {
        create: [
          { id: 'ridet_1', fromStateId: 'ride_req', toStateId: 'ride_search_nearby', event: 'ε' },
          { id: 'ridet_2', fromStateId: 'ride_req', toStateId: 'ride_search_surge', event: 'ε' },
          { id: 'ridet_3', fromStateId: 'ride_search_nearby', toStateId: 'ride_assigned_a', event: 'driver_accepts' },
          { id: 'ridet_4', fromStateId: 'ride_search_surge', toStateId: 'ride_assigned_b', event: 'driver_accepts' },
          { id: 'ridet_5', fromStateId: 'ride_assigned_a', toStateId: 'ride_in_transit', event: 'passenger_onboard' },
          { id: 'ridet_6', fromStateId: 'ride_assigned_b', toStateId: 'ride_in_transit', event: 'passenger_onboard' },
          { id: 'ridet_7', fromStateId: 'ride_in_transit', toStateId: 'ride_completed', event: 'arrive_destination' },
          { id: 'ridet_8', fromStateId: 'ride_search_nearby', toStateId: 'ride_cancelled', event: 'timeout' },
          { id: 'ridet_9', fromStateId: 'ride_search_surge', toStateId: 'ride_cancelled', event: 'timeout' }
        ]
      }
    }
  });

  // 3. IoT Smart Home Security Alarm Controller (Multi-Sensor NFA to Minimal DFA)
  const smartHomeProj = await prisma.project.create({
    data: {
      name: 'IoT Smart Home Alarm System (NFA Pattern & State Minimizer)',
      description: 'Real-world home security system. Multi-sensor motion/door trip events create NFA non-determinism, with equivalent alarm trigger states that collapse during DFA minimization.'
    }
  });

  await prisma.workflow.create({
    data: {
      projectId: smartHomeProj.id,
      name: 'Smart Alarm Controller NFA',
      states: {
        create: [
          { id: 'sh_disarmed', name: 'DISARMED', isInitial: true, isFinal: false, positionX: 50, positionY: 150 },
          { id: 'sh_armed_home', name: 'ARMED_STAY', isInitial: false, isFinal: false, positionX: 260, positionY: 80 },
          { id: 'sh_armed_away', name: 'ARMED_AWAY', isInitial: false, isFinal: false, positionX: 260, positionY: 240 },
          { id: 'sh_countdown_1', name: 'ENTRY_DELAY_DOOR', isInitial: false, isFinal: false, positionX: 500, positionY: 80 },
          { id: 'sh_countdown_2', name: 'ENTRY_DELAY_WINDOW', isInitial: false, isFinal: false, positionX: 500, positionY: 240 },
          { id: 'sh_siren_active', name: 'SIREN_ALARM_BLARING', isInitial: false, isFinal: true, positionX: 740, positionY: 160 }
        ]
      },
      transitions: {
        create: [
          { id: 'sht_1', fromStateId: 'sh_disarmed', toStateId: 'sh_armed_home', event: 'arm_system' },
          { id: 'sht_2', fromStateId: 'sh_disarmed', toStateId: 'sh_armed_away', event: 'arm_system' },
          { id: 'sht_3', fromStateId: 'sh_armed_home', toStateId: 'sh_countdown_1', event: 'sensor_tripped' },
          { id: 'sht_4', fromStateId: 'sh_armed_away', toStateId: 'sh_countdown_2', event: 'sensor_tripped' },
          { id: 'sht_5', fromStateId: 'sh_countdown_1', toStateId: 'sh_siren_active', event: 'grace_period_expired' },
          { id: 'sht_6', fromStateId: 'sh_countdown_2', toStateId: 'sh_siren_active', event: 'grace_period_expired' },
          { id: 'sht_7', fromStateId: 'sh_countdown_1', toStateId: 'sh_disarmed', event: 'enter_valid_pin' },
          { id: 'sht_8', fromStateId: 'sh_countdown_2', toStateId: 'sh_disarmed', event: 'enter_valid_pin' }
        ]
      }
    }
  });

  // 4. E-Commerce Checkout Flow (Normal Scenario)
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

  // 5. Digital Banking & 2FA Wire Transfer Flow (Normal Scenario)
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

  console.log('Seeding complete! Curated projects created successfully.');
}
