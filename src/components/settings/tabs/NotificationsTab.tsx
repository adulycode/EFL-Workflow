import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { Bell, Check, MessageCircle, Mail, Clock, AtSign, UserCheck, Send, Smartphone, Sparkles, ExternalLink } from 'lucide-react';

export const NotificationsTab: React.FC = () => {
  const { currentUser, updateProfile } = useAuthStore();

  const [lineUserId, setLineUserId] = useState(currentUser?.lineUserId || '');
  const [lineNotifyToken, setLineNotifyToken] = useState(currentUser?.lineNotifyToken || '');
  const [notifyAssigned, setNotifyAssigned] = useState(currentUser?.notifyAssigned ?? true);
  const [notifyDueDate, setNotifyDueDate] = useState(currentUser?.notifyDueDate ?? true);
  const [notifyMention, setNotifyMention] = useState(currentUser?.notifyMention ?? true);
  const [notifyEmail, setNotifyEmail] = useState(currentUser?.notifyEmail ?? true);
  const [notifyLine, setNotifyLine] = useState(currentUser?.notifyLine ?? true);

  const [showLinePreview, setShowLinePreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState('');

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
          title: '📌 มอบหมายงาน: ตรวจสอบและพัฒนา LINE Flex Card Notification',
          message: 'คุณได้รับมอบหมายให้ดูแลการ์ดงานนี้ในบอร์ด EFL Core Organization'
        })
      });
      setTimeout(() => setTestSent(false), 4000);
    } catch (err) {
      console.error('Failed to send test notification:', err);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setTestEmailSent(true);
      setEmailStatusMsg('กำลังส่ง...');
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
                รับการแจ้งเตือนงานเป็นการ์ด Flex Message สวยหรูผ่าน LINE ส่วนตัวหรือกลุ่ม
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
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#06C755] text-slate-900 dark:text-slate-100 font-mono"
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
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#06C755] text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Live LINE Flex Card Preview Widget */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-[#06C755]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              ตัวอย่างการ์ดบน LINE (LINE Flex Message Card Preview)
            </h4>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/30 flex items-center gap-1">
            <Sparkles size={11} /> Flex 3.0 Rich Format
          </span>
        </div>

        {/* Mock Smartphone LINE Chat Screen */}
        <div className="max-w-md mx-auto bg-[#849EB9] p-4 rounded-2xl shadow-inner border border-slate-400/40">
          <div className="text-center text-[10px] text-white/80 mb-2 font-medium">
            วันนี้ 15:26 น.
          </div>

          {/* Flex Message Bubble */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Flex Header */}
            <div className="bg-emerald-700 p-3.5 text-white flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold tracking-widest uppercase block opacity-80">
                  EFL WORKFLOW
                </span>
                <span className="text-xs font-bold text-emerald-100 flex items-center gap-1 mt-0.5">
                  📁 EFL Core Organization • 📋 Main Kanban
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                🔴 URGENT
              </span>
            </div>

            {/* Flex Body */}
            <div className="p-4 space-y-3 text-left">
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  📌 จัดทำรายงานประเมินผลการเรียนรู้ Q3 & แผนการสอน
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  คุณได้รับมอบหมายให้เป็นผู้รับผิดชอบหลักในการ์ดนี้ กรุณาตรวจสอบเอกสารแนบใน Google Drive และอัปเดต Checklist
                </p>
              </div>

              <div className="h-[1px] bg-slate-100 w-full" />

              {/* Key-Value Details */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock size={12} className="text-amber-500" /> กำหนดส่ง:
                  </span>
                  <span className="font-bold text-rose-600">
                    18 ส.ค. 2026, 17:00 น.
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <UserCheck size={12} className="text-emerald-500" /> ผู้รับผิดชอบ:
                  </span>
                  <span className="font-bold text-slate-900">
                    {currentUser?.name || 'สมชาย ประเสริฐ'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Check size={12} className="text-sky-500" /> Checklist:
                  </span>
                  <span className="font-bold text-emerald-600">
                    3/4 รายการ (75%)
                  </span>
                </div>
              </div>
            </div>

            {/* Flex Footer / Action Button */}
            <div className="p-3 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5"
              >
                <span>🔗 เปิดดูการ์ดงานบนบอร์ด</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={testEmailSent}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Mail size={13} />
            <span>{testEmailSent ? 'Sending Test Email...' : `📧 ส่ง Email ทดสอบเข้า ${currentUser?.email || 'อีเมล'}`}</span>
          </button>

          <button
            type="button"
            onClick={handleSendTestNotification}
            disabled={testSent}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-600 transition-colors flex items-center gap-1.5"
          >
            <Send size={13} />
            <span>{testSent ? 'Test Alert Sent! ✨' : 'ส่ง LINE ทดสอบ'}</span>
          </button>
        </div>

        {emailStatusMsg && (
          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800">
            {emailStatusMsg}
          </div>
        )}

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
