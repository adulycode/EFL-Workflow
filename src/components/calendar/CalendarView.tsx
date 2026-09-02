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
  Clock
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState(true);
  const [unscheduledSearch, setUnscheduledSearch] = useState('');
  const [dragOverDayIso, setDragOverDayIso] = useState<string | null>(null);
  const [isDragOverUnscheduled, setIsDragOverUnscheduled] = useState(false);

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

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

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

  return (
    <div className="flex h-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden animate-in fade-in duration-150">
      
      {/* Main Calendar View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Calendar Top Navigation Header */}
        <div className="px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                ตารางส่งงานและกำหนดส่งประจำเดือน (ลากการ์ดเพื่อตั้งวันที่ได้)
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

            {/* Toggle Unscheduled Drawer Button */}
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
          </div>
        </div>

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
      </div>

      {/* Unscheduled Cards Drawer Sidebar */}
      {showUnscheduledDrawer && (
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
