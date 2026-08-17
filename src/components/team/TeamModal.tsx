import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { X, Users, ShieldCheck, UserCheck } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const TeamModal: React.FC<Props> = ({ onClose }) => {
  const { users, currentUser, setCurrentUser } = useAuthStore();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                EFL Organization Team Directory
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {users.length} active team members with Role-Based Access Control (RBAC)
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

        {/* Members Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {users.map((user) => {
            const isMe = user.id === currentUser?.id;
            return (
              <div
                key={user.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isMe
                    ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  <img
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700"
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate flex items-center gap-1.5">
                      <span>{user.name}</span>
                      {isMe && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded">You</span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                      user.role === 'ADMIN'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {user.role === 'ADMIN' ? <ShieldCheck size={10} /> : <UserCheck size={10} />}
                    {user.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
