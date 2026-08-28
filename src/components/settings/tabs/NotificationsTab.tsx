import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { Bell, Check, Mail, Clock, AtSign, UserCheck, Sparkles, ShieldCheck, CornerDownLeft, Inbox } from 'lucide-react';

export const NotificationsTab: React.FC = () => {
  const { currentUser, updateProfile } = useAuthStore();

  const [notifyAssigned, setNotifyAssigned] = useState(currentUser?.notifyAssigned ?? true);
  const [notifyDueDate, setNotifyDueDate] = useState(currentUser?.notifyDueDate ?? true);
  const [notifyMention, setNotifyMention] = useState(currentUser?.notifyMention ?? true);
  const [notifyEmail, setNotifyEmail] = useState(currentUser?.notifyEmail ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const success = await updateProfile({
      notifyAssigned,
      notifyDueDate,
      notifyMention,
      notifyEmail
    });

    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setTestEmailSent(true);
      setEmailStatusMsg('กำลังส่งอีเมลทดสอบ...');
      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          email: currentUser?.email
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatusMsg('✅ ส่งอีเมลสำเร็จแล้ว! ตรวจสอบที่กล่องข้อความได้เลยครับ');
      } else {
        setEmailStatusMsg(`❌ ไม่สามารถส่งได้: ${data.error}`);
      }
      setTimeout(() => {
        setTestEmailSent(false);
        setEmailStatusMsg('');
      }, 6000);
    } catch (err: any) {
      setEmailStatusMsg(`❌ เกิดข้อผิดพลาด: ${err.message}`);
      setTimeout(() => {
        setTestEmailSent(false);
        setEmailStatusMsg('');
      }, 6000);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Email Engine Active Hub */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Mail size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Gmail Smart Notifications & 2-Way Reply
                </h4>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <ShieldCheck size={11} /> ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                เชื่อมต่อระบบส่งและรับคอมเมนต์อัตโนมัติผ่าน <span className="font-semibold text-emerald-700 dark:text-emerald-300">efl.notify@gmail.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto">
            <Inbox size={14} className="text-emerald-600" />
            <span>ปลายทาง: <strong>{currentUser?.email || 'ไม่มีอีเมล'}</strong></span>
          </div>
        </div>

        {/* 3 Core Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/60">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-emerald-100 dark:border-emerald-900/40">
            <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              <strong className="block text-slate-900 dark:text-slate-100">แจ้งเตือนทันที (Realtime)</strong>
              เด้งทั้งบนเว็บ (🔔) และเข้ากล่องข้อความอีเมล
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-emerald-100 dark:border-emerald-900/40">
            <CornerDownLeft size={16} className="text-teal-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              <strong className="block text-slate-900 dark:text-slate-100">ตอบกลับด้วย Reply</strong>
              กด Reply ใน Gmail ข้อความจะขึ้นบนการ์ดทันที
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-emerald-100 dark:border-emerald-900/40">
            <ShieldCheck size={16} className="text-purple-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              <strong className="block text-slate-900 dark:text-slate-100">Zero Setup สำหรับทีมงาน</strong>
              ซิงก์อีเมลจาก Central SSO ให้ทุกคน 100%
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Event Checkboxes */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Notification Preferences (เลือกการแจ้งเตือนที่คุณต้องการรับ)
        </h4>

        <div className="space-y-2">
          {/* Card Assigned */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={notifyAssigned}
              onChange={(e) => setNotifyAssigned(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <UserCheck size={15} className="text-emerald-500" />
                <span>เมื่อมีคนมอบหมายการ์ดให้ฉัน (Card Assigned)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                ส่งการแจ้งเตือนทันทีที่คุณถูกเลือกเป็น Assignee หรือ Report To ในการ์ดงาน
              </p>
            </div>
          </label>

          {/* Due Date Alert */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={notifyDueDate}
              onChange={(e) => setNotifyDueDate(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Clock size={15} className="text-amber-500" />
                <span>เตือนก่อนถึงกำหนดส่งล่วงหน้า 1 วัน (Due Date Reminder)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                แจ้งเตือนงานที่กำลังจะถึงกำหนดส่งล่วงหน้า 24 ชั่วโมง เพื่อไม่ให้พลาดกำหนดการ
              </p>
            </div>
          </label>

          {/* Mention Tag */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={notifyMention}
              onChange={(e) => setNotifyMention(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <AtSign size={15} className="text-sky-500" />
                <span>เมื่อมีคน @mention ในคอมเมนต์ หรือตอบกลับการ์ดของฉัน</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                รับการแจ้งเตือนเมื่อเพื่อนร่วมทีมแท็กชื่อคุณ หรือมีความคิดเห็นใหม่ในการ์ดที่คุณดูแล
              </p>
            </div>
          </label>

          {/* Master Email Switch */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Mail size={15} className="text-purple-500" />
                <span>รับการแจ้งเตือนทางอีเมล (Email Notifications & Digest)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                ส่งการ์ดงานและการแจ้งเตือนสำคัญเข้าอีเมล <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser?.email}</span>
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Save & Test Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={testEmailSent}
            className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Mail size={14} />
            <span>{testEmailSent ? 'กำลังส่ง Email...' : `📧 ส่ง Email ทดสอบเข้า ${currentUser?.email || 'กล่องข้อความ'}`}</span>
          </button>
        </div>

        {emailStatusMsg && (
          <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800">
            {emailStatusMsg}
          </div>
        )}

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 animate-in fade-in">
              <Check size={15} /> บันทึกการตั้งค่าแล้ว!
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Bell size={15} />
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
