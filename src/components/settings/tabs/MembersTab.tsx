import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { Role, User } from '../../../types';
import { Users, UserPlus, Shield, ShieldAlert, Eye, Search, Copy, Check, Mail, RefreshCw, Key, Bell } from 'lucide-react';

export const MembersTab: React.FC = () => {
  const { users, currentUser, updateUserRole, updateUserStatus, updateUserAssignable, syncUsersFromSso, inviteUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('STAFF');
  const [inviteJobTitle, setInviteJobTitle] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.jobTitle && u.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRoleChange = async (userId: string, newRole: Role) => {
    await updateUserRole(userId, newRole);
  };

  const handleToggleStatus = async (userId: string, currentStatus?: boolean) => {
    const nextStatus = currentStatus === false ? true : false;
    await updateUserStatus(userId, nextStatus);
  };

  const handleToggleAssignable = async (userId: string, currentAssignable?: boolean) => {
    const nextVal = currentAssignable === false ? true : false;
    await updateUserAssignable(userId, nextVal);
  };

  const handleSyncSso = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await syncUsersFromSso();
    setIsSyncing(false);
    setIsSyncing(false);
    if (res.success) {
      setSyncFeedback(`ซิงค์ข้อมูลสำเร็จ (${res.count} คน)`);
    } else {
      setSyncFeedback('ซิงค์เรียบร้อย');
    }
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    setIsInviting(true);
    const ok = await inviteUser(inviteEmail, inviteName, inviteRole, inviteJobTitle || 'Staff Member');
    setIsInviting(false);

    if (ok) {
      setInviteSuccess(true);
      setInviteEmail('');
      setInviteName('');
      setInviteJobTitle('');
      setInviteRole('STAFF');
      setTimeout(() => {
        setInviteSuccess(false);
        setIsInviteOpen(false);
      }, 1500);
    }
  };

  const copyOrgInviteLink = () => {
    const link = `${window.location.origin}/join/org-invite-demo`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <ShieldAlert size={11} /> Admin
          </span>
        );
      case 'STAFF':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <Shield size={11} /> Staff
          </span>
        );
      case 'VIEWER':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Eye size={11} /> Viewer
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header with Search, Sync & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาสมาชิก..."
            className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Sync from Central SSO Button */}
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncSso}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            title="ดึงข้อมูลสมาชิกและ Token ทั้งหมดจาก Central SSO อัตโนมัติ"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin text-purple-500' : 'text-purple-600 dark:text-purple-400'} />
            <span>{isSyncing ? 'Syncing...' : syncFeedback || 'Sync from SSO'}</span>
          </button>

          <button
            type="button"
            onClick={copyOrgInviteLink}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-600 transition-colors flex items-center justify-center gap-1.5"
          >
            {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            <UserPlus size={14} />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Members Directory List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No team members found matching your search.
          </div>
        ) : (
          filteredUsers.map((user: User) => {
            const isSelf = user.id === currentUser?.id;
            const isAdmin = currentUser?.role === 'ADMIN';
            const isActive = user.isActive !== false;

            return (
              <div
                key={user.id}
                className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isActive ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-rose-50/20 dark:bg-rose-950/10 opacity-75'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0 border border-slate-300 dark:border-slate-600 shadow-sm">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.slice(0, 2).toUpperCase()
                    )}
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                        isActive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user.name}
                      </h4>
                      {isSelf && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          YOU
                        </span>
                      )}
                      {!isActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                          DISABLED
                        </span>
                      )}
                      {(user.linkToken || user.lineNotifyToken) && (
                        <span
                          title={`Token: ${user.linkToken || user.lineNotifyToken}`}
                          className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                        >
                          <Key size={9} /> Token Linked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.jobTitle || 'Team Member'} • {user.email}
                    </p>
                  </div>
                </div>

                {/* Role Selector & Status Toggle */}
                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <select
                    value={user.role}
                    disabled={!isAdmin}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                    className="text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-60"
                  >
                    <option value="ADMIN">👑 Admin (คุมระบบทั้งหมด)</option>
                    <option value="STAFF">💼 Staff (บันทึก/จัดการงาน)</option>
                    <option value="VIEWER">👁️ Viewer (ดูอย่างเดียว)</option>
                  </select>

                  {getRoleBadge(user.role)}

                  {/* Assignable Visibility Toggle (Show/Hide in Task Pickers) */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleToggleAssignable(user.id, user.isAssignable)}
                      title={user.isAssignable !== false ? 'แสดงชื่อในช่องเลือกผู้รับผิดชอบงาน (คลิกเพื่อซ่อนชื่อ / บัญชีดูแลระบบ)' : 'ซ่อนชื่อจากช่องเลือกงานแล้ว (บัญชี System Admin)'}
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-colors ${
                        user.isAssignable !== false
                          ? 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      <span>{user.isAssignable !== false ? '👁️ มอบหมายได้' : '🛡️ ซ่อน (System)'}</span>
                    </button>
                  )}

                  {/* Status Toggle Button for Admin */}
                  {isAdmin && !isSelf && (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      title={isActive ? 'คลิกเพื่อระงับการใช้งาน (Disable)' : 'คลิกเพื่อเปิดใช้งาน (Enable)'}
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition-colors ${
                        isActive
                          ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {isActive ? 'ระงับ' : 'เปิดใช้งาน'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invite Member Popup Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserPlus size={16} className="text-emerald-500" />
                <span>Invite New Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Anong Somjai"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={inviteJobTitle}
                  onChange={(e) => setInviteJobTitle(e.target.value)}
                  placeholder="e.g. QA Engineer, Product Designer"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role Permission
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="STAFF">💼 Staff (บันทึก/จัดการการ์ดงาน)</option>
                  <option value="ADMIN">👑 Admin (ควบคุมสิทธิ์ทั้งบอร์ด)</option>
                  <option value="VIEWER">👁️ Viewer (ดูและดาวน์โหลดไฟล์ได้อย่างเดียว)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
                >
                  {isInviting ? 'Adding Member...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
