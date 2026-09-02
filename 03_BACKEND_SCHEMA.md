# StateLint — Backend Schema and API Design

## 1. Recommended Stack
- Node.js
- TypeScript
- Express or Fastify
- PostgreSQL
- Prisma ORM
- Zod for validation

The automata engine must be framework-independent and separated from HTTP.

## 2. Architecture
```text
HTTP Request
    ↓
Route
    ↓
Controller
    ↓
Service
    ↓
Automata Domain Engine
    ↓
Repository / Prisma
    ↓
PostgreSQL
```

Suggested structure:
```text
src/
├── modules/
│   ├── projects/
│   ├── workflows/
│   ├── analysis/
│   └── simulation/
├── domain/
│   └── automata/
├── repositories/
├── middleware/
├── utils/
└── app.ts
```

## 3. MVP Entities
- Project
- Workflow
- WorkflowState
- Transition

Later:
- AnalysisRun
- GeneratedTest
- User

Authentication is intentionally excluded from MVP.

## 4. Prisma-Style Schema
```prisma
model Project {
  id          String     @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  workflows   Workflow[]
}

model Workflow {
  id          String       @id @default(cuid())
  projectId   String
  name        String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  states      WorkflowState[]
  transitions Transition[]
  @@index([projectId])
}

model WorkflowState {
  id          String       @id @default(cuid())
  workflowId  String
  name        String
  isInitial   Boolean      @default(false)
  isFinal     Boolean      @default(false)
  positionX   Float        @default(0)
  positionY   Float        @default(0)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  workflow    Workflow     @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  outgoing    Transition[] @relation("TransitionSource")
  incoming    Transition[] @relation("TransitionTarget")
  @@index([workflowId])
}

model Transition {
  id             String        @id @default(cuid())
  workflowId     String
  sourceStateId  String
  targetStateId  String
  event          String
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  workflow       Workflow      @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  source         WorkflowState @relation("TransitionSource", fields: [sourceStateId], references: [id], onDelete: Cascade)
  target         WorkflowState @relation("TransitionTarget", fields: [targetStateId], references: [id], onDelete: Cascade)
  @@index([workflowId])
  @@index([sourceStateId])
  @@index([targetStateId])
}
```

## 5. Constraints
Application-level validation should enforce:
- exactly one initial state before analysis/simulation;
- non-empty state names;
- unique state names within a workflow;
- non-empty event labels;
- transition references must belong to the same workflow;
- deterministic `(source, event)` uniqueness in DFA mode.

Suggested max lengths:
- state name: 100 chars;
- event: 100 chars;
- project/workflow name: 150 chars.

## 6. Domain Automaton
```ts
type Automaton = {
  states: Set<string>;
  alphabet: Set<string>;
  initialState: string;
  finalStates: Set<string>;
  transitions: Map<string, Map<string, string>>;
};
```

For deterministic mode:
`transitions.get(state)?.get(event) -> targetState`

## 7. Analysis Result
```ts
type AnalysisResult = {
  status: "VALID" | "WARNING" | "INVALID";
  metrics: {
    stateCount: number;
    transitionCount: number;
    reachableStateCount: number;
    unreachableStateCount: number;
    finalStateCount: number;
    cycleCount: number;
  };
  issues: AnalysisIssue[];
};

type AnalysisIssue = {
  code: string;
  severity: "INFO" | "WARNING" | "ERROR";
  message: string;
  stateIds?: string[];
  transitionIds?: string[];
  path?: string[];
};
```

## 8. API
### Projects
`POST /api/projects`
`GET /api/projects`
`GET /api/projects/:projectId`
`PATCH /api/projects/:projectId`
`DELETE /api/projects/:projectId`

### Workflows
`POST /api/projects/:projectId/workflows`
`GET /api/workflows/:workflowId`
`PUT /api/workflows/:workflowId`
`DELETE /api/workflows/:workflowId`

### Analysis
`POST /api/workflows/:workflowId/analyze`

Optional:
```json
{ "mode": "DFA" }
```

### Simulation
`POST /api/workflows/:workflowId/simulate`

Request:
```json
{
  "events": ["login", "add_to_cart", "checkout", "pay", "success"]
}
```

### Tests
`POST /api/workflows/:workflowId/tests/generate`

Request:
```json
{ "maxTests": 20 }
```

## 9. Automata Engine Functions
```ts
validateAutomaton(automaton)
findReachableStates(automaton)
findUnreachableStates(automaton)
findDeadStates(automaton)
detectCycles(automaton)
validateDeterminism(automaton)
simulate(automaton, events)
findShortestPath(automaton, from, to)
generateValidPaths(automaton)
generateInvalidSequences(automaton)
```

Future:
```ts
convertNfaToDfa()
minimizeDfa()
checkEquivalentDfa()
```

## 10. Algorithms
- Reachability: BFS/DFS, O(|Q| + |δ|).
- Dead-state detection: inspect reachable non-final states with no outgoing transitions.
- Cycle detection: DFS with visited and recursion-stack sets.
- Determinism: at most one target for each `(state,event)`.
- Simulation: consume events sequentially; reject on missing transition; accept iff final state is reached after all events.
- Shortest path: BFS.

## 11. Save Transaction
Saving a workflow should be atomic:
```text
BEGIN
Update workflow
Delete/update/create states
Delete/update/create transitions
COMMIT
```
Rollback on failure.

## 12. Error Format
```json
{
  "error": {
    "code": "WORKFLOW_NOT_FOUND",
    "message": "Workflow was not found."
  }
}
```

Codes:
PROJECT_NOT_FOUND, WORKFLOW_NOT_FOUND, INVALID_WORKFLOW, INVALID_STATE, INVALID_TRANSITION, VALIDATION_ERROR, INTERNAL_ERROR.

## 13. Security Baseline
- Validate all input.
- Limit request size.
- Sanitize/validate text.
- Never execute event strings as code.
- Never use dynamic `eval`.
- Use ORM/parameterized queries.
- Restrict CORS in deployed environments.

## 14. Backend Definition of Done
Projects/workflows persist correctly; analysis and simulation work without the frontend; generated tests are deterministic; invalid payloads are rejected; automata algorithms have unit tests.
