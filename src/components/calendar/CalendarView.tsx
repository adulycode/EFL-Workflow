import React, { useState, useMemo } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isToday,
  isPast,
  setHours,
  setMinutes
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  AlertCircle, 
  CheckSquare, 
  Inbox, 
  Search, 
  GripVertical, 
  X,
  PanelRightClose,
  PanelRightOpen,
  Clock,
  LayoutGrid,
  ListTodo,
  CheckCircle2,
  Circle,
  User,
  ExternalLink,
  ChevronDown,
  Filter,
  Check
} from 'lucide-react';
import { Priority } from '../../types';

const PRIORITY_DOTS: Record<Priority, string> = {
  LOW: 'bg-neutral-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-amber-500',
  URGENT: 'bg-rose-500'
};

const PRIORITY_BADGES: Record<Priority, string> = {
  LOW: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
  MEDIUM: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
  HIGH: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
  URGENT: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
};

export const CalendarView: React.FC = () => {
  const { board, setSelectedCardId, filters, updateCard } = useBoardStore();
  const { currentUser } = useAuthStore();
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState(true);
  const [unscheduledSearch, setUnscheduledSearch] = useState('');
  const [dragOverDayIso, setDragOverDayIso] = useState<string | null>(null);
  const [isDragOverUnscheduled, setIsDragOverUnscheduled] = useState(false);

  // Agenda View States
  const [agendaFilterMineOnly, setAgendaFilterMineOnly] = useState(false);
  const [agendaFilterShowCompleted, setAgendaFilterShowCompleted] = useState(false);
  const [agendaSearch, setAgendaSearch] = useState('');
  const [agendaPage, setAgendaPage] = useState(1);

  if (!board) return null;

  // Gather all active cards across columns
  const allCards = board.columns.flatMap((col) =>
    col.cards.map((card) => ({ ...card, columnTitle: col.title }))
  );

  // Apply filters to cards
  const filteredCards = allCards.filter((card) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match = card.title.toLowerCase().includes(q) || card.description?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.selectedPriority !== 'ALL' && card.priority !== filters.selectedPriority) {
      return false;
    }
    if (filters.selectedLabelId) {
      const hasLabel = card.labels?.some((l) => l.labelId === filters.selectedLabelId);
      if (!hasLabel) return false;
    }
    if (filters.selectedAssigneeId) {
      const hasAssignee = card.assignees?.some((a) => a.userId === filters.selectedAssigneeId);
      if (!hasAssignee) return false;
    }
    return true;
  });

  // Separate into scheduled and unscheduled cards
  const scheduledCards = filteredCards.filter((c) => Boolean(c.dueDate));
  const unscheduledCards = filteredCards.filter((c) => !c.dueDate);

  // Filter unscheduled cards by drawer search query
  const displayUnscheduledCards = unscheduledCards.filter((card) => {
    if (!unscheduledSearch) return true;
    const q = unscheduledSearch.toLowerCase();
    return card.title.toLowerCase().includes(q) || card.columnTitle.toLowerCase().includes(q);
  });

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setAgendaPage(1);
  };
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setAgendaPage(1);
  };
  const goToToday = () => {
    setCurrentMonth(new Date());
    setAgendaPage(1);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverDay = (e: React.DragEvent, dayIso: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDayIso !== dayIso) {
      setDragOverDayIso(dayIso);
    }
  };

  const handleDragLeaveDay = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDayIso(null);
  };

  const handleDropOnDay = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDayIso(null);
    const cardId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('cardId');
    if (!cardId) return;

    // Preserve existing time if card had one, otherwise default to 18:00
    const existingCard = allCards.find((c) => c.id === cardId);
    let newDate = targetDate;
    if (existingCard?.dueDate) {
      const prev = new Date(existingCard.dueDate);
      newDate = setHours(targetDate, isNaN(prev.getHours()) ? 18 : prev.getHours());
      newDate = setMinutes(newDate, isNaN(prev.getMinutes()) ? 0 : prev.getMinutes());
    } else {
      newDate = setHours(targetDate, 18);
      newDate = setMinutes(newDate, 0);
    }

    await updateCard(cardId, { dueDate: newDate.toISOString() });
  };

  const handleDragOverUnscheduled = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverUnscheduled(true);
  };

  const handleDragLeaveUnscheduled = () => {
    setIsDragOverUnscheduled(false);
  };

  const handleDropOnUnscheduled = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUnscheduled(false);
    const cardId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('cardId');
    if (!cardId) return;

    await updateCard(cardId, { dueDate: undefined });
  };

  // Toggle Checklist Item Completion directly from Agenda
  const handleToggleChecklistItem = async (cardId: string, checklistId: string, itemId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/cards/${cardId}/checklists/${checklistId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !currentStatus })
      });
      useBoardStore.getState().fetchBoard();
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
    }
  };

  // Gather all scheduled items for Agenda / Deadlines view
  const allAgendaItems = useMemo(() => {
    // 1. Scheduled Cards
    const cardItems = filteredCards
      .filter((c) => Boolean(c.dueDate))
      .map((card) => {
        const d = new Date(card.dueDate!);
        const isColDone = /done|เสร็จ|complete/i.test(card.columnTitle);
        const allChk = card.checklists?.flatMap((c: any) => c.items) || [];
        const isAllChkDone = allChk.length > 0 && allChk.every((i: any) => i.isCompleted);
        const isDone = isColDone || isAllChkDone;
        const isOverdue = !isDone && isPast(d) && !isToday(d);
        const isDueToday = !isDone && isToday(d);
        const isThisMonth = isSameMonth(d, currentMonth);

        return {
          uniqueId: `card-${card.id}`,
          type: 'card' as const,
          id: card.id,
          card,
          title: card.title,
          dueDate: card.dueDate!,
          dateObj: d,
          isCompleted: isDone,
          isOverdue,
          isDueToday,
          isThisMonth,
          columnTitle: card.columnTitle,
          priority: card.priority || 'MEDIUM',
          assignees: card.assignees || [],
          checklists: card.checklists || []
        };
      });

    // 2. Scheduled To-Do items from checklists
    const todoItems = filteredCards.flatMap((card) => {
      return (card.checklists || []).flatMap((chk: any) => {
        return (chk.items || [])
          .filter((item: any) => Boolean(item.dueDate))
          .map((item: any) => {
            const d = new Date(item.dueDate);
            const isDone = Boolean(item.isCompleted);
            const isOverdue = !isDone && isPast(d) && !isToday(d);
            const isDueToday = !isDone && isToday(d);
            const isThisMonth = isSameMonth(d, currentMonth);

            return {
              uniqueId: `todo-${item.id}`,
              type: 'todo' as const,
              id: item.id,
              cardId: card.id,
              card,
              checklistId: chk.id,
              checklistTitle: chk.title,
              title: item.content,
              dueDate: item.dueDate,
              dateObj: d,
              isCompleted: isDone,
              completedAt: item.completedAt,
              isOverdue,
              isDueToday,
              isThisMonth,
              columnTitle: card.columnTitle,
              priority: card.priority || 'MEDIUM',
              assignees: card.assignees || [],
              checklists: []
            };
          });
      });
    });

    return [...cardItems, ...todoItems];
  }, [filteredCards, currentMonth]);

  // Filter Agenda items based on user filters
  const filteredAgendaItems = useMemo(() => {
    return allAgendaItems
      .filter((item) => {
        // Scoping: In current month OR overdue uncompleted
        if (!item.isThisMonth && !(item.isOverdue && !item.isCompleted)) {
          return false;
        }

        // Mine only filter
        if (agendaFilterMineOnly) {
          if (!currentUser) return false;
          const hasMe = item.assignees.some((a: any) => a.userId === currentUser.id);
          if (!hasMe) return false;
        }

        // Show completed toggle
        if (!agendaFilterShowCompleted && item.isCompleted) {
          return false;
        }

        // Agenda search
        if (agendaSearch.trim()) {
          const q = agendaSearch.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCard = item.card?.title.toLowerCase().includes(q);
          const matchCol = item.columnTitle?.toLowerCase().includes(q);
          if (!matchTitle && !matchCard && !matchCol) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 1. Overdue uncompleted first (earliest overdue first)
        if (a.isOverdue && !a.isCompleted && (!b.isOverdue || b.isCompleted)) return -1;
        if (b.isOverdue && !b.isCompleted && (!a.isOverdue || a.isCompleted)) return 1;

        // 2. Due today next
        if (a.isDueToday && !a.isCompleted && (!b.isDueToday || b.isCompleted)) return -1;
        if (b.isDueToday && !b.isCompleted && (!a.isDueToday || a.isCompleted)) return 1;

        // 3. Both uncompleted: chronological
        if (!a.isCompleted && !b.isCompleted) {
          return a.dateObj.getTime() - b.dateObj.getTime();
        }

        // 4. Completed items last
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;

        return b.dateObj.getTime() - a.dateObj.getTime();
      });
  }, [allAgendaItems, agendaFilterMineOnly, agendaFilterShowCompleted, agendaSearch, currentUser]);

  // Summary counts for Agenda badges
  const overdueCount = useMemo(() => allAgendaItems.filter((i) => i.isOverdue && !i.isCompleted).length, [allAgendaItems]);
  const dueTodayCount = useMemo(() => allAgendaItems.filter((i) => i.isDueToday && !i.isCompleted).length, [allAgendaItems]);
  const upcomingMonthCount = useMemo(() => allAgendaItems.filter((i) => i.isThisMonth && !i.isOverdue && !i.isDueToday && !i.isCompleted).length, [allAgendaItems]);
  const totalUpcomingCount = overdueCount + dueTodayCount + upcomingMonthCount;

  // Pagination for Agenda
  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filteredAgendaItems.length / PAGE_SIZE));
  const pagedAgendaItems = useMemo(() => {
    const start = (agendaPage - 1) * PAGE_SIZE;
    return filteredAgendaItems.slice(start, start + PAGE_SIZE);
  }, [filteredAgendaItems, agendaPage]);

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const dayIso = cloneDay.toISOString();
      const dayCards = scheduledCards.filter((c) => c.dueDate && isSameDay(new Date(c.dueDate), cloneDay));
      const isCurrentMonth = isSameMonth(cloneDay, monthStart);
      const isCurrentDay = isToday(cloneDay);
      const isDragTarget = dragOverDayIso === dayIso;

      days.push(
        <div
          key={dayIso}
          onDragOver={(e) => handleDragOverDay(e, dayIso)}
          onDragLeave={handleDragLeaveDay}
          onDrop={(e) => handleDropOnDay(e, cloneDay)}
          className={`min-h-[125px] p-2 border-b border-r border-neutral-200 dark:border-neutral-800 transition-all flex flex-col relative ${
            !isCurrentMonth
              ? 'bg-neutral-50/40 dark:bg-neutral-950/20 text-neutral-400 opacity-60'
              : 'bg-white dark:bg-neutral-900'
          } ${
            isDragTarget
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500 ring-inset z-10 scale-[1.01]'
              : ''
          } ${isCurrentDay && !isDragTarget ? 'ring-1 ring-inset ring-neutral-900 dark:ring-white' : ''}`}
        >
          {/* Day Number Header */}
          <div className="flex items-center justify-between mb-1.5 pointer-events-none">
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                isCurrentDay
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-extrabold shadow-2xs'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {format(cloneDay, 'd')}
            </span>

            {dayCards.length > 0 && (
              <span className="text-[10px] font-semibold text-neutral-400">
                {dayCards.length} {dayCards.length === 1 ? 'task' : 'tasks'}
              </span>
            )}
          </div>

          {/* Cards on this Day */}
          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[140px] pr-0.5">
            {dayCards.map((card) => {
              const isOverdue = card.dueDate && isPast(new Date(card.dueDate)) && card.columnTitle !== 'Done';
              const allChecklistItems = card.checklists?.flatMap((c: any) => c.items) || [];
              const totalItems = allChecklistItems.length;
              const completedItems = allChecklistItems.filter((i: any) => i.isCompleted).length;

              return (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id)}
                  onClick={() => setSelectedCardId(card.id)}
                  style={{ borderLeftColor: card.coverColor || undefined }}
                  className={`p-2 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-800/90 shadow-2xs hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 cursor-grab active:cursor-grabbing transition-all group select-none ${
                    card.coverColor ? 'border-l-4' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOTS[card.priority || 'MEDIUM']}`}
                        title={`Priority: ${card.priority}`}
                      />
                      <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 truncate uppercase">
                        {card.columnTitle}
                      </span>
                    </div>

                    <GripVertical size={11} className="text-neutral-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <h5 className="text-[11px] font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 leading-snug">
                    {card.title}
                  </h5>

                  <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-700/60 text-[10px] text-neutral-400">
                    <div className="flex items-center gap-1.5 truncate">
                      {isOverdue && (
                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5 shrink-0">
                          <AlertCircle size={10} /> Overdue
                        </span>
                      )}

                      {totalItems > 0 && (
                        <span className="flex items-center gap-0.5 font-medium shrink-0">
                          <CheckSquare size={10} /> {completedItems}/{totalItems}
                        </span>
                      )}
                    </div>

                    <div className="flex -space-x-1 shrink-0">
                      {card.assignees?.slice(0, 2).map(({ user }: any) => (
                        <img
                          key={user.id}
                          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                          alt={user.name}
                          title={user.name}
                          className="w-4 h-4 rounded-full ring-1 ring-white dark:ring-neutral-900 object-cover"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toISOString()} className="grid grid-cols-7">
        {days}
      </div>
    );
    days = [];
  }

  // Render individual Agenda Item Card
  const renderAgendaItem = (item: any) => {
    const isTodo = item.type === 'todo';
    const cardId = isTodo ? item.cardId : item.id;

    return (
      <div
        key={item.uniqueId}
        style={{ borderLeftColor: item.card?.coverColor || (item.isOverdue ? '#e11d48' : item.isDueToday ? '#f59e0b' : '#3b82f6') }}
        className={`flex items-center justify-between p-3 rounded-xl border border-l-4 transition-all group ${
          item.isCompleted
            ? 'bg-neutral-50/60 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
            : item.isOverdue
            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50 hover:border-rose-400 dark:hover:border-rose-700'
            : item.isDueToday
            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-700'
            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
          {/* Checkbox */}
          {isTodo ? (
            <input
              type="checkbox"
              checked={item.isCompleted}
              onChange={() => handleToggleChecklistItem(item.cardId, item.checklistId, item.id, item.isCompleted)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 dark:text-white focus:ring-0 cursor-pointer shrink-0"
            />
          ) : (
            <div
              onClick={() => setSelectedCardId(cardId)}
              className="h-4 w-4 rounded-full border-2 border-neutral-300 dark:border-neutral-600 flex items-center justify-center shrink-0 cursor-pointer hover:border-blue-500"
              title="Card item"
            >
              {item.isCompleted && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {/* Badges line */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {isTodo ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  TO-DO
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  CARD
                </span>
              )}

              {item.columnTitle && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {item.columnTitle}
                </span>
              )}

              {item.priority && (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${PRIORITY_BADGES[item.priority as Priority] || ''}`}>
                  {item.priority}
                </span>
              )}

              {isTodo && item.card && (
                <span
                  onClick={() => setSelectedCardId(cardId)}
                  className="text-[10px] text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate max-w-[200px]"
                  title={`การ์ด: ${item.card.title} (${item.checklistTitle})`}
                >
                  ใน {item.card.title}
                </span>
              )}
            </div>

            {/* Title */}
            <h4
              onClick={() => setSelectedCardId(cardId)}
              className={`text-xs font-bold truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                item.isCompleted
                  ? 'line-through text-neutral-400 dark:text-neutral-500'
                  : 'text-neutral-900 dark:text-white'
              }`}
              title={item.title}
            >
              {item.title}
            </h4>

            {/* Sub info */}
            {!isTodo && item.checklists && item.checklists.length > 0 && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-400">
                <CheckSquare size={11} />
                <span>
                  {item.checklists.flatMap((c: any) => c.items || []).filter((i: any) => i.isCompleted).length} /{' '}
                  {item.checklists.flatMap((c: any) => c.items || []).length} เช็กลิสต์
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Due Date Badge & Assignees */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Due date badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
              item.isCompleted
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
                : item.isOverdue
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900 animate-pulse'
                : item.isDueToday
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900'
            }`}
          >
            {item.isOverdue ? (
              <AlertCircle size={12} className="text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Clock size={12} className="shrink-0" />
            )}
            <span>
              {item.isCompleted
                ? 'เสร็จแล้ว'
                : item.isDueToday
                ? `วันนี้ ${format(item.dateObj, 'HH:mm')}`
                : item.isOverdue
                ? `เกินกำหนด ${format(item.dateObj, 'd MMM')}`
                : format(item.dateObj, 'd MMM, HH:mm')}
            </span>
          </div>

          {/* Assignees */}
          {item.assignees && item.assignees.length > 0 && (
            <div className="flex -space-x-1.5 shrink-0">
              {item.assignees.slice(0, 2).map(({ user }: any) => (
                <img
                  key={user.id}
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  title={user.name}
                  className="w-5 h-5 rounded-full ring-1 ring-white dark:ring-neutral-900 object-cover"
                />
              ))}
            </div>
          )}

          {/* Open Card Button */}
          <button
            type="button"
            onClick={() => setSelectedCardId(cardId)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="เปิดการ์ด"
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden animate-in fade-in duration-150">
      
      {/* Main Calendar View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navigation Header */}
        <div className="px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-950/40 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {viewMode === 'grid' 
                  ? 'ตารางส่งงานและกำหนดส่งประจำเดือน (ลากการ์ดเพื่อตั้งวันที่ได้)'
                  : 'กำหนดส่งงานและ To-Do Items ประจำเดือน เรียงตามความเร่งด่วน'}
              </p>
            </div>
          </div>

          {/* View Switcher Segmented Control */}
          <div className="flex items-center bg-neutral-200/70 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <LayoutGrid size={13} />
              <span>ตารางเดือน</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <ListTodo size={13} />
              <span>กำหนดส่งงาน</span>
              {totalUpcomingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {totalUpcomingCount}
                </span>
              )}
              {overdueCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse">
                  {overdueCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-0.5">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Toggle Unscheduled Drawer Button (Active in Grid View) */}
            {viewMode === 'grid' && (
              <button
                onClick={() => setShowUnscheduledDrawer(!showUnscheduledDrawer)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  showUnscheduledDrawer
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                }`}
              >
                <Inbox size={14} className="text-blue-500" />
                <span>งานที่ยังไม่กำหนดวัน ({unscheduledCards.length})</span>
                {showUnscheduledDrawer ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* View Mode 1: Month Grid View */}
        {viewMode === 'grid' && (
          <>
            {/* Weekday Header Columns */}
            <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-950/60 text-center text-xs font-bold text-neutral-600 dark:text-neutral-400 py-2.5">
              <div className="text-rose-500">Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Calendar Grid Days */}
            <div className="flex-1 overflow-y-auto">
              {rows}
            </div>
          </>
        )}

        {/* View Mode 2: Agenda / Deadlines View */}
        {viewMode === 'agenda' && (
          <div className="flex-1 flex flex-col min-h-0 bg-neutral-50/30 dark:bg-neutral-950/20">
            {/* Agenda Filter & Search Toolbar */}
            <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <div className="relative flex-1 max-w-xs">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={agendaSearch}
                    onChange={(e) => {
                      setAgendaSearch(e.target.value);
                      setAgendaPage(1);
                    }}
                    placeholder="ค้นหาชื่อการ์ด หรือ To-Do..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-blue-500"
                  />
                  {agendaSearch && (
                    <button
                      type="button"
                      onClick={() => setAgendaSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filter Mine Only */}
                <button
                  type="button"
                  onClick={() => {
                    setAgendaFilterMineOnly(!agendaFilterMineOnly);
                    setAgendaPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    agendaFilterMineOnly
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-2xs'
                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                  }`}
                >
                  <User size={13} className={agendaFilterMineOnly ? 'text-blue-500' : 'text-neutral-400'} />
                  <span>งานของฉัน</span>
                </button>

                {/* Filter Show Completed Toggle */}
                <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none ml-1">
                  <input
                    type="checkbox"
                    checked={agendaFilterShowCompleted}
                    onChange={(e) => {
                      setAgendaFilterShowCompleted(e.target.checked);
                      setAgendaPage(1);
                    }}
                    className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-900 dark:text-white focus:ring-0 cursor-pointer"
                  />
                  <span>แสดงงานที่เสร็จแล้ว</span>
                </label>
              </div>

              {/* Status Counters */}
              <div className="flex items-center gap-2">
                {overdueCount > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold">
                    <AlertCircle size={12} />
                    <span>เกินกำหนด {overdueCount}</span>
                  </div>
                )}
                {dueTodayCount > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-xs font-bold">
                    <Clock size={12} />
                    <span>วันนี้ {dueTodayCount}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold">
                  <span>ในเดือนนี้ {upcomingMonthCount}</span>
                </div>
              </div>
            </div>

            {/* Agenda Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {filteredAgendaItems.length === 0 ? (
                <div className="py-20 text-center text-xs text-neutral-400 space-y-2">
                  <ListTodo size={36} className="mx-auto text-neutral-300 dark:text-neutral-700" />
                  <p className="font-bold text-sm text-neutral-600 dark:text-neutral-400">
                    ไม่มีกำหนดส่งงานในเดือน {format(currentMonth, 'MMMM yyyy')}
                  </p>
                  <p className="text-neutral-400">
                    {agendaFilterMineOnly ? 'ไม่พบงานของคุณ หรือ' : ''} ทุกงานได้รับการจัดการเรียบร้อยแล้ว
                  </p>
                </div>
              ) : (
                (() => {
                  const overdueList = pagedAgendaItems.filter((i) => i.isOverdue && !i.isCompleted);
                  const todayList = pagedAgendaItems.filter((i) => i.isDueToday && !i.isCompleted);
                  const upcomingList = pagedAgendaItems.filter((i) => !i.isOverdue && !i.isDueToday && !i.isCompleted);
                  const completedList = pagedAgendaItems.filter((i) => i.isCompleted);

                  return (
                    <>
                      {/* Overdue Section (Pinned at top) */}
                      {overdueList.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-1">
                            <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                            <h3 className="text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                              เกินกำหนดส่ง (Overdue) • {overdueList.length} รายการ
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {overdueList.map(renderAgendaItem)}
                          </div>
                        </div>
                      )}

                      {/* Due Today Section */}
                      {todayList.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-1">
                            <div className="h-2 w-2 rounded-full bg-amber-500" />
                            <h3 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              กำหนดส่งวันนี้ (Due Today) • {todayList.length} รายการ
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {todayList.map(renderAgendaItem)}
                          </div>
                        </div>
                      )}

                      {/* Upcoming This Month Section */}
                      {upcomingList.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <h3 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              กำหนดส่งในเดือนนี้ (Upcoming) • {upcomingList.length} รายการ
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {upcomingList.map(renderAgendaItem)}
                          </div>
                        </div>
                      )}

                      {/* Completed Section */}
                      {completedList.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
                          <div className="flex items-center gap-2 px-1">
                            <CheckCircle2 size={13} className="text-emerald-500" />
                            <h3 className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                              งานที่เสร็จแล้ว (Completed) • {completedList.length} รายการ
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {completedList.map(renderAgendaItem)}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </div>

            {/* Pagination Controls */}
            {filteredAgendaItems.length > 0 && (
              <div className="flex items-center justify-between p-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-wrap gap-2 text-xs shadow-xs">
                <span className="text-neutral-500">
                  แสดง {(agendaPage - 1) * PAGE_SIZE + 1} - {Math.min(agendaPage * PAGE_SIZE, filteredAgendaItems.length)} จากทั้งหมด {filteredAgendaItems.length} รายการ
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={agendaPage <= 1}
                    onClick={() => setAgendaPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors font-semibold shadow-2xs"
                  >
                    <ChevronLeft size={14} /> ก่อนหน้า
                  </button>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 px-1">
                    {agendaPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={agendaPage >= totalPages}
                    onClick={() => setAgendaPage((p) => Math.min(totalPages, p + 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors font-semibold shadow-2xs"
                  >
                    ถัดไป <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unscheduled Cards Drawer Sidebar (Month Grid View Only) */}
      {viewMode === 'grid' && showUnscheduledDrawer && (
        <div
          onDragOver={handleDragOverUnscheduled}
          onDragLeave={handleDragLeaveUnscheduled}
          onDrop={handleDropOnUnscheduled}
          className={`w-72 border-l border-neutral-200 dark:border-neutral-800 flex flex-col bg-neutral-50/50 dark:bg-neutral-950/30 transition-all ${
            isDragOverUnscheduled
              ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 ring-2 ring-rose-400 ring-inset'
              : ''
          }`}
        >
          {/* Drawer Top Header */}
          <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Inbox size={15} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white leading-none">
                  งานที่ยังไม่มีกำหนดส่ง
                </h3>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  {unscheduledCards.length} รายการ (ลากไปวางในปฏิทินได้)
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowUnscheduledDrawer(false)}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Drawer Search */}
          <div className="p-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="ค้นหางานที่ยังไม่กำหนดวัน..."
                value={unscheduledSearch}
                onChange={(e) => setUnscheduledSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Drop Zone Notification when dragging */}
          {isDragOverUnscheduled && (
            <div className="p-3 m-2 rounded-xl border-2 border-dashed border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-center text-xs font-bold text-rose-600 dark:text-rose-300 animate-pulse">
              วางที่นี่เพื่อล้างกำหนดส่ง (Unschedule)
            </div>
          )}

          {/* Unscheduled Cards List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {displayUnscheduledCards.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                <Inbox size={28} className="mx-auto mb-2 opacity-30" />
                <p className="font-semibold">ไม่มีงานค้างที่ยังไม่ลงวันที่</p>
                <p className="text-[10px] mt-0.5 text-neutral-400">ทุกงานในบอร์ดมีกำหนดส่งครบแล้ว 🎉</p>
              </div>
            ) : (
              displayUnscheduledCards.map((card) => {
                const allChecklistItems = card.checklists?.flatMap((c: any) => c.items) || [];
                const totalItems = allChecklistItems.length;
                const completedItems = allChecklistItems.filter((i: any) => i.isCompleted).length;

                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    onClick={() => setSelectedCardId(card.id)}
                    style={{ borderLeftColor: card.coverColor || undefined }}
                    className={`p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 cursor-grab active:cursor-grabbing transition-all group select-none ${
                      card.coverColor ? 'border-l-4' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${PRIORITY_BADGES[card.priority || 'MEDIUM']}`}>
                        {card.columnTitle}
                      </span>
                      <GripVertical size={12} className="text-neutral-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-2 leading-snug">
                      {card.title}
                    </h4>

                    <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400">
                      <span className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
                        <Clock size={10} /> ยังไม่ระบุวัน
                      </span>

                      {totalItems > 0 && (
                        <span className="flex items-center gap-0.5">
                          <CheckSquare size={10} /> {completedItems}/{totalItems}
                        </span>
                      )}

                      <div className="flex -space-x-1 shrink-0">
                        {card.assignees?.slice(0, 2).map(({ user }: any) => (
                          <img
                            key={user.id}
                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                            alt={user.name}
                            title={user.name}
                            className="w-4 h-4 rounded-full ring-1 ring-white dark:ring-neutral-900 object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Bottom Hint */}
          <div className="p-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 text-[10px] text-neutral-500 text-center font-medium">
            💡 ลากการ์ดไปหย่อนในวันที่ต้องการบนปฏิทิน
          </div>
        </div>
      )}

    </div>
  );
};
