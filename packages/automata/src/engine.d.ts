import { Automaton, AnalysisResult, SimulationResult, GeneratedTestSequence, NFAToDFAResult, MinimizationResult } from './types.js';
export declare function analyzeAutomaton(automaton: Automaton): AnalysisResult;
export declare function simulateAutomaton(automaton: Automaton, events: string[]): SimulationResult;
export declare function generateTestSequences(automaton: Automaton, maxTests?: number, maxPathLength?: number): GeneratedTestSequence[];
/**
 * NFA -> DFA Conversion via Powerset / Subset Construction Algorithm.
 * Resolves non-deterministic transitions and epsilon transitions into a deterministic DFA.
 */
export declare function convertNFAToDFA(nfa: Automaton): NFAToDFAResult;
/**
 * DFA State Minimization via Hopcroft Partitioning Algorithm.
 * Merges equivalent states into a minimal canonical DFA.
 */
export declare function minimizeDFA(dfa: Automaton): MinimizationResult;
