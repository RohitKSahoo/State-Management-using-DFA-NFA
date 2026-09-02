export interface StateNode {
    id: string;
    name: string;
    isInitial?: boolean;
    isFinal?: boolean;
}
export interface TransitionEdge {
    id: string;
    fromStateId: string;
    toStateId: string;
    event: string;
}
export interface Automaton {
    states: StateNode[];
    transitions: TransitionEdge[];
}
export interface ValidationIssue {
    type: 'MISSING_INITIAL' | 'MULTIPLE_INITIAL' | 'UNREACHABLE_STATE' | 'DEAD_STATE' | 'DETERMINISM_CONFLICT' | 'CYCLE_DETECTED';
    severity: 'ERROR' | 'WARNING';
    message: string;
    affectedStateIds?: string[];
    affectedTransitionIds?: string[];
}
export interface AnalysisResult {
    isValid: boolean;
    stateCount: number;
    transitionCount: number;
    reachableStateIds: string[];
    unreachableStateIds: string[];
    deadStateIds: string[];
    hasCycles: boolean;
    cycles: string[][];
    issues: ValidationIssue[];
}
export interface SimulationStep {
    step: number;
    fromStateId: string;
    event: string;
    toStateId: string;
    transitionId: string;
}
export interface SimulationResult {
    accepted: boolean;
    currentStateId: string;
    path: SimulationStep[];
    failureReason?: string;
}
export interface GeneratedTestSequence {
    type: 'VALID' | 'INVALID';
    name: string;
    events: string[];
    expectedAccepted: boolean;
    description: string;
    expectedFinalStateId?: string;
    failingEventIndex?: number;
}
export interface MinimizationResult {
    originalStateCount: number;
    minimizedStateCount: number;
    mergedGroups: {
        mergedName: string;
        originalStateIds: string[];
    }[];
    automaton: Automaton;
}
export interface NFAToDFAResult {
    originalNFAStateCount: number;
    convertedDFAStateCount: number;
    subsetMap: {
        dfaStateName: string;
        nfaStateIds: string[];
    }[];
    automaton: Automaton;
}
