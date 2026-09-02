export function analyzeAutomaton(automaton) {
    const issues = [];
    const states = automaton.states;
    const transitions = automaton.transitions;
    const initialStates = states.filter(s => s.isInitial);
    if (initialStates.length === 0) {
        issues.push({
            type: 'MISSING_INITIAL',
            severity: 'ERROR',
            message: 'Workflow has no initial state.'
        });
    }
    else if (initialStates.length > 1) {
        issues.push({
            type: 'MULTIPLE_INITIAL',
            severity: 'ERROR',
            message: 'Workflow has multiple initial states.',
            affectedStateIds: initialStates.map(s => s.id)
        });
    }
    // Determinism check: duplicate (fromStateId, event)
    const transitionMap = new Map();
    for (const t of transitions) {
        const key = `${t.fromStateId}:${t.event}`;
        const existing = transitionMap.get(key) || [];
        existing.push(t.id);
        transitionMap.set(key, existing);
    }
    for (const [key, tIds] of transitionMap.entries()) {
        if (tIds.length > 1) {
            const [fromStateId, event] = key.split(':');
            issues.push({
                type: 'DETERMINISM_CONFLICT',
                severity: 'ERROR',
                message: `Non-deterministic transition conflict for state ${fromStateId} on event '${event}'.`,
                affectedStateIds: [fromStateId],
                affectedTransitionIds: tIds
            });
        }
    }
    // Reachability (BFS)
    const reachable = new Set();
    if (initialStates.length === 1) {
        const queue = [initialStates[0].id];
        reachable.add(initialStates[0].id);
        while (queue.length > 0) {
            const curr = queue.shift();
            for (const t of transitions) {
                if (t.fromStateId === curr && !reachable.has(t.toStateId)) {
                    reachable.add(t.toStateId);
                    queue.push(t.toStateId);
                }
            }
        }
    }
    const unreachableStateIds = states.filter(s => !reachable.has(s.id)).map(s => s.id);
    if (unreachableStateIds.length > 0) {
        issues.push({
            type: 'UNREACHABLE_STATE',
            severity: 'WARNING',
            message: `${unreachableStateIds.length} state(s) unreachable from initial state.`,
            affectedStateIds: unreachableStateIds
        });
    }
    // Dead-state detection (cannot reach any final state)
    const finalStateIds = new Set(states.filter(s => s.isFinal).map(s => s.id));
    const canReachFinal = new Set(finalStateIds);
    let changed = true;
    while (changed) {
        changed = false;
        for (const t of transitions) {
            if (canReachFinal.has(t.toStateId) && !canReachFinal.has(t.fromStateId)) {
                canReachFinal.add(t.fromStateId);
                changed = true;
            }
        }
    }
    const deadStateIds = states.filter(s => !canReachFinal.has(s.id)).map(s => s.id);
    if (deadStateIds.length > 0) {
        issues.push({
            type: 'DEAD_STATE',
            severity: 'WARNING',
            message: `${deadStateIds.length} state(s) cannot reach any final state.`,
            affectedStateIds: deadStateIds
        });
    }
    // Cycle detection (DFS)
    const cycles = [];
    const visited = new Set();
    const stack = new Set();
    const path = [];
    function dfs(stateId) {
        visited.add(stateId);
        stack.add(stateId);
        path.push(stateId);
        const outgoing = transitions.filter(t => t.fromStateId === stateId);
        for (const t of outgoing) {
            if (!visited.has(t.toStateId)) {
                dfs(t.toStateId);
            }
            else if (stack.has(t.toStateId)) {
                const cycleStartIndex = path.indexOf(t.toStateId);
                if (cycleStartIndex !== -1) {
                    cycles.push([...path.slice(cycleStartIndex), t.toStateId]);
                }
            }
        }
        path.pop();
        stack.delete(stateId);
    }
    for (const s of states) {
        if (!visited.has(s.id)) {
            dfs(s.id);
        }
    }
    if (cycles.length > 0) {
        issues.push({
            type: 'CYCLE_DETECTED',
            severity: 'WARNING',
            message: `${cycles.length} cycle(s) detected in workflow.`,
            affectedStateIds: Array.from(new Set(cycles.flat()))
        });
    }
    const hasError = issues.some(i => i.severity === 'ERROR');
    return {
        isValid: !hasError,
        stateCount: states.length,
        transitionCount: transitions.length,
        reachableStateIds: Array.from(reachable),
        unreachableStateIds,
        deadStateIds,
        hasCycles: cycles.length > 0,
        cycles,
        issues
    };
}
export function simulateAutomaton(automaton, events) {
    const initial = automaton.states.find(s => s.isInitial);
    if (!initial) {
        return { accepted: false, currentStateId: '', path: [], failureReason: 'No initial state defined' };
    }
    let currentStateId = initial.id;
    const path = [];
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const match = automaton.transitions.find(t => t.fromStateId === currentStateId && t.event === event);
        if (!match) {
            return {
                accepted: false,
                currentStateId,
                path,
                failureReason: `No valid transition from state '${currentStateId}' on event '${event}' at step ${i + 1}`
            };
        }
        path.push({
            step: i + 1,
            fromStateId: currentStateId,
            event,
            toStateId: match.toStateId,
            transitionId: match.id
        });
        currentStateId = match.toStateId;
    }
    const currentState = automaton.states.find(s => s.id === currentStateId);
    const isFinal = Boolean(currentState?.isFinal);
    return {
        accepted: isFinal,
        currentStateId,
        path,
        failureReason: isFinal ? undefined : `Simulation ended in state '${currentStateId}', which is not a final state`
    };
}
export function generateTestSequences(automaton, maxTests = 20, maxPathLength = 25) {
    const initial = automaton.states.find(s => s.isInitial);
    if (!initial)
        return [];
    const sequences = [];
    const finalStates = automaton.states.filter(s => s.isFinal);
    // Shortest path BFS to final states
    for (const finalState of finalStates) {
        if (sequences.length >= maxTests)
            break;
        const queue = [{ stateId: initial.id, events: [] }];
        const visited = new Set([initial.id]);
        let foundPath = null;
        while (queue.length > 0) {
            const { stateId, events } = queue.shift();
            if (stateId === finalState.id) {
                foundPath = events;
                break;
            }
            if (events.length >= maxPathLength)
                continue;
            for (const t of automaton.transitions.filter(tr => tr.fromStateId === stateId)) {
                if (!visited.has(t.toStateId)) {
                    visited.add(t.toStateId);
                    queue.push({ stateId: t.toStateId, events: [...events, t.event] });
                }
            }
        }
        if (foundPath) {
            sequences.push({
                type: 'VALID',
                name: `Path to ${finalState.name || finalState.id}`,
                events: foundPath,
                expectedAccepted: true,
                description: `Valid sequence reaching final state ${finalState.name || finalState.id}`,
                expectedFinalStateId: finalState.id
            });
        }
    }
    // Invalid sequences: valid prefix + non-existent event
    if (sequences.length < maxTests) {
        const validPaths = sequences.filter(s => s.type === 'VALID');
        for (const vp of validPaths) {
            if (sequences.length >= maxTests)
                break;
            // Find state at end of prefix or mid-point
            const sim = simulateAutomaton(automaton, vp.events);
            if (sim.path.length > 0) {
                const lastStep = sim.path[sim.path.length - 1];
                const stateId = lastStep.toStateId;
                const validEvents = new Set(automaton.transitions.filter(t => t.fromStateId === stateId).map(t => t.event));
                const invalidEvent = 'INVALID_EVENT_TRIGGER';
                if (!validEvents.has(invalidEvent)) {
                    sequences.push({
                        type: 'INVALID',
                        name: `Invalid step after ${vp.name}`,
                        events: [...vp.events, invalidEvent],
                        expectedAccepted: false,
                        description: `Invalid sequence attempting forbidden event '${invalidEvent}' from state '${stateId}'`,
                        failingEventIndex: vp.events.length
                    });
                }
            }
        }
    }
    return sequences;
}
/**
 * NFA -> DFA Conversion via Powerset / Subset Construction Algorithm.
 * Resolves non-deterministic transitions and epsilon transitions into a deterministic DFA.
 */
