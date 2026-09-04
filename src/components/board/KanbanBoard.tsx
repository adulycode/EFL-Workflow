import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
import { Plus, X, Undo2, Check } from 'lucide-react';
import { isPast, isToday, isThisWeek } from 'date-fns';
import { GRADIENT_THEMES } from './BoardSettingsModal';

interface LastMoveInfo {
  cardId: string;
  cardTitle: string;
  sourceColId: string;
  destColId: string;
  sourceIndex: number;
  destIndex: number;
  destColTitle: string;
}

export const KanbanBoard: React.FC = () => {
  const { board, activeCard, setActiveCard, moveCard, createColumn, filters } = useBoardStore();
  const { currentUser } = useAuthStore();

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [lastMove, setLastMove] = useState<LastMoveInfo | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const boardMainRef = useRef<HTMLElement>(null);

  // Smooth Horizontal Scrolling on Mouse Wheel (converts vertical wheel deltaY to horizontal scroll when scrolling the board)
  useEffect(() => {
    const el = boardMainRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if user is scrolling inside a vertically scrollable container (e.g. card list)
      const target = e.target as HTMLElement | null;
      const scrollableChild = target?.closest('.overflow-y-auto') as HTMLElement | null;

      if (scrollableChild && scrollableChild !== el) {
        const canScrollUp = scrollableChild.scrollTop > 0;
        const canScrollDown =
          scrollableChild.scrollTop + scrollableChild.clientHeight < scrollableChild.scrollHeight - 1;

        if ((e.deltaY < 0 && canScrollUp) || (e.deltaY > 0 && canScrollDown)) {
          // Allow vertical scrolling inside the column
          return;
        }
      }

      // If user is already scrolling horizontally (trackpad or tilt-wheel), don't interfere
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      // Convert vertical scroll wheel (deltaY) to horizontal scroll (scrollLeft)
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Require deliberate movement on desktop and touch-hold on mobile/tablets
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8 // Requires 8px drag movement to prevent accidental clicks
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Requires 200ms hold on touch screens to lift the card
        tolerance: 6
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Clear Undo Toast after 6 seconds
  useEffect(() => {
    if (lastMove) {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => {
        setLastMove(null);
      }, 6000);
    }
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, [lastMove]);

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
    const currentActiveCard = activeCard;
    setActiveCard(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceCol = board.columns.find((col) => col.cards.some((c) => c.id === activeId));
    const destCol = board.columns.find((col) => col.id === overId || col.cards.some((c) => c.id === overId));

    if (!sourceCol || !destCol) return;

    const sourceIndex = sourceCol.cards.findIndex((c) => c.id === activeId);
    const newIndex = destCol.cards.findIndex((c) => c.id === overId);
    const finalDestIndex = newIndex >= 0 ? newIndex : destCol.cards.length;

    // If card moved to a different column or changed position
    if (sourceCol.id !== destCol.id || sourceIndex !== finalDestIndex) {
      setLastMove({
        cardId: activeId,
        cardTitle: currentActiveCard?.title || 'การ์ดงาน',
        sourceColId: sourceCol.id,
        destColId: destCol.id,
        sourceIndex,
        destIndex: finalDestIndex,
        destColTitle: destCol.title
      });

      moveCard(
        activeId,
        sourceCol.id,
        destCol.id,
        finalDestIndex
      );
    }
  };

  const handleUndo = () => {
    if (!lastMove) return;
    moveCard(
      lastMove.cardId,
      lastMove.destColId,
      lastMove.sourceColId,
      lastMove.sourceIndex
    );
    setLastMove(null);
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

  // Determine dynamic background styling
  const currentBgId = board.background || 'default';
  const matchedGradient = GRADIENT_THEMES.find((g) => g.id === currentBgId);
  const isCustomWallpaper = currentBgId.startsWith('http') || currentBgId.startsWith('data:');

  const bgClass = matchedGradient 
    ? matchedGradient.class 
    : (!isCustomWallpaper ? 'bg-gradient-to-br from-emerald-950/80 via-teal-900/40 to-slate-950' : '');

  const bgStyle = isCustomWallpaper ? {
    backgroundImage: `url("${currentBgId}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  } : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <main 
        ref={boardMainRef}
        className={`flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden p-6 select-none relative h-full transition-all duration-300 ${bgClass}`}
        style={bgStyle}
      >
        {isCustomWallpaper && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] pointer-events-none" />
        )}

        <div className="relative z-10 flex gap-6 items-start h-full pb-2 min-w-max">
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
        </div>
      </main>

      {/* Floating Drag Overlay (Card Lifting/Floating visual) */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
      </DragOverlay>

      {/* Instant Undo Toast (Safety against accidental drags) */}
      {lastMove && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white border border-slate-700 shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-3.5">
            <span className="text-xs font-medium flex items-center gap-1.5 truncate max-w-[240px] sm:max-w-md">
              <Check size={14} className="text-emerald-400 shrink-0" />
              <span>ย้ายไปยัง <strong className="text-emerald-300 font-bold">[{lastMove.destColTitle}]</strong></span>
            </span>

            <button
              onClick={handleUndo}
              className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-colors flex items-center gap-1 shrink-0"
            >
              <Undo2 size={13} />
              <span>ยกเลิก (Undo)</span>
            </button>

            <button
              onClick={() => setLastMove(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </DndContext>
  );
};
