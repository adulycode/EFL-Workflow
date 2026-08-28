import React, { useState, useRef } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ChevronDown, Plus, Users, UserPlus, Check, Sparkles } from 'lucide-react';
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
      <div className="flex items-center gap-2" ref={switcherRef}>
        {/* Main Board / Workspace Selector Button */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-800/90 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all text-left shadow-xs group"
          >
            <span className="text-xl leading-none select-none">
              {currentWorkspace?.icon || '🏢'}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-neutral-900 dark:text-white leading-none truncate max-w-[150px] sm:max-w-[220px]">
                  {currentWorkspace?.name || 'Loading Space...'}
                </span>
                <ChevronDown size={14} className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-transform" />
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5 font-medium">
                <Users size={10} className="text-emerald-500" />
                <span>{currentWorkspace?.members?.length || 1} สมาชิก</span>
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  บอร์ดและพื้นที่ทำงาน (Boards & Spaces)
                </span>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateModal(true);
                  }}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>สร้างบอร์ดใหม่</span>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {workspaces.map((ws) => {
                  const isActive = currentWorkspace?.id === ws.id;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setCurrentWorkspace(ws);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors ${
                        isActive ? 'bg-emerald-50/60 dark:bg-emerald-950/40 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="text-lg shrink-0">{ws.icon || '🏢'}</span>
                        <div className="truncate">
                          <div className="text-neutral-900 dark:text-white truncate text-xs font-bold">
                            {ws.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-normal truncate">
                            {ws.members?.length || 1} สมาชิก
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
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors"
                >
                  <UserPlus size={13} />
                  <span>เชิญสมาชิกเข้าบอร์ดนี้</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Invite Button */}
        <button
          onClick={() => setShowInviteModal(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-xs transition-colors"
          title="เชิญสมาชิกเข้าร่วมบอร์ด"
        >
          <UserPlus size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span>Invite</span>
        </button>
      </div>

      {showCreateModal && <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />}
      {showInviteModal && <InviteMemberModal onClose={() => setShowInviteModal(false)} />}
    </>
  );
};
