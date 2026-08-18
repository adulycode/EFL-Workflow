import React, { useState, useRef } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ChevronDown, Plus, Users, UserPlus, Check } from 'lucide-react';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { InviteMemberModal } from './InviteMemberModal';

export const WorkspaceSwitcher: React.FC = () => {
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useClickOutside(switcherRef, () => setIsOpen(false), isOpen);

  return (
    <>
      <div className="relative" ref={switcherRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all text-left shadow-sm"
        >
          <span className="text-base leading-none">
            {currentWorkspace?.icon || '🏢'}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-neutral-900 dark:text-white leading-none truncate max-w-[130px] sm:max-w-[180px]">
                {currentWorkspace?.name || 'Loading Space...'}
              </span>
              <ChevronDown size={13} className="text-neutral-400" />
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
              <Users size={10} />
              <span>{currentWorkspace?.members?.length || 1} members</span>
            </div>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3.5 py-1.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Workspaces / Spaces
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                <Plus size={12} /> New Space
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto py-1">
              {workspaces.map((ws) => {
                const isActive = currentWorkspace?.id === ws.id;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                      isActive ? 'bg-neutral-100/80 dark:bg-neutral-800/80 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base">{ws.icon || '📁'}</span>
                      <div className="truncate">
                        <div className="text-neutral-900 dark:text-white truncate">
                          {ws.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-normal truncate">
                          {ws.members?.length || 1} members &bull; {ws.boards?.length || 1} board
                        </div>
                      </div>
                    </div>
                    {isActive && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Quick Invite Trigger within active space */}
            <div className="p-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowInviteModal(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/60 transition-colors"
              >
                <UserPlus size={13} /> Invite Members to Space
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />}
      {showInviteModal && <InviteMemberModal onClose={() => setShowInviteModal(false)} />}
    </>
  );
};
