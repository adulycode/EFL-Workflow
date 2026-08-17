import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { Bell, Check, MessageCircle, Mail, Clock, AtSign, UserCheck, Send } from 'lucide-react';

export const NotificationsTab: React.FC = () => {
  const { currentUser, updateProfile } = useAuthStore();

  const [lineUserId, setLineUserId] = useState(currentUser?.lineUserId || '');
  const [lineNotifyToken, setLineNotifyToken] = useState(currentUser?.lineNotifyToken || '');
  const [notifyAssigned, setNotifyAssigned] = useState(currentUser?.notifyAssigned ?? true);
  const [notifyDueDate, setNotifyDueDate] = useState(currentUser?.notifyDueDate ?? true);
  const [notifyMention, setNotifyMention] = useState(currentUser?.notifyMention ?? true);
  const [notifyEmail, setNotifyEmail] = useState(currentUser?.notifyEmail ?? true);
  const [notifyLine, setNotifyLine] = useState(currentUser?.notifyLine ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const success = await updateProfile({
      lineUserId,
      lineNotifyToken,
      notifyAssigned,
      notifyDueDate,
      notifyMention,
      notifyEmail,
      notifyLine
    });

    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      setTestSent(true);
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          title: '🔔 Test Alert - EFL Workflow',
          message: 'การเชื่อมต่อระบบแจ้งเตือนสำเร็จเรียบร้อยแล้ว!'
        })
      });
      setTimeout(() => setTestSent(false), 4000);
    } catch (err) {
      console.error('Failed to send test notification:', err);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* LINE Integration Card */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#06C755] text-white flex items-center justify-center shadow-md">
              <MessageCircle size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>LINE Notify & Messaging API</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                  {lineUserId || lineNotifyToken ? 'CONNECTED' : 'STANDBY'}
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                รับการแจ้งเตือนงานและการอัปเดตการ์ดผ่าน LINE ส่วนตัวหรือกลุ่ม
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifyLine}
              onChange={(e) => setNotifyLine(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06C755]"></div>
          </label>
        </div>

        {notifyLine && (
          <div className="space-y-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                LINE User ID (เช่น U1234567890abcdef)
              </label>
              <input
                type="text"
                value={lineUserId}
                onChange={(e) => setLineUserId(e.target.value)}
                placeholder="กรอก LINE User ID ของคุณ..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#06C755] text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                LINE Notify Token (ทางเลือกสำหรับกลุ่ม)
              </label>
              <input
                type="text"
                value={lineNotifyToken}
                onChange={(e) => setLineNotifyToken(e.target.value)}
                placeholder="กรอก LINE Notify Token สำหรับยิงเข้ากลุ่ม..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#06C755] text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Trigger Event Checkboxes */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Notification Triggers (เลือกเหตุการณ์ที่ต้องการรับการแจ้งเตือน)
        </h4>

        <div className="space-y-2">
          {/* Card Assigned */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={notifyAssigned}
              onChange={(e) => setNotifyAssigned(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <UserCheck size={14} className="text-emerald-500" />
                <span>เมื่อมีคนมอบหมายการ์ดให้ฉัน (Card Assigned)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                ส่งการแจ้งเตือนทันทีที่คุณถูกเลือกเป็น Assignee ในการ์ดงาน
              </p>
            </div>
          </label>

          {/* Due Date Alert */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={notifyDueDate}
              onChange={(e) => setNotifyDueDate(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Clock size={14} className="text-amber-500" />
                <span>เตือนก่อนถึง Due Date ล่วงหน้า 1 วัน (Due Date Reminder)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                แจ้งเตือนงานที่กำลังจะถึงกำหนดส่งล่วงหน้า 24 ชั่วโมง
              </p>
            </div>
          </label>

          {/* Mention Tag */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={notifyMention}
              onChange={(e) => setNotifyMention(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <AtSign size={14} className="text-sky-500" />
                <span>เมื่อมีคน @mention ในคอมเมนต์ (Mentions in Comments)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                รับการแจ้งเตือนเมื่อเพื่อนร่วมทีมแท็กชื่อคุณในการสนทนาบนการ์ด
              </p>
            </div>
          </label>

          {/* Email Digest */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Mail size={14} className="text-purple-500" />
                <span>รับอีเมลสรุปความเคลื่อนไหว (Email Digest)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                ส่งสรุปการ์ดงานและกิจกรรมสำคัญเข้าอีเมล {currentUser?.email}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Save & Test Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={handleSendTestNotification}
          disabled={testSent}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-600 transition-colors flex items-center gap-1.5"
        >
          <Send size={13} />
          <span>{testSent ? 'Test Alert Sent! ✨' : 'Send Test Notification'}</span>
        </button>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 animate-in fade-in">
              <Check size={14} /> Preferences Saved!
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Bell size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
