import React, { useState, useRef } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import { 
  Columns, 
  Users, 
  Settings, 
  ChevronDown, 
  LayoutGrid, 
  Calendar as CalendarIcon,
  Table as TableIcon,
  Download,
  Tag,
  ExternalLink,
  LogOut,
  Shield,
  Palette
} from 'lucide-react';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { UserSettingsModal } from '../settings/UserSettingsModal';
import { LabelManagerModal } from './LabelManagerModal';
import { BoardSettingsModal } from './BoardSettingsModal';
import { format } from 'date-fns';

export const BoardHeader: React.FC = () => {
  const { board, viewMode, setViewMode } = useBoardStore();
  const { currentUser, setCurrentUser, users } = useAuthStore();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showBoardSettingsModal, setShowBoardSettingsModal] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(userDropdownRef, () => setShowUserDropdown(false), showUserDropdown);

  // Export Board Data to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (!board) return;

    const headers = [
      'Card ID',
      'Title',
      'Column / Status',
      'Priority',
      'Due Date',
      'Assignees',
      'Labels',
      'Checklists Progress',
      'Attachments Count',
      'Comments Count',
      'Created At'
    ];

    const rows: string[][] = [];

    board.columns.forEach((col) => {
      col.cards.forEach((card) => {
        const assignees = card.assignees?.map((a) => a.user.name).join('; ') || 'Unassigned';
        const labels = card.labels?.map((l) => l.label.name).join('; ') || 'None';
        
        const allItems = card.checklists?.flatMap((c) => c.items) || [];
        const completed = allItems.filter((i) => i.isCompleted).length;
        const total = allItems.length;
        const checklistStr = total > 0 ? `${completed}/${total} (${Math.round((completed / total) * 100)}%)` : 'None';

        const dueDateStr = card.dueDate ? format(new Date(card.dueDate), 'yyyy-MM-dd') : 'No Due Date';

        rows.push([
          `"${card.id}"`,
          `"${(card.title || '').replace(/"/g, '""')}"`,
          `"${col.title}"`,
          `"${card.priority}"`,
          `"${dueDateStr}"`,
          `"${assignees.replace(/"/g, '""')}"`,
          `"${labels.replace(/"/g, '""')}"`,
          `"${checklistStr}"`,
          `"${card.attachments?.length || 0}"`,
          `"${card._count?.comments || 0}"`,
          `"${format(new Date(card.createdAt || Date.now()), 'yyyy-MM-dd HH:mm')}"`
        ]);
      });
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${board.title.replace(/\s+/g, '_')}_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left Section: Workspace Switcher & Board Title */}
        <div className="flex items-center gap-4">
          <WorkspaceSwitcher />

          <div className="h-4 w-[1px] bg-neutral-200 dark:border-neutral-800" />

          <div>
            <h1 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-base">{board?.icon || '📋'}</span>
              <span>{board?.title || 'Loading Board...'}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                Workspace Board
              </span>
            </h1>
            <p className="text-[11px] text-neutral-400">
              Collaborative Kanban & Planning • EFL Workflow
            </p>
          </div>
        </div>

        {/* Center: View Mode Switcher (Board, Table, Calendar, Overview) */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200/80 dark:border-neutral-700">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'board'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Columns size={14} />
            <span>บอร์ด Kanban</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <TableIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>ตาราง (Table)</span>
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <CalendarIcon size={14} />
            <span>ปฏิทินงาน (Calendar)</span>
          </button>

          <button
            onClick={() => setViewMode('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'overview'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <LayoutGrid size={14} />
            <span>ภาพรวม Spaces</span>
          </button>
        </div>

        {/* Right Section: Tools & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Board Settings & Themes Button */}
          <button
            onClick={() => setShowBoardSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 rounded-xl transition-all border border-emerald-200 dark:border-emerald-800/80 shadow-xs"
            title="ตั้งค่าและปรับแต่งธีมบอร์ด (Board Settings & Themes)"
          >
            <Palette size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">ปรับแต่งบอร์ด</span>
          </button>

          {/* Settings Suite Button */}
          <button
            onClick={() => useAuthStore.getState().openSettings()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-200/80 dark:border-neutral-800 shadow-sm"
            title="Workspace & System Settings"
          >
            <Settings size={14} className="text-slate-600 dark:text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Export to CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-200/80 dark:border-neutral-800 shadow-sm"
            title="Export board data to CSV / Excel"
          >
            <Download size={13} className="text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* User Account Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-neutral-200/60 dark:border-neutral-800"
            >
              <img
                src={currentUser?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}`}
                alt={currentUser?.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                  {currentUser?.name.split(' ')[0]}
                </p>
                <p className="text-[10px] text-neutral-400 font-medium">
                  {currentUser?.role}
                </p>
              </div>
              <ChevronDown size={14} className="text-neutral-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    {currentUser?.name}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {currentUser?.email}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      useAuthStore.getState().openSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Settings size={14} className="text-emerald-500" />
                    <span>{currentUser?.role === 'ADMIN' ? 'Workspace & System Settings' : 'My Profile & Preferences'}</span>
                  </button>

                  <a
                    href="http://localhost:3050"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">🔑</span>
                      <span>EFL Central SSO Portal</span>
                    </div>
                    <ExternalLink size={12} className="opacity-70" />
                  </a>
                </div>

                {/* Real SSO Account Info & Logout */}
                <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-400">สิทธิ์การใช้งาน (Role):</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {currentUser?.role || 'STAFF'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      useAuthStore.getState().logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors"
                  >
                    <LogOut size={13} />
                    <span>ออกจากระบบ (Sign Out)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Label Manager Modal */}
      <LabelManagerModal
        isOpen={showLabelManager}
        onClose={() => setShowLabelManager(false)}
      />

      {/* Board Settings & Customization Modal */}
      <BoardSettingsModal
        isOpen={showBoardSettingsModal}
        onClose={() => setShowBoardSettingsModal(false)}
      />
    </>
  );
};
