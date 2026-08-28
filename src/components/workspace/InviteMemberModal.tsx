import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { X, UserPlus, ShieldCheck, UserCheck, Trash2, Check } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const InviteMemberModal: React.FC<Props> = ({ onClose }) => {
  const { currentWorkspace, inviteMember, removeMember } = useWorkspaceStore();
  const { users, currentUser } = useAuthStore();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!currentWorkspace) return null;

  const currentMemberUserIds = currentWorkspace.members.map((m) => m.userId);
  const nonMembers = users.filter((u) => u.isActive !== false && !currentMemberUserIds.includes(u.id));

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsSubmitting(true);
    const ok = await inviteMember(currentWorkspace.id, selectedUserId, selectedRole);
    setIsSubmitting(false);

    if (ok) {
      setSelectedUserId('');
      setSuccessMessage('เพิ่มสมาชิกเข้า Workspace เรียบร้อยแล้ว!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleRemove = async (userId: string) => {
    await removeMember(currentWorkspace.id, userId);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <UserPlus size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Workspace Members & Invitations
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Manage access for <span className="font-semibold text-neutral-700 dark:text-neutral-200">{currentWorkspace.name}</span>
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

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Invite Form */}
          <form onSubmit={handleInvite} className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Invite Team Member
            </h3>

            {successMessage && (
              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                <Check size={13} /> {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-800 dark:text-neutral-200 focus:outline-none"
                >
                  <option value="">Select team member ({nonMembers.length} available)</option>
                  {nonMembers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-800 dark:text-neutral-200 focus:outline-none"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedUserId}
              className="w-full text-xs font-semibold py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <UserPlus size={14} /> Send Invitation / Add
            </button>
          </form>

          {/* Current Members List */}
          <div>
            <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-3">
              Current Space Members ({currentWorkspace.members?.length || 0})
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {currentWorkspace.members?.map((m) => {
                const isOwner = currentWorkspace.ownerId === m.userId;
                return (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <img
                        src={m.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user.name)}`}
                        alt={m.user.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {m.user.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          {m.user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                          isOwner
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400'
                            : m.role === 'ADMIN'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {isOwner ? '👑 Owner' : m.role === 'ADMIN' ? '🛡️ Admin' : 'Member'}
                      </span>

                      {!isOwner && (
                        <button
                          onClick={() => handleRemove(m.userId)}
                          title="Remove from workspace"
                          className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
