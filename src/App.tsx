import React, { useEffect } from 'react';
import { BoardHeader } from './components/board/BoardHeader';
import { BoardFilters } from './components/board/BoardFilters';
import { KanbanBoard } from './components/board/KanbanBoard';
import { CardDetailModal } from './components/board/CardDetailModal';
import { useAuthStore } from './store/useAuthStore';
import { useBoardStore } from './store/useBoardStore';
import { useSocketRealtime } from './hooks/useSocketRealtime';

export const App: React.FC = () => {
  const fetchUsers = useAuthStore((s) => s.fetchUsers);
  const fetchBoard = useBoardStore((s) => s.fetchBoard);

  // Initialize socket realtime listener
  useSocketRealtime();

  useEffect(() => {
    fetchUsers();
    fetchBoard();
  }, [fetchUsers, fetchBoard]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      <BoardHeader />
      <BoardFilters />
      <KanbanBoard />
      <CardDetailModal />
    </div>
  );
};

export default App;
