import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useBoardStore } from '../../store/useBoardStore';
import { useAuthStore } from '../../store/useAuthStore';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Plus, X } from 'lucide-react';
import { isPast, isToday, isThisWeek } from 'date-fns';

export const KanbanBoard: React.FC = () => {
  const { board, activeCard, setActiveCard, moveCard, createColumn, filters } = useBoardStore();
  const { currentUser } = useAuthStore();

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  if (!board) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400">
        Loading board...
      </div>
    );
  }

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    await createColumn(board.id, newColumnTitle.trim());
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = board.columns.flatMap((c) => c.cards).find((c) => c.id === active.id);
    if (card) setActiveCard(card);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceCol = board.columns.find((col) => col.cards.some((c) => c.id === activeId));
    const destCol = board.columns.find((col) => col.id === overId || col.cards.some((c) => c.id === overId));

    if (!sourceCol || !destCol) return;

    const newIndex = destCol.cards.findIndex((c) => c.id === overId);
    moveCard(
      activeId,
      sourceCol.id,
      destCol.id,
      newIndex >= 0 ? newIndex : destCol.cards.length
    );
  };

  // Filter cards per column with complete multi-filter support
  const filteredColumns = board.columns.map((col) => ({
    ...col,
    cards: col.cards.filter((card) => {
      // 1. Search Query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = card.title.toLowerCase().includes(query);
        const matchesDesc = card.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // 2. Selected Label
      if (filters.selectedLabelId) {
        if (!card.labels?.some((l) => l.labelId === filters.selectedLabelId)) return false;
      }

      // 3. Priority
      if (filters.selectedPriority !== 'ALL') {
        if (card.priority !== filters.selectedPriority) return false;
      }

      // 4. Assignee Filter
      if (filters.selectedAssigneeId) {
        if (!card.assignees?.some((a) => a.userId === filters.selectedAssigneeId)) return false;
      }

      // 5. Due Date Status Filter
      if (filters.selectedDueDateStatus !== 'ALL') {
        if (filters.selectedDueDateStatus === 'NO_DATE' && card.dueDate) return false;
        if (filters.selectedDueDateStatus !== 'NO_DATE' && !card.dueDate) return false;

        if (card.dueDate) {
          const date = new Date(card.dueDate);
          if (filters.selectedDueDateStatus === 'OVERDUE' && (!isPast(date) || col.title === 'Done')) return false;
          if (filters.selectedDueDateStatus === 'TODAY' && !isToday(date)) return false;
          if (filters.selectedDueDateStatus === 'THIS_WEEK' && !isThisWeek(date)) return false;
        }
      }

      // 6. Only My Tasks
      if (filters.onlyMyTasks && currentUser) {
        if (!card.assignees?.some((a) => a.userId === currentUser.id)) return false;
      }

      return true;
    })
  }));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <main className="flex-1 overflow-x-auto p-6 flex gap-6 items-start select-none">
        {filteredColumns.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}

        {/* Add New Column Section */}
        <div className="w-80 shrink-0">
          {isAddingColumn ? (
            <form
              onSubmit={handleCreateColumn}
              className="bg-neutral-100/90 dark:bg-neutral-900/80 p-3 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm space-y-2.5"
            >
              <input
                type="text"
                autoFocus
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="e.g. Backlog, Testing, Blocked..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
              />
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddingColumn(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
                >
                  <X size={15} />
                </button>
                <button
                  type="submit"
                  disabled={!newColumnTitle.trim()}
                  className="text-xs font-semibold px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Create Column
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-neutral-100/60 dark:hover:bg-neutral-900/60 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:white transition-all"
            >
              <Plus size={16} />
              <span>Add Another Column</span>
            </button>
          )}
        </div>
      </main>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};
