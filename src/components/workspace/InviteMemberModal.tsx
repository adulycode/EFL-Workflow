import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  X, 
  UserPlus, 
  Trash2, 
  Check, 
  Search, 
  Users, 
  Zap,
  CheckSquare,
  Square,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const InviteMemberModal: React.FC<Props> = ({ onClose }) => {
  const { currentWorkspace, inviteMembersBatch, removeMember } = useWorkspaceStore();
  const { users, currentUser } = useAuthStore();

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!currentWorkspace) return null;

  // Filter available non-members (active only)
  const currentMemberUserIds = currentWorkspace.members?.map((m) => m.userId) || [];
  const nonMembers = users.filter((u) => u.isActive !== false && !currentMemberUserIds.includes(u.id));

  const filteredNonMembers = nonMembers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.jobTitle && u.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isAllSelected = filteredNonMembers.length > 0 && filteredNonMembers.every((u) => selectedUserIds.includes(u.id));

  const handleToggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      const allFilteredIds = filteredNonMembers.map((u) => u.id);
      setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...allFilteredIds])));
    }
  };

  const handleBatchInvite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedUserIds.length === 0) return;

    setIsSubmitting(true);
    const ok = await inviteMembersBatch(currentWorkspace.id, selectedUserIds, selectedRole);
    setIsSubmitting(false);

    if (ok) {
      const count = selectedUserIds.length;
      setSelectedUserIds([]);
      setSuccessMessage(`เพิ่มสมาชิกสำเร็จ ${count} ท่าน!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleAddAllRemaining = async () => {
    const allRemainingIds = nonMembers.map((u) => u.id);
    if (allRemainingIds.length === 0) return;

    setIsSubmitting(true);
    const ok = await inviteMembersBatch(currentWorkspace.id, allRemainingIds, selectedRole);
    setIsSubmitting(false);

    if (ok) {
      setSelectedUserIds([]);
      setSuccessMessage(`เพิ่มสมาชิกทั้งหมด ${allRemainingIds.length} ท่านเรียบร้อยแล้ว!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleRemove = async (userId: string) => {
    await removeMember(currentWorkspace.id, userId);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>จัดการสมาชิกใน Space</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {currentWorkspace.name}
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                เลือกและเพิ่มทีมงานเข้าทำงานใน Space นี้ได้พร้อมกันหลายคน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Success Banner */}
          {successMessage && (
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-2xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
              <Check size={16} className="text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section: Add Members (Multi-Select) */}
          <div className="bg-neutral-50 dark:bg-neutral-950/70 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Users size={14} className="text-emerald-500" />
                <span>เลือกทีมงานที่ต้องการเพิ่ม ({nonMembers.length} ท่านที่ยังไม่ได้อยู่ใน Space)</span>
              </h3>

              {nonMembers.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddAllRemaining}
                  disabled={isSubmitting}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1 transition-all self-start sm:self-auto"
                  title="เพิ่มทีมงานทุกคนที่เหลือเข้า Space นี้ทันที"
                >
                  <Zap size={11} className="text-amber-500" />
                  <span>เพิ่มทุกคนทันที ({nonMembers.length} คน)</span>
                </button>
              )}
            </div>

            {nonMembers.length === 0 ? (
              <div className="p-4 text-center text-xs font-medium text-slate-400 bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                🎉 สมาชิกทุกคนในองค์กรได้เข้าร่วม Space นี้ครบถ้วนแล้ว
              </div>
            ) : (
              <>
                {/* Search & Select All Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาชื่อ หรืออีเมล..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {isAllSelected ? <CheckSquare size={13} className="text-emerald-500" /> : <Square size={13} />}
                    <span>{isAllSelected ? 'ยกเลิกเลือก' : 'เลือกทั้งหมด'}</span>
                  </button>
                </div>

                {/* Member Checkbox List */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  {filteredNonMembers.map((u) => {
                    const isChecked = selectedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleToggleSelect(u.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all border ${
                          isChecked
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-900 dark:text-emerald-100'
                            : 'bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border-transparent text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <div className="text-emerald-600 dark:text-emerald-400">
                            {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-neutral-400" />}
                          </div>
                          <img
                            src={u.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(u.name)}`}
                            alt={u.name}
                            className="w-7 h-7 rounded-xl object-cover shrink-0 border border-neutral-200 dark:border-neutral-700"
                          />
                          <div className="truncate text-left">
                            <div className="font-bold truncate">{u.name}</div>
                            <div className="text-[10px] text-neutral-400 truncate">{u.email}</div>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                          {u.jobTitle || u.role}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Role and Action Submission Bar */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-36 shrink-0">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none"
                    >
                      <option value="MEMBER">สิทธิ์: Member</option>
                      <option value="ADMIN">สิทธิ์: Admin</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBatchInvite()}
                    disabled={isSubmitting || selectedUserIds.length === 0}
                    className="flex-1 text-xs font-bold py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus size={14} />
                    <span>
                      {selectedUserIds.length > 0
                        ? `เพิ่มสมาชิกที่เลือก (${selectedUserIds.length} ท่าน)`
                        : 'เลือกสมาชิกด้านบน'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Section: Current Members in Space */}
          <div>
            <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
              <span>สมาชิกปัจจุบันใน Space นี้</span>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {currentWorkspace.members?.length || 0} คน
              </span>
            </h3>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {currentWorkspace.members?.map((m) => {
                const isOwner = currentWorkspace.ownerId === m.userId;
                return (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between p-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <img
                        src={m.user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(m.user.name)}`}
                        alt={m.user.name}
                        className="w-8 h-8 rounded-xl object-cover shrink-0 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {m.user.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          {m.user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isOwner
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                            : m.role === 'ADMIN'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {isOwner ? '👑 เจ้าของ' : m.role === 'ADMIN' ? '🛡️ Admin' : 'Member'}
                      </span>

                      {!isOwner && (
                        <button
                          onClick={() => handleRemove(m.userId)}
                          title="นำออกจาก Space"
                          className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
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
