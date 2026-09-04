import React, { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, Column, Priority } from '../../types';
import { 
  Plus, Calendar, CheckSquare, Clock, User, Tag, 
  ChevronDown, ArrowUpDown, Filter, Sparkles, MoreHorizontal,
  Trash2, Archive, MessageSquare, Paperclip, Check,
  Eye, EyeOff, AlertTriangle, Flame, UserX, RotateCcw
} from 'lucide-react';
import { format, isPast, isToday, isThisWeek } from 'date-fns';
import { th } from 'date-fns/locale';
import { ConfirmModal } from '../common/ConfirmModal';

export const TableView: React.FC = () => {
  const { 
    board, 
    createCard, 
    updateCard, 
    deleteCard, 
    archiveCard, 
    setSelectedCardId,
    filters 
  } = useBoardStore();
  const { currentUser } = useAuthStore();

  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardColumnId, setNewCardColumnId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [sortField, setSortField] = useState<'title' | 'priority' | 'dueDate' | 'column'>('column');
  const [sortAsc, setSortAsc] = useState(true);
  const [cardToArchive, setCardToArchive] = useState<{ id: string; title: string } | null>(null);

  // In-Table Quick Filter States
  const [selectedColumnFilter, setSelectedColumnFilter] = useState<string>('ALL');
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  const [quickChipFilter, setQuickChipFilter] = useState<'ALL' | 'OVERDUE' | 'URGENT_HIGH' | 'UNASSIGNED'>('ALL');

  if (!board) return null;

  const columns = board.columns || [];
  const defaultColId = columns[0]?.id || '';

  // Flatten raw active cards from all columns
  const rawCards = columns.flatMap(col => 
    (col.cards || []).filter(c => !c.isArchived).map(card => ({
      ...card,
      columnTitle: col.title,
      columnId: col.id
    }))
  );

  const totalRawCount = rawCards.length;
  const overdueCount = rawCards.filter(c => c.dueDate && isPast(new Date(c.dueDate)) && !/done|complete|เสร็จ/i.test(c.columnTitle)).length;
  const urgentHighCount = rawCards.filter(c => c.priority === 'URGENT' || c.priority === 'HIGH').length;
  const unassignedCount = rawCards.filter(c => !c.assignees || c.assignees.length === 0).length;

  let allCards = [...rawCards];

  // 1. Search Query (Top Filter Bar)
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    allCards = allCards.filter(c => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
  }

  // 2. Selected Priority (Top Filter Bar)
  if (filters.selectedPriority !== 'ALL') {
    allCards = allCards.filter(c => c.priority === filters.selectedPriority);
  }

  // 3. Selected Label (Top Filter Bar)
  if (filters.selectedLabelId) {
    allCards = allCards.filter(c => c.labels?.some(l => l.labelId === filters.selectedLabelId));
  }

  // 4. Selected Assignee (Top Filter Bar)
  if (filters.selectedAssigneeId) {
    allCards = allCards.filter(c => c.assignees?.some(a => a.userId === filters.selectedAssigneeId));
  }

  // 5. Due Date Status (Top Filter Bar)
  if (filters.selectedDueDateStatus !== 'ALL') {
    if (filters.selectedDueDateStatus === 'NO_DATE') {
      allCards = allCards.filter(c => !c.dueDate);
    } else {
      allCards = allCards.filter(c => {
        if (!c.dueDate) return false;
        const date = new Date(c.dueDate);
        if (filters.selectedDueDateStatus === 'OVERDUE') return isPast(date) && !/done|complete|เสร็จ/i.test(c.columnTitle);
        if (filters.selectedDueDateStatus === 'TODAY') return isToday(date);
        if (filters.selectedDueDateStatus === 'THIS_WEEK') return isThisWeek(date);
        return true;
      });
    }
  }

  // 6. Only My Tasks (Top Filter Bar)
  if (filters.onlyMyTasks && currentUser) {
    allCards = allCards.filter(c => c.assignees?.some(a => a.userId === currentUser.id));
  }

  // 7. Table In-Line Filter: Hide Completed
  if (hideCompleted) {
    allCards = allCards.filter(c => !/done|complete|เสร็จ/i.test(c.columnTitle));
  }

  // 8. Table In-Line Filter: Column / Status Tabs
  if (selectedColumnFilter !== 'ALL') {
    allCards = allCards.filter(c => c.columnId === selectedColumnFilter);
  }

  // 9. Table In-Line Filter: Quick Chips
  if (quickChipFilter === 'OVERDUE') {
    allCards = allCards.filter(c => c.dueDate && isPast(new Date(c.dueDate)) && !/done|complete|เสร็จ/i.test(c.columnTitle));
  } else if (quickChipFilter === 'URGENT_HIGH') {
    allCards = allCards.filter(c => c.priority === 'URGENT' || c.priority === 'HIGH');
  } else if (quickChipFilter === 'UNASSIGNED') {
    allCards = allCards.filter(c => !c.assignees || c.assignees.length === 0);
  }

  // Apply Sorting
  allCards.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortField === 'column') cmp = a.columnTitle.localeCompare(b.columnTitle);
    else if (sortField === 'dueDate') {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      cmp = dateA - dateB;
    } else if (sortField === 'priority') {
      const pOrder: Record<Priority, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      cmp = (pOrder[a.priority] || 0) - (pOrder[b.priority] || 0);
    }
    return sortAsc ? cmp : -cmp;
  });

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    const targetCol = newCardColumnId || defaultColId;
    if (!targetCol) return;

    await createCard(targetCol, newCardTitle.trim());
    setNewCardTitle('');
    setIsAdding(false);
  };

  const handleStatusChange = async (cardId: string, destColId: string) => {
    const card = allCards.find(c => c.id === cardId);
    if (!card || card.columnId === destColId) return;
    await updateCard(cardId, { columnId: destColId });
  };

  const handlePriorityChange = async (cardId: string, newPriority: Priority) => {
    await updateCard(cardId, { priority: newPriority });
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">🔴 Urgent</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">🟠 High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">🟢 Normal</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">⚪ Low</span>;
    }
  };

  const totalCards = allCards.length;
  let completedChecklistItems = 0;
  let totalChecklistItems = 0;
  allCards.forEach(c => {
    c.checklists?.forEach(cl => {
      cl.items?.forEach(item => {
        totalChecklistItems++;
        if (item.isCompleted) completedChecklistItems++;
      });
    });
  });

  const isAnyFilterActive = selectedColumnFilter !== 'ALL' || hideCompleted || quickChipFilter !== 'ALL';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 overflow-hidden">
      {/* Table Action & Notion Status Chips Bar */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Status / Column Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedColumnFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              selectedColumnFilter === 'ALL'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
            }`}
          >
            <span>ทั้งหมด</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedColumnFilter === 'ALL' ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'bg-neutral-200 dark:bg-neutral-800'}`}>
              {totalRawCount}
            </span>
          </button>

          {columns.map(col => {
            const isSelected = selectedColumnFilter === col.id;
            const count = rawCards.filter(c => c.columnId === col.id).length;

            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setSelectedColumnFilter(col.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{col.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-neutral-200 dark:bg-neutral-800'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Quick Toggles & Add Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hide Completed Toggle */}
          <button
            type="button"
            onClick={() => setHideCompleted(!hideCompleted)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl border transition-all shrink-0 ${
              hideCompleted
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 shadow-xs'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="ซ่อนงานในคอลัมน์ Completed หรือ Done"
          >
            {hideCompleted ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{hideCompleted ? 'ซ่อนงานเสร็จแล้ว' : 'แสดงทุกงาน'}</span>
          </button>

          {/* Quick Overdue Chip */}
          {overdueCount > 0 && (
            <button
              type="button"
              onClick={() => setQuickChipFilter(quickChipFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl border transition-all shrink-0 ${
                quickChipFilter === 'OVERDUE'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle size={12} />
              <span>เลยกำหนด ({overdueCount})</span>
            </button>
          )}

          {/* Quick Urgent/High Chip */}
          {urgentHighCount > 0 && (
            <button
              type="button"
              onClick={() => setQuickChipFilter(quickChipFilter === 'URGENT_HIGH' ? 'ALL' : 'URGENT_HIGH')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl border transition-all shrink-0 ${
                quickChipFilter === 'URGENT_HIGH'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100'
              }`}
            >
              <Flame size={12} />
              <span>ด่วนมาก ({urgentHighCount})</span>
            </button>
          )}

          {/* Quick Unassigned Chip */}
          {unassignedCount > 0 && (
            <button
              type="button"
              onClick={() => setQuickChipFilter(quickChipFilter === 'UNASSIGNED' ? 'ALL' : 'UNASSIGNED')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl border transition-all shrink-0 ${
                quickChipFilter === 'UNASSIGNED'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/60 hover:bg-purple-100'
              }`}
            >
              <UserX size={12} />
              <span>รอผู้รับผิดชอบ ({unassignedCount})</span>
            </button>
          )}

          {/* Reset Quick Filters if active */}
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={() => {
                setSelectedColumnFilter('ALL');
                setHideCompleted(false);
                setQuickChipFilter('ALL');
              }}
              className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1 px-1.5 py-1 shrink-0"
            >
              <RotateCcw size={12} /> ล้างตาราง
            </button>
          )}

          {/* New Row Button */}
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 ml-1"
          >
            <Plus size={14} />
            <span>New Row</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Table Header */}
          <thead className="bg-slate-100/80 dark:bg-slate-900/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
            <tr className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleSort('title')}
              >
                <div className="flex items-center gap-1.5">
                  <span>📌 Task Title / ชื่องาน</span>
                  <ArrowUpDown size={12} className="opacity-60" />
                </div>
              </th>
              <th 
                className="py-3 px-4 w-40 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleSort('column')}
              >
                <div className="flex items-center gap-1.5">
                  <span>🚦 Status / สถานะ</span>
                  <ArrowUpDown size={12} className="opacity-60" />
                </div>
              </th>
              <th 
                className="py-3 px-4 w-32 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleSort('priority')}
              >
                <div className="flex items-center gap-1.5">
                  <span>🔴 Priority</span>
                  <ArrowUpDown size={12} className="opacity-60" />
                </div>
              </th>
              <th 
                className="py-3 px-4 w-40 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleSort('dueDate')}
              >
                <div className="flex items-center gap-1.5">
                  <span>📅 Due Date</span>
                  <ArrowUpDown size={12} className="opacity-60" />
                </div>
              </th>
              <th className="py-3 px-4 w-44">👤 Assignees</th>
              <th className="py-3 px-4 w-44">🏷️ Labels</th>
              <th className="py-3 px-4 w-36">✅ Checklist</th>
              <th className="py-3 px-4 w-20 text-center">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {allCards.map((card, index) => {
              const hasDueDate = !!card.dueDate;
              const dateObj = hasDueDate ? new Date(card.dueDate!) : null;
              const isOverdue = dateObj && isPast(dateObj) && !isToday(dateObj);
              const isDueToday = dateObj && isToday(dateObj);

              // Checklist count
              let clTotal = 0;
              let clDone = 0;
              card.checklists?.forEach(cl => {
                cl.items?.forEach(i => {
                  clTotal++;
                  if (i.isCompleted) clDone++;
                });
              });
              const progressPct = clTotal > 0 ? Math.round((clDone / clTotal) * 100) : 0;

              return (
                <tr 
                  key={card.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors group"
                >
                  {/* Row Number */}
                  <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-400">
                    {index + 1}
                  </td>

                  {/* Title & Emoji Icon */}
                  <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none select-none">{card.icon || '📝'}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCardId(card.id)}
                        className="text-left font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1"
                      >
                        {card.title}
                      </button>
                      
                      {/* Meta badges */}
                      {card._count && (card._count.comments > 0 || card._count.attachments > 0) && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 ml-1">
                          {card._count.comments > 0 && (
                            <span className="flex items-center gap-0.5">
                              <MessageSquare size={10} /> {card._count.comments}
                            </span>
                          )}
                          {card._count.attachments > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Paperclip size={10} /> {card._count.attachments}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status / Column Selector */}
                  <td className="py-2.5 px-4">
                    <select
                      value={card.columnId}
                      onChange={(e) => handleStatusChange(card.id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {columns.map(col => (
                        <option key={col.id} value={col.id}>
                          {col.title}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Priority Selector */}
                  <td className="py-2.5 px-4">
                    <select
                      value={card.priority}
                      onChange={(e) => handlePriorityChange(card.id, e.target.value as Priority)}
                      className="px-2 py-1 rounded-lg text-xs font-bold bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="URGENT">🔴 Urgent</option>
                      <option value="HIGH">🟠 High</option>
                      <option value="MEDIUM">🟢 Normal</option>
                      <option value="LOW">⚪ Low</option>
                    </select>
                  </td>

                  {/* Due Date */}
                  <td className="py-2.5 px-4">
                    {hasDueDate && dateObj ? (
                      <span className={`inline-flex items-center gap-1 font-medium text-[11px] ${
                        isOverdue ? 'text-rose-600 font-bold' : isDueToday ? 'text-amber-600 font-bold' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        <Clock size={12} />
                        {format(dateObj, 'd MMM yyyy', { locale: th })}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>

                  {/* Assignees */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1 overflow-hidden">
                      {card.assignees && card.assignees.length > 0 ? (
                        card.assignees.map(a => (
                          <div
                            key={a.user.id}
                            title={a.user.name}
                            className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold"
                          >
                            {a.user.avatarUrl ? (
                              <img src={a.user.avatarUrl} alt={a.user.name} className="w-full h-full object-cover" />
                            ) : (
                              a.user.name.charAt(0)
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </div>
                  </td>

                  {/* Labels */}
                  <td className="py-2.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {card.labels && card.labels.length > 0 ? (
                        card.labels.map(l => (
                          <span
                            key={l.label.id}
                            style={{ backgroundColor: l.label.colorBg, color: l.label.colorText }}
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            {l.label.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </div>
                  </td>

                  {/* Checklist */}
                  <td className="py-2.5 px-4">
                    {clTotal > 0 ? (
                      <div className="w-28 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{clDone}/{clTotal}</span>
                          <span className="font-bold">{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${progressPct}%` }}
                            className={`h-full transition-all ${progressPct === 100 ? 'bg-emerald-500' : 'bg-emerald-600'}`}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setCardToArchive({ id: card.id, title: card.title })}
                      title="Archive Card"
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      <Archive size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Empty Filter State */}
            {allCards.length === 0 && !isAdding && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter size={24} className="opacity-40 text-slate-400" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      ไม่พบการ์ดงานที่ตรงกับเงื่อนไขตัวกรอง
                    </p>
                    <p className="text-[11px] text-slate-400">
                      ลองเปลี่ยนตัวกรอง หรือกดปุ่มด้านล่างเพื่อล้างตัวกรองและดูงานทั้งหมด
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedColumnFilter('ALL');
                        setHideCompleted(false);
                        setQuickChipFilter('ALL');
                        useBoardStore.getState().resetFilters();
                      }}
                      className="mt-1 px-3 py-1.5 text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Quick Add Row */}
            {isAdding ? (
              <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                <td className="py-2.5 px-4 text-center font-bold text-emerald-600 text-xs">+</td>
                <td className="py-2 px-4" colSpan={8}>
                  <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="พิมพ์ชื่องานใหม่ แล้วกด Enter เพื่อสร้าง..."
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-emerald-400 focus:outline-none text-slate-900 dark:text-slate-100 font-medium"
                    />
                    <select
                      value={newCardColumnId || defaultColId}
                      onChange={(e) => setNewCardColumnId(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      {columns.map(col => (
                        <option key={col.id} value={col.id}>{col.title}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </form>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={9} className="p-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>+ New Card (เพิ่มการ์ดแถวใหม่)</span>
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary Bar */}
      <div className="px-6 py-2.5 bg-slate-100/90 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <span>รวมทั้งหมด: <strong className="text-slate-800 dark:text-slate-200">{totalCards}</strong> รายการ</span>
          {totalChecklistItems > 0 && (
            <span>Checklist เสร็จสิ้น: <strong className="text-emerald-600">{completedChecklistItems}/{totalChecklistItems}</strong> ({Math.round((completedChecklistItems / totalChecklistItems) * 100)}%)</span>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          💡 คลิกที่หัวคอลัมน์เพื่อเรียงลำดับ (Sort) หรือคลิกที่ชื่อการ์ดเพื่อเปิดดูรายละเอียด
        </div>
      </div>

      {/* Confirm Archive Modal */}
      <ConfirmModal
        isOpen={cardToArchive !== null}
        onCancel={() => setCardToArchive(null)}
        onConfirm={async () => {
          if (cardToArchive) {
            await archiveCard(cardToArchive.id);
            setCardToArchive(null);
          }
        }}
        title="ยืนยันการเก็บการ์ดเข้ากรุ (Archive Card)"
        message={`คุณแน่ใจหรือไม่ว่าต้องการเก็บการ์ด "${cardToArchive?.title}" เข้ากรุ? การ์ดจะถูกซ่อนจากมุมมองหลัก แต่คุณสามารถเรียกดูและกู้คืน (Restore) ได้ตลอดเวลา`}
        confirmText="เก็บเข้ากรุ (Archive)"
        cancelText="ยกเลิก"
        type="warning"
      />
    </div>
  );
};
