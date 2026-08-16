import React, { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Search, Filter, UserCheck, X, Archive } from 'lucide-react';
import { Priority } from '../../types';
import { ArchivedCardsModal } from './ArchivedCardsModal';

export const BoardFilters: React.FC = () => {
  const { filters, setFilters, labels, archivedCards } = useBoardStore();
  const { currentUser } = useAuthStore();
  const [showArchivedModal, setShowArchivedModal] = useState(false);

  const hasActiveFilters = Boolean(
    filters.searchQuery || filters.selectedLabelId || filters.selectedPriority !== 'ALL' || filters.onlyMyTasks
  );

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      selectedLabelId: null,
      selectedPriority: 'ALL',
      onlyMyTasks: false
    });
  };

  return (
    <>
      <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm border-b border-neutral-200/80 dark:border-neutral-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Search & "My Tasks" Switch */}
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              placeholder="Search tasks, descriptions..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-all"
            />
          </div>

          {/* My Tasks Toggle */}
          <button
            onClick={() => setFilters({ onlyMyTasks: !filters.onlyMyTasks })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filters.onlyMyTasks
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200/60'
            }`}
          >
            <UserCheck size={13} />
            <span>My Tasks</span>
            {currentUser && (
              <span className="text-[10px] opacity-75">
                ({currentUser.name.split(' ')[0]})
              </span>
            )}
          </button>
        </div>

        {/* Label, Priority Filters and Archived Items Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Filter size={13} />
            <span>Filter:</span>
          </div>

          {/* Priority Filter */}
          <select
            value={filters.selectedPriority}
            onChange={(e) => setFilters({ selectedPriority: e.target.value as Priority | 'ALL' })}
            className="text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-200 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Label Filters */}
          <div className="flex items-center gap-1">
            {labels.map((label) => {
              const isSelected = filters.selectedLabelId === label.id;
              return (
                <button
                  key={label.id}
                  onClick={() => setFilters({ selectedLabelId: isSelected ? null : label.id })}
                  style={{
                    backgroundColor: isSelected ? label.colorText : label.colorBg,
                    color: isSelected ? '#ffffff' : label.colorText
                  }}
                  className={`text-[11px] font-medium px-2 py-1 rounded-md transition-all ${
                    isSelected ? 'ring-2 ring-offset-1 ring-neutral-400 shadow-sm' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {label.name}
                </button>
              );
            })}
          </div>

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 ml-1 p-1"
              title="Clear all filters"
            >
              <X size={13} /> Clear
            </button>
          )}

          <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />

          {/* Archived Items Modal Trigger */}
          <button
            onClick={() => setShowArchivedModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 transition-colors border border-neutral-200/80 dark:border-neutral-700"
          >
            <Archive size={13} />
            <span>Archived</span>
            <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.2 rounded-full font-bold">
              {archivedCards.length}
            </span>
          </button>
        </div>
      </div>

      {showArchivedModal && (
        <ArchivedCardsModal onClose={() => setShowArchivedModal(false)} />
      )}
    </>
  );
};