export function convertNFAToDFA(nfa) {
    const initialNFA = nfa.states.find(s => s.isInitial);
    if (!initialNFA) {
        return {
            originalNFAStateCount: nfa.states.length,
            convertedDFAStateCount: 0,
            subsetMap: [],
            automaton: { states: [], transitions: [] }
        };
    }
    // Get epsilon-closure of a set of NFA state IDs
    function getEpsilonClosure(stateIds) {
        const closure = new Set(stateIds);
        const queue = [...stateIds];
        while (queue.length > 0) {
            const curr = queue.shift();
            const epsilonTransitions = nfa.transitions.filter(t => t.fromStateId === curr && (t.event === '' || t.event.toLowerCase() === 'ε' || t.event.toLowerCase() === 'eps'));
            for (const et of epsilonTransitions) {
                if (!closure.has(et.toStateId)) {
                    closure.add(et.toStateId);
                    queue.push(et.toStateId);
                }
            }
        }
        return Array.from(closure).sort();
    }
    // Collect all alphabet symbols excluding epsilons
    const alphabet = Array.from(new Set(nfa.transitions
        .map(t => t.event)
        .filter(e => e && e !== 'ε' && e.toLowerCase() !== 'eps')));
    const initialClosure = getEpsilonClosure([initialNFA.id]);
    const initialSubsetKey = initialClosure.join(',');
    const dfaSubsets = [initialClosure];
    const dfaStateMap = new Map(); // subsetKey -> dfaStateId
    const dfaStates = [];
    const dfaTransitions = [];
    const subsetMap = [];
    function getSubsetKey(subset) {
        return subset.join(',');
    }
    function getOrCreateDFAState(subset) {
        const key = getSubsetKey(subset);
        if (dfaStateMap.has(key)) {
            return dfaStateMap.get(key);
        }
        const dfaId = `dfa_s${dfaStates.length + 1}`;
        dfaStateMap.set(key, dfaId);
        const nfaStateNames = subset
            .map(id => nfa.states.find(s => s.id === id)?.name || id)
            .join('_');
        const dfaName = nfaStateNames || dfaId;
        const isInitial = key === initialSubsetKey;
        const isFinal = subset.some(id => nfa.states.find(s => s.id === id)?.isFinal);
        dfaStates.push({
            id: dfaId,
            name: dfaName,
            isInitial,
            isFinal
        });
        subsetMap.push({
            dfaStateName: dfaName,
            nfaStateIds: subset
        });
        return dfaId;
    }
    const initialDFAId = getOrCreateDFAState(initialClosure);
    const queue = [initialClosure];
    const processedKeys = new Set();
    while (queue.length > 0) {
        const currentSubset = queue.shift();
        const currentKey = getSubsetKey(currentSubset);
        if (processedKeys.has(currentKey))
            continue;
        processedKeys.add(currentKey);
        const fromDFAId = dfaStateMap.get(currentKey);
        for (const symbol of alphabet) {
            // Find all target NFA states for symbol from any state in currentSubset
            const targetNFAIds = new Set();
            for (const nfaId of currentSubset) {
                const matches = nfa.transitions.filter(t => t.fromStateId === nfaId && t.event === symbol);
                for (const m of matches) {
                    targetNFAIds.add(m.toStateId);
                }
            }
            if (targetNFAIds.size > 0) {
                const nextClosure = getEpsilonClosure(Array.from(targetNFAIds));
                const nextKey = getSubsetKey(nextClosure);
                const isNew = !dfaStateMap.has(nextKey);
                const toDFAId = getOrCreateDFAState(nextClosure);
                dfaTransitions.push({
                    id: `dfa_t_${fromDFAId}_${toDFAId}_${symbol}`,
                    fromStateId: fromDFAId,
                    toStateId: toDFAId,
                    event: symbol
                });
                if (isNew && !processedKeys.has(nextKey)) {
                    queue.push(nextClosure);
                }
            }
        }
    }
    // Calculate 2D position for dfaStates
    const positionedDFAStates = dfaStates.map((s, idx) => ({
        ...s,
        positionX: 180 + (idx % 3) * 260,
        positionY: 120 + Math.floor(idx / 3) * 180
    }));
    return {
        originalNFAStateCount: nfa.states.length,
        convertedDFAStateCount: dfaStates.length,
        subsetMap,
        automaton: {
            states: positionedDFAStates,
            transitions: dfaTransitions
        }
    };
}
/**
 * DFA State Minimization via Hopcroft Partitioning Algorithm.
 * Merges equivalent states into a minimal canonical DFA.
 */
