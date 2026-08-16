import React, { useEffect, useState } from 'react';
import { BoardHeader } from './components/board/BoardHeader';
import { BoardFilters } from './components/board/BoardFilters';
import { KanbanBoard } from './components/board/KanbanBoard';
import { CardDetailModal } from './components/board/CardDetailModal';
import { WorkspaceOverview } from './components/workspace/WorkspaceOverview';
import { useAuthStore } from './store/useAuthStore';
import { useWorkspaceStore } from './store/useWorkspaceStore';
import { useSocketRealtime } from './hooks/useSocketRealtime';

export const App: React.FC = () => {
  const fetchUsers = useAuthStore((s) => s.fetchUsers);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const [currentView, setCurrentView] = useState<'overview' | 'board'>('board');

  // Initialize socket realtime listener
  useSocketRealtime();

  useEffect(() => {
    fetchUsers().then(() => {
      fetchWorkspaces();
    });
  }, [fetchUsers, fetchWorkspaces]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      <BoardHeader currentView={currentView} onToggleView={setCurrentView} />

      {currentView === 'overview' ? (
        <WorkspaceOverview onSelectWorkspace={() => setCurrentView('board')} />
      ) : (
        <>
          <BoardFilters />
          <KanbanBoard />
        </>
      )}

      <CardDetailModal />
    </div>
  );
};

export default App;
