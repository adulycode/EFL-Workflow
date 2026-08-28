import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { Role, User } from '../../../types';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Eye, 
  EyeOff,
  Search, 
  Copy, 
  Check, 
  Mail, 
  RefreshCw, 
  Key, 
  CheckCircle2,
  Ban,
  UserCheck,
  Crown
} from 'lucide-react';

export const MembersTab: React.FC = () => {
  const { 
    users, 
    currentUser, 
    updateUserRole, 
    updateUserStatus, 
    updateUserAssignable, 
    syncUsersFromSso, 
    inviteUser 
  } = useAuthStore();

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

  const isAdmin = currentUser?.role === 'ADMIN';

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
    if (res.success) {
      setSyncFeedback(`ซิงค์สำเร็จ (${res.count} คน)`);
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

  return (
    <div className="space-y-5">
      {/* Header with Search, Sync & Action Buttons */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, ตำแหน่ง หรืออีเมล..."
            className="w-full pl-9 pr-24 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100 transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
            {filteredUsers.length} ท่าน
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync from Central SSO Button */}
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncSso}
            className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-500/20 transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
            title="ดึงข้อมูลสมาชิกและ Token ทั้งหมดจาก Central SSO อัตโนมัติ"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin text-purple-500' : 'text-purple-600 dark:text-purple-400'} />
            <span>{isSyncing ? 'กำลังซิงค์...' : syncFeedback || 'Sync SSO'}</span>
          </button>

          <button
            type="button"
            onClick={copyOrgInviteLink}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์เชิญ'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <UserPlus size={14} />
            <span>เชิญสมาชิกใหม่</span>
          </button>
        </div>
      </div>

      {/* Directory Table / List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/80 shadow-sm">
        {/* Table Column Headers (Desktop) */}
        <div className="hidden md:flex items-center px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="flex-1">สมาชิกในทีม ({filteredUsers.length})</div>
          <div className="w-44 text-left px-2">สิทธิ์ระบบ (Role)</div>
          <div className="w-36 text-center px-2">แสดงในบอร์ดงาน</div>
          <div className="w-24 text-right pr-2">การจัดการ</div>
        </div>

        {/* Members Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              ไม่พบรายชื่อสมาชิกที่ตรงกับคำค้นหา
            </div>
          ) : (
            filteredUsers.map((user: User) => {
              const isSelf = user.id === currentUser?.id;
              const isActive = user.isActive !== false;
              const isAssignable = user.isAssignable !== false;

              return (
                <div
                  key={user.id}
                  className={`p-3.5 px-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors ${
                    isActive 
                      ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40' 
                      : 'bg-rose-50/20 dark:bg-rose-950/10 opacity-70'
                  }`}
                >
                  {/* Column 1: Member Info (Avatar, Name, Badges, Email) */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 border border-slate-300 dark:border-slate-600 shadow-sm">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name.slice(0, 2).toUpperCase()
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                          isActive ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        title={isActive ? 'Active' : 'Disabled'}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {user.name}
                        </span>

                        {isSelf && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            YOU
                          </span>
                        )}

                        {!isActive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            DISABLED
                          </span>
                        )}

                        {!isAssignable && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                            SYSTEM
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span className="truncate">{user.jobTitle || 'Team Member'}</span>
                        <span>•</span>
                        <span className="truncate text-slate-400">{user.email}</span>

                        {(user.linkToken || user.lineNotifyToken) && (
                          <span
                            title={`LINE Notify Token Linked`}
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0"
                          >
                            <Key size={9} /> LINE Linked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 2, 3, 4: Controls (Role Selector, Task Visibility Toggle, Action Button) */}
                  <div className="flex items-center gap-2.5 self-start md:self-center shrink-0 flex-wrap md:flex-nowrap">
                    {/* Role Selector Dropdown (Fixed Width w-44) */}
                    <div className="w-44 shrink-0">
                      <select
                        value={user.role}
                        disabled={!isAdmin}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className={`w-full text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer disabled:opacity-60 transition-all border ${
                          user.role === 'ADMIN'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:border-amber-500/50'
                            : user.role === 'STAFF'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50'
                            : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30 hover:border-slate-500/50'
                        }`}
                      >
                        <option value="ADMIN">👑 Admin (คุมระบบ)</option>
                        <option value="STAFF">💼 Staff (ทำงาน)</option>
                        <option value="VIEWER">👁️ Viewer (ดูอย่างเดียว)</option>
                      </select>
                    </div>

                    {/* Task Visibility Toggle Button (Fixed Width w-36) */}
                    <div className="w-36 shrink-0 flex justify-center">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleToggleAssignable(user.id, user.isAssignable)}
                          title={
                            isAssignable
                              ? 'แสดงชื่อในช่องเลือก Assignees, Report To, FYI (คลิกเพื่อซ่อนชื่อเป็น System Admin)'
                              : 'ซ่อนชื่อออกจากช่องเลือกงานแล้ว (คลิกเพื่อเปิดให้รับงานได้)'
                          }
                          className={`w-full h-8 text-[11px] font-bold px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shadow-sm ${
                            isAssignable
                              ? 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/25'
                              : 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/25'
                          }`}
                        >
                          {isAssignable ? <Eye size={12} className="text-sky-500" /> : <EyeOff size={12} className="text-slate-400" />}
                          <span>{isAssignable ? 'มอบหมายได้' : 'ซ่อน (System)'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">
                          {isAssignable ? '👁️ มอบหมายได้' : '🛡️ ซ่อน'}
                        </span>
                      )}
                    </div>

                    {/* Account Status / Disable Action (Fixed Width w-24) */}
                    <div className="w-24 shrink-0 flex justify-end">
                      {isAdmin && !isSelf ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          title={isActive ? 'คลิกเพื่อระงับการใช้งาน (Disable)' : 'คลิกเพื่อเปิดใช้งาน (Enable)'}
                          className={`h-8 text-[11px] font-bold px-3 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1 ${
                            isActive
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/25'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                          }`}
                        >
                          {isActive ? <Ban size={11} /> : <UserCheck size={11} />}
                          <span>{isActive ? 'ระงับ' : 'เปิดใช้'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 px-2 py-1">
                          {isSelf ? 'บัญชีนี้' : '-'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Invite Member Popup Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserPlus size={16} className="text-emerald-500" />
                <span>เชิญสมาชิกใหม่เข้าสู่ระบบ</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ยกเลิก
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  อีเมล (Email) *
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
                  ชื่อ - นามสกุล
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="เช่น อนงค์ สมใจ (แอน)"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ตำแหน่ง (Job Title)
                </label>
                <input
                  type="text"
                  value={inviteJobTitle}
                  onChange={(e) => setInviteJobTitle(e.target.value)}
                  placeholder="เช่น Graphic Designer, Marketing Lead"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  สิทธิ์การใช้งาน (Role)
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
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
                >
                  {isInviting ? 'กำลังบันทึก...' : 'เพิ่มสมาชิก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
