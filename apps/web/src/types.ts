export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  workflows?: Workflow[];
}

export interface WorkflowState {
  id: string;
  workflowId: string;
  name: string;
  isInitial: boolean;
  isFinal: boolean;
  positionX: number;
  positionY: number;
}

export interface Transition {
  id: string;
  workflowId: string;
  fromStateId: string;
  toStateId: string;
  event: string;
}

export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  states: WorkflowState[];
  transitions: Transition[];
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

export interface TestSequence {
  type: 'VALID' | 'INVALID';
  name: string;
  events: string[];
  expectedAccepted: boolean;
  description: string;
}
