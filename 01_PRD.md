# StateLint — Product Requirements Document (MVP)

## 1. Product Identity
**Name:** StateLint  
**Working title:** StateLint: An Automata-Based Application Workflow Validation and Testing System  
**Tagline:** Find broken workflows before your users do.

## 2. Product Summary
StateLint is a web-based developer tool that models application workflows as finite-state machines and analyzes them for structural and logical problems.

The MVP lets a developer:
- create projects and workflows;
- add states and transitions;
- define one initial state and final states;
- visualize the workflow as a directed graph;
- validate the workflow;
- detect unreachable states, unexpected dead states, cycles, and DFA determinism conflicts;
- simulate event sequences;
- generate basic valid and invalid test sequences;
- save and reload workflows.

The core academic basis is Theory of Computation: DFA/NFA concepts, transition functions, language acceptance, reachability, regular languages, and planned DFA minimization.

## 3. Problem Statement
Modern applications contain state-dependent workflows such as authentication, checkout, payments, onboarding, order processing, permissions, and multi-step forms. As these grow, developers can introduce unreachable states, dead ends, invalid transitions, accidental loops, bypasses, and difficult-to-test paths.

These issues are often discovered through manual testing or runtime bugs. StateLint provides a formal workflow model and analyzes it before deployment.

## 4. Formal Model
A deterministic workflow is modeled as:
M = (Q, Σ, δ, q0, F)

- Q = application states
- Σ = event/input alphabet
- δ = transition function
- q0 = initial state
- F = accepting/final states

Mapping:
| Automata | StateLint |
|---|---|
| State | Application state/screen |
| Input symbol | User action/system event |
| Transition | Allowed state change |
| Initial state | Starting state |
| Final state | Successful/terminal state |
| Accepted string | Valid event sequence |
| Rejected string | Invalid event sequence |

## 5. Goals
### Primary
- Visually model application workflows.
- Represent workflows as deterministic finite automata.
- Detect common workflow defects automatically.
- Provide an interactive simulator.
- Generate basic workflow tests.
- Provide actionable analysis.
- Demonstrate clear use of Theory of Computation.

### Secondary
Keep the architecture ready for NFA, NFA→DFA, DFA minimization, coverage, security analysis, and runtime monitoring.

## 6. Non-Goals for MVP
Do not implement initially:
- authentication/authorization;
- collaboration;
- production runtime instrumentation;
- full CFG/PDA support;
- full formal verification;
- AI-generated workflows;
- enterprise permissions;
- arbitrary source-code parsing.

## 7. Target User
Primary: student/developer who wants to design and validate a state-driven application workflow.

## 8. MVP User Stories
- Create/open/save/delete a project.
- Create a workflow.
- Add/rename/delete states.
- Mark one state as initial.
- Mark one or more states as final.
- Add/edit/delete labeled transitions.
- Visualize and manipulate the graph.
- Run workflow analysis.
- See unreachable/dead states and cycles.
- Detect deterministic transition conflicts.
- Enter an event sequence and simulate it.
- See acceptance/rejection and the failure position.
- Generate basic valid and invalid test sequences.

## 9. MVP Features
### Project management
Create, rename, save, load, delete projects/workflows.

### Workflow editor
State CRUD, initial/final flags, transition CRUD, event labels, deterministic-mode validation.

### Graph visualization
Directed node-edge graph with visible initial/final status and issue highlighting.

### Analysis
- missing initial state;
- multiple initial states;
- unreachable states;
- unexpected dead states;
- malformed transition references;
- duplicate deterministic transitions;
- cycles;
- no final state;
- unreachable final states.

### Simulation
Input events, step-by-step execution, current state, transition trace, accepted/rejected result, failure reason.

### Test generation
Shortest paths to final states, several valid paths, and bounded invalid sequences created from reachable prefixes.

## 10. Important Semantics
- Exactly one initial state is required for analysis/simulation.
- A final state may intentionally have no outgoing transitions.
- A non-final state with no outgoing transitions is an unexpected dead state.
- A cycle is a warning, not automatically a bug.
- In DFA mode, a `(state, event)` pair may have at most one target.

## 11. Example
E-Commerce workflow:
LOGIN --login--> HOME
HOME --add_to_cart--> CART
CART --checkout--> CHECKOUT
CHECKOUT --pay--> PAYMENT
PAYMENT --success--> ORDER_CONFIRMED
PAYMENT --failure--> PAYMENT_FAILED
PAYMENT_FAILED --retry--> PAYMENT

Expected analysis:
- 7 states
- 7 transitions
- all states reachable
- 1 intentional cycle
- ORDER_CONFIRMED final

## 12. Success Criteria
A user can build, save, reload, analyze, simulate, and generate tests for a workflow. The automata engine independently handles validation, reachability, dead-state detection, cycle detection, determinism, simulation, and path generation.

The core algorithms should be implemented in the project's own domain layer rather than hidden behind a third-party automata package.

## 13. Roadmap
### v1.1
Coverage, better test generation, shortest-path explanations, JSON import/export.

### v2
NFA mode, NFA→DFA, DFA equivalence, DFA minimization.

### v3
Workflow security analysis, authentication-bypass detection, runtime monitoring.

### v4
CFG/PDA support for nested workflows and advanced verification.

## 14. Positioning
StateLint is a lightweight developer tool that applies finite automata theory to application workflow modeling, validation, simulation, optimization, and test generation. It is not merely a flowchart editor.
