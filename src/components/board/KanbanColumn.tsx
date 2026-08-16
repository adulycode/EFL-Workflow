import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Priority } from '../../types';
import { KanbanCard } from './KanbanCard';
import { useBoardStore } from '../../store/useBoardStore';
import { Plus, MoreHorizontal, X } from 'lucide-react';

interface Props {
  column: Column;
}

export const KanbanColumn: React.FC<Props> = ({ column }) => {
  const { setNodeRef } = useDroppable({ id: column.id });
  const createCard = useBoardStore((s) => s.createCard);

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createCard(column.id, title.trim(), priority);
    setTitle('');
    setIsAdding(false);
  };

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-80 shrink-0 bg-neutral-100/70 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-3 max-h-full"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
            {column.title}
          </h3>
          <span className="inline-flex items-center justify-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            {column.cards.length}
          </span>
        </div>
        <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-md transition-colors">
          <MoreHorizontal size={15} />
        </button>
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
        <form onSubmit={handleCreate} className="mt-2.5 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
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
  );
};