export function minimizeDFA(dfa) {
    if (dfa.states.length <= 1) {
        return {
            originalStateCount: dfa.states.length,
            minimizedStateCount: dfa.states.length,
            mergedGroups: [],
            automaton: dfa
        };
    }
    const allStateIds = dfa.states.map(s => s.id);
    const finalStateIds = new Set(dfa.states.filter(s => s.isFinal).map(s => s.id));
    const nonFinalStateIds = new Set(allStateIds.filter(id => !finalStateIds.has(id)));
    // Initial partition P = { Final, NonFinal }
    let partitions = [];
    if (finalStateIds.size > 0)
        partitions.push(finalStateIds);
    if (nonFinalStateIds.size > 0)
        partitions.push(nonFinalStateIds);
    const alphabet = Array.from(new Set(dfa.transitions.map(t => t.event)));
    function getPartitionIndex(stateId, parts) {
        return parts.findIndex(p => p.has(stateId));
    }
    let changed = true;
    while (changed) {
        changed = false;
        const newPartitions = [];
        for (const group of partitions) {
            if (group.size <= 1) {
                newPartitions.push(group);
                continue;
            }
            // Split group based on transitions for each alphabet symbol
            const subGroups = new Map();
            for (const stateId of group) {
                const signature = alphabet
                    .map(sym => {
                    const tr = dfa.transitions.find(t => t.fromStateId === stateId && t.event === sym);
                    return tr ? getPartitionIndex(tr.toStateId, partitions) : -1;
                })
                    .join('|');
                const existing = subGroups.get(signature) || new Set();
                existing.add(stateId);
                subGroups.set(signature, existing);
            }
            const splitSets = Array.from(subGroups.values());
            if (splitSets.length > 1) {
                changed = true;
            }
            newPartitions.push(...splitSets);
        }
        partitions = newPartitions;
    }
    // Build minimized DFA from partitions
    const minStates = [];
    const minTransitions = [];
    const oldToNewStateId = new Map();
    const mergedGroups = [];
    partitions.forEach((group, idx) => {
        const groupArr = Array.from(group);
        const minId = `min_s${idx + 1}`;
        const origStates = groupArr.map(id => dfa.states.find(s => s.id === id));
        const mergedName = origStates.map(s => s.name || s.id).join('_');
        const isInitial = origStates.some(s => s.isInitial);
        const isFinal = origStates.some(s => s.isFinal);
        groupArr.forEach(id => oldToNewStateId.set(id, minId));
        minStates.push({
            id: minId,
            name: mergedName,
            isInitial,
            isFinal
        });
        mergedGroups.push({
            mergedName,
            originalStateIds: groupArr
        });
    });
    // Re-map transitions removing duplicates
    const transitionSet = new Set();
    for (const tr of dfa.transitions) {
        const newFrom = oldToNewStateId.get(tr.fromStateId);
        const newTo = oldToNewStateId.get(tr.toStateId);
        if (newFrom && newTo) {
            const key = `${newFrom}:${tr.event}:${newTo}`;
            if (!transitionSet.has(key)) {
                transitionSet.add(key);
                minTransitions.push({
                    id: `min_tr_${minTransitions.length + 1}`,
                    fromStateId: newFrom,
                    toStateId: newTo,
                    event: tr.event
                });
            }
        }
    }
    // Assign 2D positions for minimized states
    const positionedMinStates = minStates.map((s, idx) => ({
        ...s,
        positionX: 180 + (idx % 3) * 260,
        positionY: 120 + Math.floor(idx / 3) * 180
    }));
    return {
        originalStateCount: dfa.states.length,
        minimizedStateCount: minStates.length,
        mergedGroups,
        automaton: {
            states: positionedMinStates,
            transitions: minTransitions
        }
    };
}
