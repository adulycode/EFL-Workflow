import React, { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { X, Archive, RotateCcw, Trash2, Search, Calendar, Tag, Layers } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  onClose: () => void;
}

export const ArchivedCardsModal: React.FC<Props> = ({ onClose }) => {
  const { archivedCards, restoreCard, deleteCard, setSelectedCardId } = useBoardStore();
  const [search, setSearch] = useState('');

  const filtered = archivedCards.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-xl max-h-[85vh] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <Archive size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Archived Tasks (คลังเก็บการ์ดงาน)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Tasks that were archived from the board ({archivedCards.length} items)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search archived tasks..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            />
          </div>
        </div>

        {/* Card List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <Archive size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold">No archived tasks found</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Archived cards will appear here and can be restored anytime.
              </p>
            </div>
          ) : (
            filtered.map((card) => (
              <div
                key={card.id}
                className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
                      <Layers size={10} /> {card.column?.title || 'Board'}
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {card.priority}
                    </span>
                  </div>

                  <h4
                    onClick={() => {
                      onClose();
                      setSelectedCardId(card.id);
                    }}
                    className="text-xs font-bold text-neutral-900 dark:text-white hover:underline cursor-pointer"
                  >
                    {card.title}
                  </h4>

                  {card.description && (
                    <p className="text-[11px] text-neutral-500 line-clamp-1">
                      {card.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => restoreCard(card.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <RotateCcw size={13} />
                    <span>Send to Board</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${card.title}" permanently?`)) {
                        deleteCard(card.id);
                      }
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Permanently"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
