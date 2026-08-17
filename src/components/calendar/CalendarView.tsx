import React, { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
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
  isPast
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, CheckSquare } from 'lucide-react';
import { Priority } from '../../types';

const PRIORITY_DOTS: Record<Priority, string> = {
  LOW: 'bg-neutral-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-amber-500',
  URGENT: 'bg-rose-500'
};

export const CalendarView: React.FC = () => {
  const { board, setSelectedCardId, filters } = useBoardStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

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
      const dayCards = filteredCards.filter((c) => c.dueDate && isSameDay(new Date(c.dueDate), cloneDay));
      const isCurrentMonth = isSameMonth(cloneDay, monthStart);
      const isCurrentDay = isToday(cloneDay);

      days.push(
        <div
          key={cloneDay.toISOString()}
          className={`min-h-[120px] p-2 border-b border-r border-neutral-200 dark:border-neutral-800 transition-colors flex flex-col ${
            !isCurrentMonth
              ? 'bg-neutral-50/50 dark:bg-neutral-950/20 text-neutral-400 opacity-60'
              : 'bg-white dark:bg-neutral-900'
          } ${isCurrentDay ? 'ring-1 ring-inset ring-neutral-900 dark:ring-white' : ''}`}
        >
          {/* Day Number Header */}
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                isCurrentDay
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-extrabold'
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
              const allChecklistItems = card.checklists?.flatMap((c) => c.items) || [];
              const totalItems = allChecklistItems.length;
              const completedItems = allChecklistItems.filter((i) => i.isCompleted).length;

              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  style={{ borderLeftColor: card.coverColor || undefined }}
                  className={`p-2 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-800/90 shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition-all ${
                    card.coverColor ? 'border-l-4' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${PRIORITY_DOTS[card.priority || 'MEDIUM']}`}
                      title={`Priority: ${card.priority}`}
                    />
                    <span className="text-[10px] font-semibold text-neutral-500 truncate uppercase">
                      {card.columnTitle}
                    </span>
                  </div>

                  <h5 className="text-[11px] font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 leading-snug">
                    {card.title}
                  </h5>

                  <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-700/60 text-[10px] text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      {isOverdue && (
                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                          <AlertCircle size={10} /> Overdue
                        </span>
                      )}

                      {totalItems > 0 && (
                        <span className="flex items-center gap-0.5 font-medium">
                          <CheckSquare size={10} /> {completedItems}/{totalItems}
                        </span>
                      )}
                    </div>

                    <div className="flex -space-x-1">
                      {card.assignees?.slice(0, 2).map(({ user }) => (
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden animate-in fade-in duration-150">
      {/* Calendar Top Navigation Header */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <CalendarIcon size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Monthly task delivery schedule and deadlines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Header Columns */}
      <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-950/60 text-center text-xs font-bold text-neutral-600 dark:text-neutral-400 py-2.5">
        <div>Sun</div>
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
    </div>
  );
};
