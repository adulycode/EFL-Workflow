import React, { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { Card, Column, Priority } from '../../types';
import { 
  Plus, Calendar, CheckSquare, Clock, User, Tag, 
  ChevronDown, ArrowUpDown, Filter, Sparkles, MoreHorizontal,
  Trash2, Archive, MessageSquare, Paperclip, Check
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
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

  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardColumnId, setNewCardColumnId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [sortField, setSortField] = useState<'title' | 'priority' | 'dueDate' | 'column'>('column');
  const [sortAsc, setSortAsc] = useState(true);
  const [cardToArchive, setCardToArchive] = useState<{ id: string; title: string } | null>(null);

  if (!board) return null;

  const columns = board.columns || [];
  const defaultColId = columns[0]?.id || '';

  // Flatten cards from all columns
  let allCards: (Card & { columnTitle: string; columnId: string })[] = [];
  columns.forEach(col => {
    (col.cards || []).forEach(card => {
      if (!card.isArchived) {
        allCards.push({
          ...card,
          columnTitle: col.title,
          columnId: col.id
        });
      }
    });
  });

  // Apply filters
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    allCards = allCards.filter(c => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
  }
  if (filters.selectedPriority !== 'ALL') {
    allCards = allCards.filter(c => c.priority === filters.selectedPriority);
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
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">🟠 High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">🟢 Normal</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">⚪ Low</span>;
    }
  };

  // Calculate totals
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

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 overflow-hidden">
      {/* Table Action Bar */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-500" />
            <span>Notion Database View</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {totalCards} การ์ด
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>New Row</span>
        </button>
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
