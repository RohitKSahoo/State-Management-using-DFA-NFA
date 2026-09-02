import React, { useState } from 'react';
import { LandingPage } from './LandingPage';
import { Dashboard } from './Dashboard';
import { WorkflowEditor } from './WorkflowEditor';

export const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'dashboard' | 'editor'>('landing');
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  if (view === 'editor' && activeWorkflowId) {
    return (
      <WorkflowEditor
        workflowId={activeWorkflowId}
        onBack={() => {
          setActiveWorkflowId(null);
          setView('dashboard');
        }}
      />
    );
  }

  if (view === 'dashboard') {
    return (
      <Dashboard
        onOpenWorkflow={(id) => {
          setActiveWorkflowId(id);
          setView('editor');
        }}
        onBackToLanding={() => setView('landing')}
      />
    );
  }

  return <LandingPage onProceed={() => setView('dashboard')} />;
};

export default App;
