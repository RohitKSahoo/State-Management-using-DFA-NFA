# StateLint — MVP Implementation Plan

## 1. Strategy
Build in vertical slices. The automata engine comes first because it is the project's core and must remain independent of the UI.

## 2. Phase 0 — Repository Setup
Tasks:
- Git repository.
- React + TypeScript frontend.
- Node + TypeScript backend.
- TypeScript configuration.
- linting/formatting.
- environment configuration.
- README.
- optional CI.

Suggested:
```text
statelint/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── shared/
├── docs/
└── package.json
```

If monorepo complexity is unnecessary, use two simple applications.

Done when both apps start successfully.

## 3. Phase 1 — Automata Domain Engine
Implement:
- Automaton data structures.
- initial-state validation;
- final-state validation;
- transition-reference validation;
- determinism;
- BFS reachability;
- unreachable-state detection;
- dead-state detection;
- DFS cycle detection;
- simulation;
- BFS shortest path;
- valid path generation;
- invalid sequence generation.

This must not import React, Express, Prisma, or browser APIs.

## 4. Phase 1 Unit Tests
Test:
1. valid DFA;
2. missing initial state;
3. unreachable state;
4. dead state;
5. duplicate `(state,event)` target conflict;
6. cycle;
7. accepted simulation;
8. rejected simulation;
9. shortest path;
10. valid/invalid test generation.

## 5. Phase 2 — Database and Backend
Tasks:
- PostgreSQL;
- Prisma;
- migrations;
- Project;
- Workflow;
- WorkflowState;
- Transition;
- repository layer;
- request validation.

Implement:
```text
POST   /api/projects
GET    /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id

POST   /api/projects/:id/workflows
GET    /api/workflows/:id
PUT    /api/workflows/:id
DELETE /api/workflows/:id

POST   /api/workflows/:id/analyze
POST   /api/workflows/:id/simulate
POST   /api/workflows/:id/tests/generate
```

Done when a complete workflow can be created/retrieved through the API alone.

## 6. Phase 3 — Frontend Foundation
Tasks:
- React shell;
- routing;
- dashboard;
- workflow editor page;
- API client;
- reusable UI primitives;
- loading/error/empty states.

Done when:
`Open → Create Project → Open Project → Create Workflow → Editor`

## 7. Phase 4 — Graph Editor
Implement:
### State
- add;
- select;
- rename;
- delete;
- move;
- initial;
- final.

### Transition
- create;
- select;
- edit event;
- delete.

Keep React Flow objects separate from domain objects.

## 8. Phase 5 — Save/Load
Flow:
```text
Editor
 ↓
Domain workflow
 ↓
PUT /api/workflows/:id
 ↓
Database
```

Load:
```text
Database
 ↓
API
 ↓
Domain workflow
 ↓
Graph model
 ↓
Editor
```

Done when refresh/reopen preserves state names, transitions, flags, and positions.

## 9. Phase 6 — Analysis Integration
Connect Analyze to:
`POST /api/workflows/:id/analyze`

Display:
- status;
- state count;
- transition count;
- reachable states;
- unreachable states;
- final states;
- cycles;
- issues.

Clicking an issue should select/highlight the affected node or edge.

## 10. Phase 7 — Simulation
Provide:
- event entry;
- Run;
- Step;
- Reset;
- execution trace;
- acceptance/rejection;
- failure reason.

Support both accepted and rejected demos.

## 11. Phase 8 — Test Generation
Implement:
### Valid tests
Shortest paths to reachable final states.

### Invalid tests
Valid prefix + an event with no valid transition.

Bound:
- max tests: 20;
- max path length: 25.

Never allow unbounded graph traversal.

## 12. Phase 9 — Dashboard/Polish
Add:
- workflow health summary;
- analysis counts;
- recent projects;
- empty states;
- fit-to-screen;
- useful keyboard shortcuts;
- destructive-action confirmation.

Do not polish before the core works.

## 13. Phase 10 — Testing
Backend:
- automata unit tests;
- API integration tests;
- CRUD;
- analysis;
- simulation;
- test generation.

Frontend:
- state creation;
- transition creation;
- save/load;
- analysis rendering;
- simulation;
- error handling.

End-to-end:
```text
Create project
 ↓
Create workflow
 ↓
Add states/transitions
 ↓
Save
 ↓
Reload
 ↓
Analyze
 ↓
Simulate
```

## 14. Phase 11 — Demo Workflows
### E-Commerce
LOGIN, HOME, CART, CHECKOUT, PAYMENT, FAILED, ORDER_CONFIRMED.

### Banking
LOGIN, DASHBOARD, SELECT_ACCOUNT, TRANSFER, CONFIRM, SUCCESS.

### Problematic workflow
Deliberately include:
- unreachable state;
- dead state;
- cycle;
- deterministic conflict.

This is useful for demonstrations.

## 15. Milestones
### M1 — Automata Core
Algorithms + unit tests.

### M2 — Backend
Database + CRUD + analysis/simulation APIs.

### M3 — Frontend
Dashboard + graph editor + persistence.

### M4 — Integrated MVP
Analysis dashboard + highlighting + simulator + test generation.

### M5 — Polish
Demo workflows + documentation + screenshots + final presentation.

## 16. Exact Recommended Development Order
1. Automaton data structures.
2. Simulation.
3. Reachability.
4. Dead-state detection.
5. Cycle detection.
6. Determinism validation.
7. Unit tests.
8. Database.
9. CRUD API.
10. React shell.
11. Graph editor.
12. Save/load.
13. Analysis panel.
14. Issue highlighting.
15. Simulation UI.
16. Test generation.
17. Demo workflows.
18. UI polish.

## 17. MVP Definition of Done
A user can:
1. Create an E-Commerce workflow.
2. Add states and transitions.
3. Set LOGIN as initial.
4. Set SUCCESS as final.
5. Save and reload.
6. Analyze the workflow.
7. See state/transition metrics.
8. See reachability, dead-state, cycle, and determinism results.
9. Click an issue and see the affected graph element.
10. Simulate a valid sequence and get ACCEPTED.
11. Simulate an invalid sequence and get REJECTED with a reason.
12. Generate and run basic tests.

## 18. Do Not Build Before MVP
Do not prioritize:
- auth;
- collaboration;
- cloud infrastructure;
- microservices;
- AI;
- WebSockets;
- CFG/PDA;
- NFA;
- DFA minimization;
- runtime SDK.

These belong after the DFA workflow analyzer is stable.

## 19. Post-MVP
### Stage A
NFA, NFA→DFA, DFA minimization.

### Stage B
State equivalence, workflow comparison, coverage, regression tests.

### Stage C
Security checks and authentication-bypass analysis.

### Stage D
Runtime monitoring.

## 20. Engineering Principles
1. Automata engine is framework-independent.
2. Frontend graph representation is separate from domain representation.
3. Validate on frontend and backend.
4. Analysis must be deterministic and reproducible.
5. Prefer explainable algorithms.
6. Every issue should identify affected elements where possible.
7. Never treat every cycle as a bug.
8. Keep MVP scope tight.
9. Test the automata engine before advanced UI.
10. Avoid unnecessary architecture until requirements demand it.

## 21. First Coding Task
Implement and test a standalone DFA simulator/validator.

Example:
```text
LOGIN
 ↓ login
HOME
 ↓ add_to_cart
CART
 ↓ checkout
CHECKOUT
 ↓ pay
PAYMENT
 ↓ success
SUCCESS [FINAL]
```

Input:
`login, add_to_cart, checkout, pay, success`

Expected:
```text
accepted = true
finalState = SUCCESS
```

Only after this works should the team build the rest of the application around it.
