import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Priority } from '../../types';
import { KanbanCard } from './KanbanCard';
import { useBoardStore } from '../../store/useBoardStore';
import { Plus, MoreHorizontal, X, Edit2, Trash2, Check, Clock, Archive } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';
import { useClickOutside } from '../../hooks/useClickOutside';

interface Props {
  column: Column;
}

const AUTO_ARCHIVE_OPTIONS = [
  { days: 0, label: 'ปิด (Disabled)' },
  { days: 1, label: '1 วัน (1 Day)' },
  { days: 3, label: '3 วัน (3 Days)' },
  { days: 7, label: '7 วัน (7 Days)' },
  { days: 14, label: '14 วัน (14 Days)' },
  { days: 30, label: '30 วัน (30 Days)' }
];

export const KanbanColumn: React.FC<Props> = ({ column }) => {
  const { setNodeRef } = useDroppable({ id: column.id });
  const createCard = useBoardStore((s) => s.createCard);
  const updateColumn = useBoardStore((s) => s.updateColumn);
  const deleteColumn = useBoardStore((s) => s.deleteColumn);

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');

  // Column rename states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showAutoArchiveSubmenu, setShowAutoArchiveSubmenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuContainerRef, () => setShowMenu(false), showMenu);

  useEffect(() => {
    setColumnTitle(column.title);
  }, [column.title]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    if (columnTitle.trim() && columnTitle.trim() !== column.title) {
      await updateColumn(column.id, columnTitle.trim());
    } else {
      setColumnTitle(column.title);
    }
  };

  const handleSetAutoArchive = async (days: number) => {
    setShowMenu(false);
    setShowAutoArchiveSubmenu(false);
    await updateColumn(column.id, { autoArchiveDays: days });
  };

  const handleKeyDownTitle = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setColumnTitle(column.title);
    }
  };

  const handleConfirmDeleteColumn = async () => {
    setShowDeleteConfirm(false);
    await deleteColumn(column.id);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createCard(column.id, title.trim(), priority);
    setTitle('');
    setIsAdding(false);
  };

  const currentAutoArchiveDays = column.autoArchiveDays || 0;

  return (
    <>
      <div
        ref={setNodeRef}
        className="flex flex-col w-80 shrink-0 bg-neutral-100/70 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-3 max-h-full"
      >
        {/* Column Header */}
        <div className="relative flex items-center justify-between px-2 py-1.5 mb-2.5">
          <div className="flex items-center gap-2 flex-1 mr-2 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1 w-full">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={columnTitle}
                  onChange={(e) => setColumnTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={handleKeyDownTitle}
                  className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                />
                <button
                  onMouseDown={handleSaveTitle}
                  className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded"
                >
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename column"
                className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0"
              >
                <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  {column.title}
                </h3>
                <span className="inline-flex items-center justify-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                  {column.cards.length}
                </span>

                {/* Auto Archive Badge */}
                {currentAutoArchiveDays > 0 && (
                  <span
                    title={`การ์ดที่อยู่ในคอลัมน์นี้นานเกิน ${currentAutoArchiveDays} วัน จะถูกเก็บเข้ากรุอัตโนมัติ`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 shrink-0"
                  >
                    <Clock size={10} />
                    <span>{currentAutoArchiveDays}d</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Column Options Button */}
          <div className="relative" ref={menuContainerRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-md transition-colors"
            >
              <MoreHorizontal size={15} />
            </button>

            {/* Options Dropdown */}
            {showMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsEditingTitle(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors"
                >
                  <Edit2 size={13} />
                  <span>Rename Column</span>
                </button>

                {/* Auto-Archive Submenu Trigger */}
                <div className="relative border-t border-neutral-100 dark:border-neutral-800 my-1 pt-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <Archive size={11} className="text-amber-500" />
                    <span>Auto-Archive Threshold</span>
                  </div>
                  
                  <div className="space-y-0.5 px-1.5">
                    {AUTO_ARCHIVE_OPTIONS.map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => handleSetAutoArchive(opt.days)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-medium text-left transition-colors ${
                          currentAutoArchiveDays === opt.days
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {currentAutoArchiveDays === opt.days && <Check size={12} className="text-amber-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Delete Column</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cards Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-2.5 px-0.5 py-1 min-h-[60px]">
          <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {column.cards.map((card) => (
              <KanbanCard key={card.id} card={card} />
            ))}
          </SortableContext>
        </div>

        {/* Quick Add Card Form */}
        {isAdding ? (
          <form onSubmit={handleCreateCard} className="mt-2.5 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <textarea
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter card title..."
              className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="text-[11px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-neutral-700 dark:text-neutral-300"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded"
                >
                  <X size={14} />
                </button>
                <button
                  type="submit"
                  className="text-xs font-semibold px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-90"
                >
                  Add Card
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 py-2 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 transition-colors w-full"
          >
            <Plus size={14} /> Add Card
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        type="danger"
        title="Delete Column"
        message={
          column.cards.length > 0
            ? `Column "${column.title}" contains ${column.cards.length} active card(s). Deleting this column will delete all its cards as well. This cannot be undone.`
            : `Are you sure you want to delete column "${column.title}"?`
        }
        confirmText="Delete Column"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteColumn}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
