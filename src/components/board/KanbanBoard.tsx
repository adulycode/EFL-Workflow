import React from 'react';
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

export const KanbanBoard: React.FC = () => {
  const { board, activeCard, setActiveCard, moveCard, filters } = useBoardStore();
  const { currentUser } = useAuthStore();

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

  // Filter cards per column
  const filteredColumns = board.columns.map((col) => ({
    ...col,
    cards: col.cards.filter((card) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = card.title.toLowerCase().includes(query);
        const matchesDesc = card.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      if (filters.selectedLabelId) {
        if (!card.labels?.some((l) => l.label.id === filters.selectedLabelId)) return false;
      }
      if (filters.selectedPriority !== 'ALL') {
        if (card.priority !== filters.selectedPriority) return false;
      }
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
      </main>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};
