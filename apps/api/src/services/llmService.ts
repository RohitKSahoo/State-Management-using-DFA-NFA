import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface StateDefinition {
  id: string;
  name: string;
  isInitial: boolean;
  isFinal: boolean;
  description?: string;
  reason?: string;
}

export interface TransitionDefinition {
  from: string;
  to: string;
  event: string;
}

export interface WorkflowLLMPreview {
  projectName: string;
  coreStates: StateDefinition[];
  coreTransitions: TransitionDefinition[];
  edgeCaseStates: StateDefinition[];
  edgeCaseTransitions: TransitionDefinition[];
}

export async function enhanceUserPrompt(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const systemInstruction = `You are a software architect and state machine expert.
The user will provide a simple application idea or feature description.
Your job is to expand and refine it into a comprehensive specification suitable for building an Finite State Automaton / State Machine diagram.
Include key user actions, state transitions, error handling scenarios, and edge cases.
Keep the output concise, structured, and under 250 words. Plain text only, no markdown formatting like bolding or headers.`;

  try {
    const result = await model.generateContent([
      { text: systemInstruction },
      { text: `Refine this application idea: "${prompt}"` }
    ]);
    const responseText = result.response.text().trim();
    return responseText || prompt;
  } catch (err: any) {
    console.error('Gemini enhance prompt error:', err?.message || err);
    // Fallback if model fails
    return `${prompt} (Expanded: Includes initialization, standard operating states, error handling, pause/resume mechanisms, and final teardown/cleanup states).`;
  }
}

export async function generateLLMWorkflowPreview(prompt: string): Promise<WorkflowLLMPreview> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const promptText = `You are an expert systems architect and automata engine designer.
Analyze the following application prompt and design a state machine workflow diagram:
"${prompt}"

Produce a valid JSON object matching this exact JSON schema:
{
  "projectName": "Name of the app state machine",
  "coreStates": [
    {
      "id": "s1",
      "name": "UPPERCASE_STATE_NAME",
      "isInitial": true,
      "isFinal": false,
      "description": "Short state summary"
    }
  ],
  "coreTransitions": [
    {
      "from": "s1",
      "to": "s2",
      "event": "snake_case_event_name"
    }
  ],
  "edgeCaseStates": [
    {
      "id": "e1",
      "name": "UPPERCASE_EDGE_STATE_NAME",
      "isInitial": false,
      "isFinal": false,
      "description": "Description of edge case or error state",
      "reason": "Why this edge case occurs (e.g. Network drop, Buffer stall, Auth timeout)"
    }
  ],
  "edgeCaseTransitions": [
    {
      "from": "s1",
      "to": "e1",
      "event": "error_trigger_event"
    }
  ]
}

Rules:
1. Exactly one core state must have "isInitial": true.
2. State IDs for core states should use prefix 's' (e.g., s1, s2, s3).
3. State IDs for edge case states should use prefix 'e' (e.g., e1, e2, e3).
4. Edge case states should include failure/error/recovery states, network timeouts, invalid inputs, or resource exhausted states.
5. Provide 6-8 core states and 4-8 edge case states with appropriate connecting transitions.
6. Use UPPERCASE for state names and lowercase_snake_case for event names.`;

  try {
    const result = await model.generateContent(promptText);
    const text = result.response.text();
    const parsed: WorkflowLLMPreview = JSON.parse(text);
    return parsed;
  } catch (err: any) {
    console.error('Gemini generate workflow error:', err?.message || err);
    // Return structured fallback
    return {
      projectName: `${prompt.slice(0, 20)} State Machine`,
      coreStates: [
        { id: 's1', name: 'IDLE', isInitial: true, isFinal: false, description: 'Initial ready state' },
        { id: 's2', name: 'ACTIVE', isInitial: false, isFinal: false, description: 'Processing primary action' },
        { id: 's3', name: 'COMPLETED', isInitial: false, isFinal: true, description: 'Workflow finished successfully' }
      ],
      coreTransitions: [
        { from: 's1', to: 's2', event: 'start' },
        { from: 's2', to: 's3', event: 'finish' }
      ],
      edgeCaseStates: [
        { id: 'e1', name: 'NETWORK_ERROR', isInitial: false, isFinal: false, description: 'Connection dropped', reason: 'High latency or offline network' },
        { id: 'e2', name: 'TIMEOUT_RETRY', isInitial: false, isFinal: false, description: 'Operation timed out', reason: 'Server took too long to respond' }
      ],
      edgeCaseTransitions: [
        { from: 's2', to: 'e1', event: 'network_lost' },
        { from: 'e1', to: 's2', event: 'reconnect' },
        { from: 's2', to: 'e2', event: 'timeout' }
      ]
    };
  }
}
