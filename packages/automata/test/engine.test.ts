import { describe, it, expect } from 'vitest';
import { Automaton, analyzeAutomaton, simulateAutomaton, generateTestSequences, convertNFAToDFA, minimizeDFA } from '../src/index.js';

describe('Automata Engine (Phase 1)', () => {
  const ecommerceAutomaton: Automaton = {
    states: [
      { id: 's1', name: 'LOGIN', isInitial: true },
      { id: 's2', name: 'HOME' },
      { id: 's3', name: 'CART' },
      { id: 's4', name: 'CHECKOUT' },
      { id: 's5', name: 'PAYMENT' },
      { id: 's6', name: 'SUCCESS', isFinal: true },
      { id: 's7', name: 'UNREACHABLE' }
    ],
    transitions: [
      { id: 't1', fromStateId: 's1', toStateId: 's2', event: 'login' },
      { id: 't2', fromStateId: 's2', toStateId: 's3', event: 'add_to_cart' },
      { id: 't3', fromStateId: 's3', toStateId: 's4', event: 'checkout' },
      { id: 't4', fromStateId: 's4', toStateId: 's5', event: 'pay' },
      { id: 't5', fromStateId: 's5', toStateId: 's6', event: 'success' },
      { id: 't6', fromStateId: 's3', toStateId: 's2', event: 'continue_shopping' } // Cycle s2 <-> s3
    ]
  };

  it('1. Valid E-Commerce DFA simulation acceptance', () => {
    const res = simulateAutomaton(ecommerceAutomaton, ['login', 'add_to_cart', 'checkout', 'pay', 'success']);
    expect(res.accepted).toBe(true);
    expect(res.currentStateId).toBe('s6');
    expect(res.path.length).toBe(5);
  });

  it('2. Rejected simulation on invalid event sequence', () => {
    const res = simulateAutomaton(ecommerceAutomaton, ['login', 'pay']);
    expect(res.accepted).toBe(false);
    expect(res.failureReason).toContain("No valid transition from state 's2' on event 'pay'");
  });

  it('3. Analysis detects unreachable state', () => {
    const analysis = analyzeAutomaton(ecommerceAutomaton);
    expect(analysis.unreachableStateIds).toEqual(['s7']);
    expect(analysis.issues.some(i => i.type === 'UNREACHABLE_STATE')).toBe(true);
  });

  it('4. Analysis detects cycles', () => {
    const analysis = analyzeAutomaton(ecommerceAutomaton);
    expect(analysis.hasCycles).toBe(true);
    expect(analysis.cycles.length).toBeGreaterThan(0);
  });

  it('5. Analysis detects missing initial state', () => {
    const noInitial: Automaton = {
      states: [{ id: 's1', name: 'STATE_1' }],
      transitions: []
    };
    const analysis = analyzeAutomaton(noInitial);
    expect(analysis.isValid).toBe(false);
    expect(analysis.issues.some(i => i.type === 'MISSING_INITIAL')).toBe(true);
  });

  it('6. Analysis detects determinism conflict', () => {
    const nonDet: Automaton = {
      states: [
        { id: 's1', name: 'S1', isInitial: true },
        { id: 's2', name: 'S2' },
        { id: 's3', name: 'S3' }
      ],
      transitions: [
        { id: 't1', fromStateId: 's1', toStateId: 's2', event: 'click' },
        { id: 't2', fromStateId: 's1', toStateId: 's3', event: 'click' }
      ]
    };
    const analysis = analyzeAutomaton(nonDet);
    expect(analysis.isValid).toBe(false);
    expect(analysis.issues.some(i => i.type === 'DETERMINISM_CONFLICT')).toBe(true);
  });

  it('7. Test generation produces valid and invalid sequences', () => {
    const tests = generateTestSequences(ecommerceAutomaton);
    expect(tests.some(t => t.type === 'VALID')).toBe(true);
    expect(tests.some(t => t.type === 'INVALID')).toBe(true);
  });

  it('8. NFA to DFA subset construction converts non-deterministic transitions', () => {
    const nfa: Automaton = {
      states: [
        { id: 'n1', name: 'N1', isInitial: true },
        { id: 'n2', name: 'N2' },
        { id: 'n3', name: 'N3', isFinal: true }
      ],
      transitions: [
        { id: 't1', fromStateId: 'n1', toStateId: 'n2', event: 'a' },
        { id: 't2', fromStateId: 'n1', toStateId: 'n3', event: 'a' }, // Non-deterministic split on 'a'
        { id: 't3', fromStateId: 'n2', toStateId: 'n3', event: 'b' }
      ]
    };

    const dfaRes = convertNFAToDFA(nfa);
    expect(dfaRes.convertedDFAStateCount).toBeGreaterThan(0);
    const dfaAnalysis = analyzeAutomaton(dfaRes.automaton);
    expect(dfaAnalysis.issues.some(i => i.type === 'DETERMINISM_CONFLICT')).toBe(false);
  });

  it('9. Hopcroft DFA minimization merges redundant equivalent states', () => {
    const bloatedDFA: Automaton = {
      states: [
        { id: 's1', name: 'START', isInitial: true },
        { id: 's2', name: 'STEP_A' },
        { id: 's3', name: 'STEP_B' }, // Equivalent to s2
        { id: 's4', name: 'END', isFinal: true }
      ],
      transitions: [
        { id: 't1', fromStateId: 's1', toStateId: 's2', event: 'go' },
        { id: 't2', fromStateId: 's2', toStateId: 's4', event: 'done' },
        { id: 't3', fromStateId: 's3', toStateId: 's4', event: 'done' }
      ]
    };

    const minRes = minimizeDFA(bloatedDFA);
    expect(minRes.minimizedStateCount).toBeLessThan(bloatedDFA.states.length);
    expect(minRes.mergedGroups.length).toBeGreaterThan(0);
  });
});

