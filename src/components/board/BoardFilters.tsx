import React, { useState } from 'react';
import { useBoardStore, DueDateFilterStatus } from '../../store/useBoardStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Priority } from '../../types';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Users, 
  Archive, 
  RotateCcw,
  Tag,
  ChevronDown
} from 'lucide-react';
import { ArchivedCardsModal } from './ArchivedCardsModal';
import { LabelManagerModal } from './LabelManagerModal';

export const BoardFilters: React.FC = () => {
  const { filters, setFilters, resetFilters, labels, archivedCards } = useBoardStore();
  const { users } = useAuthStore();

  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Calculate total active filters count
  let activeFilterCount = 0;
  if (filters.searchQuery) activeFilterCount++;
  if (filters.selectedPriority !== 'ALL') activeFilterCount++;
  if (filters.selectedLabelId) activeFilterCount++;
  if (filters.selectedAssigneeId) activeFilterCount++;
  if (filters.selectedDueDateStatus !== 'ALL') activeFilterCount++;
  if (filters.onlyMyTasks) activeFilterCount++;

  return (
    <>
      <div className="px-6 py-3 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Search & Quick Toggles */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              placeholder="Search cards, tasks, notes..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters({ searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick "My Tasks" toggle */}
          <button
            type="button"
            onClick={() => setFilters({ onlyMyTasks: !filters.onlyMyTasks })}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              filters.onlyMyTasks
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            My Tasks
          </button>

          {/* Filter Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              activeFilterCount > 0 || isFilterDrawerOpen
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <Filter size={13} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1"
            >
              <RotateCcw size={12} /> Clear
            </button>
          )}
        </div>

        {/* Right Tools: Archived Items */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowArchivedModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-sm"
          >
            <Archive size={13} className="text-amber-600 dark:text-amber-400" />
            <span>Archived ({archivedCards.length})</span>
          </button>
        </div>
      </div>

      {/* Expandable Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/60 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Filter by Assignee */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-neutral-500 flex items-center gap-1">
              <Users size={12} /> Assignee:
            </span>
            <select
              value={filters.selectedAssigneeId || ''}
              onChange={(e) => setFilters({ selectedAssigneeId: e.target.value || null })}
              className="text-xs px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="">All Assignees</option>
              {users
                .filter((u) => u.isActive !== false || filters.selectedAssigneeId === u.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.isActive === false ? '(Inactive)' : ''}
                  </option>
                ))}
            </select>
          </div>

          {/* Filter by Due Date */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-neutral-500 flex items-center gap-1">
              <Calendar size={12} /> Due Date:
            </span>
            <select
              value={filters.selectedDueDateStatus}
              onChange={(e) => setFilters({ selectedDueDateStatus: e.target.value as DueDateFilterStatus })}
              className="text-xs px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="ALL">All Dates</option>
              <option value="OVERDUE">Overdue (เลยกำหนด)</option>
              <option value="TODAY">Due Today</option>
              <option value="THIS_WEEK">Due This Week</option>
              <option value="NO_DATE">No Due Date</option>
            </select>
          </div>

          {/* Filter by Priority */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-neutral-500">Priority:</span>
            <div className="flex items-center gap-1">
              {(['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilters({ selectedPriority: p })}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                    filters.selectedPriority === p
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Filter by Label */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-neutral-500 flex items-center gap-1">
              <Tag size={12} /> Label:
            </span>
            <select
              value={filters.selectedLabelId || ''}
              onChange={(e) => setFilters({ selectedLabelId: e.target.value || null })}
              className="text-xs px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="">All Labels</option>
              {labels.map((lbl) => (
                <option key={lbl.id} value={lbl.id}>
                  {lbl.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Archived Cards Modal */}
      {showArchivedModal && (
        <ArchivedCardsModal onClose={() => setShowArchivedModal(false)} />
      )}

      {/* Label Manager Modal */}
      <LabelManagerModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
      />
    </>
  );
};
