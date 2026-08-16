import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useBoardStore } from '../../store/useBoardStore';
import { 
  Kanban, 
  Users, 
  Bell, 
  Moon, 
  Sun, 
  ChevronDown, 
  ShieldCheck, 
  UserCheck, 
  RefreshCw 
} from 'lucide-react';
import { NotificationModal } from '../notifications/NotificationModal';
import { TeamModal } from '../team/TeamModal';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';

export const BoardHeader: React.FC = () => {
  const { currentUser, users, setCurrentUser, isDarkMode, toggleDarkMode } = useAuthStore();
  const { board, fetchBoard, isLoading } = useBoardStore();

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <>
      <header className="h-16 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-6 flex items-center justify-between z-20 shrink-0">
        {/* Left Side: Brand + Workspace Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-sm shrink-0">
              <Kanban size={18} strokeWidth={2.2} />
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                  EFL-Workflow
                </h1>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  Live
                </span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

          {/* Workspace / Space Selector */}
          <WorkspaceSwitcher />

          {/* Refresh Board Button */}
          <button
            onClick={() => fetchBoard()}
            disabled={isLoading}
            title="Refresh Board"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Team Members Button */}
          <button
            onClick={() => setShowTeamModal(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/60 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Users size={14} />
            <span>Org Team (20)</span>
          </button>

          {/* Notifications Log Trigger */}
          <button
            onClick={() => setShowNotificationModal(true)}
            title="Notification Alerts & Logs"
            className="p-2 text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/60 rounded-lg transition-colors relative"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
          </button>

          {/* Dark Mode Switcher */}
          <button
            onClick={toggleDarkMode}
            title="Toggle theme"
            className="p-2 text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/60 rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Active User Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all text-left"
            >
              <img
                src={currentUser?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}`}
                alt={currentUser?.name}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-neutral-900 dark:text-white leading-none">
                  {currentUser?.name?.split(' ')[0] || 'User'}
                </div>
                <div className="text-[10px] text-neutral-400 leading-none mt-0.5 flex items-center gap-1">
                  {currentUser?.role === 'ADMIN' ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-medium">
                      <ShieldCheck size={10} /> Admin
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <UserCheck size={10} /> Member
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown size={14} className="text-neutral-400 ml-1" />
            </button>

            {/* User Dropdown */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-2 z-50">
                <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Switch Active User (Team Simulation)
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                        currentUser?.id === u.id ? 'bg-neutral-50 dark:bg-neutral-800/80 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img
                          src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <span className="truncate text-neutral-800 dark:text-neutral-200">
                          {u.name}
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded text-neutral-400 font-medium shrink-0 ml-2">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showNotificationModal && (
        <NotificationModal onClose={() => setShowNotificationModal(false)} />
      )}
      {showTeamModal && (
        <TeamModal onClose={() => setShowTeamModal(false)} />
      )}
    </>
  );
};
