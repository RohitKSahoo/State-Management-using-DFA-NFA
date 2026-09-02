# StateLint — Project Flow

## 1. High-Level Flow
```text
USER
 ↓
Create/Open Project
 ↓
Workflow Editor
 ↓
Define States
 ↓
Define Transitions
 ↓
Set Initial State
 ↓
Set Final State(s)
 ↓
Save
 ↓
Analyze
 ↓
View Problems
 ↓
Fix Workflow
 ↓
Analyze Again
 ↓
Simulate
 ↓
Generate Tests
 ↓
Run Tests
```

## 2. System Layers
```text
USER INTERFACE
      ↓
WORKFLOW MODEL
      ↓
AUTOMATA ENGINE
      ↓
ANALYSIS / SIMULATION RESULTS
```

The graph is the interface; the automaton is the core.

## 3. Project Creation
```text
New Project
 ↓
Enter name/description
 ↓
POST /api/projects
 ↓
Backend creates project
 ↓
Frontend receives project ID
 ↓
Open project workspace
```

## 4. Workflow Creation
```text
Project
 ↓
New Workflow
 ↓
Enter name
 ↓
Create workflow
 ↓
Open editor
```

## 5. State Creation
```text
Add State
 ↓
Click canvas
 ↓
Temporary state
 ↓
Enter name
 ↓
Update editor state
 ↓
Save
 ↓
Backend validates
 ↓
Database persists
```

## 6. Transition Creation
```text
Add Transition
 ↓
Select source
 ↓
Select target
 ↓
Enter event
 ↓
Basic frontend validation
 ↓
Backend validation
 ↓
Persist
```

## 7. Analyze Flow
```text
Analyze
 ↓
POST /api/workflows/:id/analyze
 ↓
Load workflow
 ↓
Convert persistence model → Automaton
 ↓
Validate structure
 ↓
Check initial state
 ↓
Check determinism
 ↓
BFS/DFS reachability
 ↓
Find unreachable states
 ↓
Find unexpected dead states
 ↓
Detect cycles
 ↓
Calculate metrics
 ↓
Return result
 ↓
Highlight graph
 ↓
Show analysis panel
```

## 8. Simulation Flow
```text
Event sequence
 ↓
Load automaton
 ↓
Current = initial state
 ↓
Read event
 ↓
Find transition
 ↓
Move to target
 ↓
Repeat
 ↓
Events exhausted?
  ↙       ↘
 YES       NO
  ↓         ↓
Check      Continue
final
  ↓
ACCEPT / REJECT
```

## 9. Example Simulation
Workflow:
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
ORDER_CONFIRMED [FINAL]
```

Input:
`login → add_to_cart → checkout → pay → success`

Result:
`ACCEPTED`

## 10. Rejection Flow
Input:
`login → pay`

Execution:
```text
LOGIN
 ↓ login
HOME
 ↓ pay
???
```

Result:
```text
REJECTED
No transition from HOME using "pay".
```

## 11. Reachability Flow
If:
```text
LOGIN → HOME → CART → CHECKOUT
```
and `ADMIN_PANEL` has no incoming path:

```text
Reachable:
LOGIN, HOME, CART, CHECKOUT

Unreachable:
ADMIN_PANEL
```

## 12. Dead-State Flow
If `PAYMENT_FAILED` is non-final and has no outgoing transitions:
`Unexpected dead state: PAYMENT_FAILED`

If explicitly final, do not report it as an error.

## 13. Determinism Flow
If:
```text
PAYMENT --success--> SUCCESS
PAYMENT --success--> RECEIPT
```
report:
```text
DFA conflict:
State: PAYMENT
Input: success
Targets: SUCCESS, RECEIPT
```

## 14. Cycle Flow
Example:
`PAYMENT → FAILED → PAYMENT`

Report:
`Cycle detected. This may be intentional; review retry limits if required.`

## 15. Test Generation
### Valid
Use BFS to find shortest paths from the initial state to reachable final states and convert paths to event sequences.

### Invalid
At reachable states, select an event with no transition and append it to a valid prefix. Bound path length and test count.

## 16. Correction Loop
```text
Analyze
 ↓
Issue found
 ↓
Click issue
 ↓
Affected node/edge highlighted
 ↓
Developer fixes graph
 ↓
Analyze again
```

This should be a fast, central product loop.

## 17. Future Flow
```text
DESIGN
 ↓
FORMAL ANALYSIS
 ↓
DFA OPTIMIZATION
 ↓
TEST GENERATION
 ↓
DEPLOY
 ↓
RUNTIME EVENTS
 ↓
AUTOMATON
 ↓
VALID / INVALID BEHAVIOR
 ↓
ALERT
```

## 18. Product Rule
Always distinguish:
- mathematically invalid;
- structurally suspicious;
- intentionally designed behavior.

A cycle is not automatically a bug. Analysis should be explainable and actionable.
