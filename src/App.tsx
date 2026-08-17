import React, { useEffect } from 'react';
import { BoardHeader } from './components/board/BoardHeader';
import { BoardFilters } from './components/board/BoardFilters';
import { KanbanBoard } from './components/board/KanbanBoard';
import { CalendarView } from './components/calendar/CalendarView';
import { CardDetailModal } from './components/board/CardDetailModal';
import { WorkspaceOverview } from './components/workspace/WorkspaceOverview';
import { useAuthStore } from './store/useAuthStore';
import { useWorkspaceStore } from './store/useWorkspaceStore';
import { useBoardStore } from './store/useBoardStore';
import { useSocketRealtime } from './hooks/useSocketRealtime';

export const App: React.FC = () => {
  const fetchUsers = useAuthStore((s) => s.fetchUsers);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const { viewMode, setViewMode } = useBoardStore();

  // Initialize socket realtime listener
  useSocketRealtime();

  useEffect(() => {
    fetchUsers().then(() => {
      fetchWorkspaces();
    });
  }, [fetchUsers, fetchWorkspaces]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      <BoardHeader />

      {viewMode === 'overview' ? (
        <WorkspaceOverview onSelectWorkspace={() => setViewMode('board')} />
      ) : viewMode === 'calendar' ? (
        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
          <BoardFilters />
          <div className="flex-1 min-h-0">
            <CalendarView />
          </div>
        </div>
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
