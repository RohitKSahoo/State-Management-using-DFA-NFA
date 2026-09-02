# StateLint — Frontend Guidelines

## 1. Objective
Build a professional developer-tool interface, not a generic student CRUD UI. The workflow graph is the dominant element; analysis and simulation should be immediately accessible.

## 2. Recommended Stack
- React
- TypeScript
- Vite
- React Flow or equivalent node-edge library
- Tailwind CSS or lightweight component primitives
- TanStack Query for server state
- Zustand or equivalent for editor state

## 3. UX Principles
Prioritize:
- information density;
- clear hierarchy;
- predictable interactions;
- keyboard-friendly controls;
- visible status;
- actionable errors.

Avoid excessive gradients, decorative animation, huge cards, and unnecessary rounded containers.

## 4. Main Layout
```text
┌─────────────────────────────────────────────────────────────┐
│ Header: StateLint | Project | Save | Analyze | Simulate     │
├───────────────┬───────────────────────────────┬─────────────┤
│ TOOLBAR       │                               │ ANALYSIS    │
│ Add State     │       WORKFLOW CANVAS        │ PANEL       │
│ Add Transition│                               │ Problems    │
│ Selected Node │                               │ Metrics     │
│ Properties    │                               │ Tests       │
├───────────────┴───────────────────────────────┴─────────────┤
│ Bottom/Modal: Simulation / Test Results                    │
└─────────────────────────────────────────────────────────────┘
```

## 5. Required Screens
### Dashboard
Show project name, description, last modified time, state/transition counts, validation status. Actions: new/open/delete.

### Workflow Editor
Header: project name, save, analyze, simulate, generate tests.
Left toolbar: select, add state, add transition, delete, fit graph, zoom.
Center: graph canvas.
Right: selected state/transition inspector.

## 6. State Node
Normal:
```text
┌────────────────────┐
│ LOGIN              │
└────────────────────┘
```

Final:
```text
╔════════════════════╗
║ ORDER CONFIRMED    ║
╚════════════════════╝
```

Initial state must have a clear start indicator. Do not rely on color alone.

## 7. State Creation
1. Click Add State.
2. Click canvas.
3. Create temporary node.
4. Ask for name immediately.
5. Enter confirms.
6. Update editor state.
7. Save to backend intentionally.

## 8. Transition Creation
1. Click Add Transition.
2. Select source.
3. Select destination.
4. Enter event label.
5. Save.

Prioritize correctness over fancy drag interactions.

## 9. Validation UX
Example:
```text
WORKFLOW STATUS
VALID WITH WARNINGS

States             8
Transitions        9
Reachable          8
Unreachable        0
Final States       1
Cycles             1

WARNINGS
Cycle detected:
PAYMENT → FAILED → PAYMENT
```

Messages must be actionable. Prefer:
`State PAYMENT has two transitions labeled "success"; DFA mode requires at most one target.`
over:
`Invalid workflow.`

## 10. Graph Highlighting
Highlight:
- unreachable nodes;
- dead nodes;
- conflicting transitions;
- cycle edges;
- simulation path.

Use consistent neutral/success/warning/error status semantics.

## 11. Simulation UI
Provide event chips or a sequence input:
```text
[ login ] [ add_to_cart ] [ checkout ] [ pay ]
[ Run ] [ Step ] [ Reset ]
```

Show:
- step index;
- input;
- source;
- target;
- success/failure.

Final:
`ACCEPTED` or `REJECTED` with reason.

## 12. Test Generation UI
Table:
| ID | Type | Sequence | Expected |
|---|---|---|---|
| T001 | Valid | login → home → cart | Accept |
| T002 | Invalid | login → pay | Reject |

Actions: run all, run one, copy sequence.

## 13. State Management
Keep server state separate from editor state.

Server:
- projects;
- persisted workflows.

Editor:
- selected node;
- temporary positions;
- unsaved changes;
- active tool;
- simulation state.

Do not call the API for every node movement.

## 14. Domain Types
```ts
type WorkflowState = {
  id: string;
  name: string;
  isInitial: boolean;
  isFinal: boolean;
  position: { x: number; y: number };
};

type WorkflowTransition = {
  id: string;
  sourceStateId: string;
  targetStateId: string;
  event: string;
};

type Workflow = {
  id: string;
  projectId: string;
  name: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
};
```

Keep graph-library objects separate from domain objects.

## 15. Error Handling
Distinguish:
- input errors;
- workflow analysis errors;
- server errors.

Never expose stack traces.

## 16. Accessibility
Use keyboard-accessible controls, visible focus, meaningful labels, icon tooltips, readable contrast, and non-color-only status communication.

## 17. Performance Target
Desktop-first. Target at least 100 states / 300 transitions without obvious editor lag. Avoid premature optimization; profile first.

## 18. Definition of Done
Every frontend feature must work with real backend data, handle loading/error/empty states, validate input, preserve state after reload, keep graph/domain models synchronized, and introduce no browser-console errors.
