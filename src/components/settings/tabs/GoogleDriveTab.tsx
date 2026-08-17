import React, { useState, useEffect } from 'react';
import { Cloud, Check, ExternalLink, RefreshCw, Key, FolderOpen, ShieldCheck, AlertCircle } from 'lucide-react';

export const GoogleDriveTab: React.FC = () => {
  const [folderId, setFolderId] = useState('1N1tclaApps6k8gmz-1SIbBWacOAW-T1D');
  const [serviceAccountEmail, setServiceAccountEmail] = useState('efl-drive-uploader@scp-ggdrive-upload.iam.gserviceaccount.com');
  const [hasServiceAccount, setHasServiceAccount] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.googleDriveFolderId) setFolderId(data.googleDriveFolderId);
        if (data.serviceAccountEmail) setServiceAccountEmail(data.serviceAccountEmail);
        if (data.hasServiceAccount !== undefined) setHasServiceAccount(data.hasServiceAccount);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings/google-drive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleDriveFolderId: folderId.trim() })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save Google Drive settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings/google-drive/test', {
        method: 'POST'
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test timed out.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Service Account Status Banner */}
      <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md">
              <Cloud size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Google Cloud Storage & Drive</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <ShieldCheck size={11} /> READY
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ไฟล์แนบและรูปภาพทั้งหมดบนการ์ดจะถูกจัดเก็บเข้า Google Drive โดยอัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        {/* Service Account Email Info */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-sky-200/80 dark:border-sky-900/80 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Key size={14} className="text-amber-500 shrink-0" />
            <span className="text-slate-500 shrink-0">Service Account:</span>
            <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 font-bold truncate">
              {serviceAccountEmail}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(serviceAccountEmail);
              alert('Copied Service Account Email!');
            }}
            className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline shrink-0 ml-2"
          >
            Copy Email
          </button>
        </div>
      </div>

      {/* Central Folder Configuration */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Central Google Drive Folder ID
        </h4>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Folder ID สำหรับจัดเก็บไฟล์งานของทีม
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              required
              className="flex-1 px-3.5 py-2 rounded-xl text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100"
              placeholder="e.g. 1N1tclaApps6k8gmz-1SIbBWacOAW-T1D"
            />

            <a
              href={`https://drive.google.com/drive/folders/${folderId}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-600 transition-colors flex items-center gap-1.5 shrink-0"
              title="Open Folder in Google Drive"
            >
              <FolderOpen size={14} className="text-sky-500" />
              <span>Open Drive</span>
              <ExternalLink size={11} />
            </a>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            * ดู Folder ID ได้จาก URL หลัง <span className="font-mono">folders/</span> ใน Google Drive
          </p>
        </div>
      </div>

      {/* Guide Card on how to share folder */}
      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs space-y-1.5 text-amber-900 dark:text-amber-300">
        <h5 className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
          💡 วิธีตั้งค่าสิทธิ์ให้ระบบอัปโหลดไฟล์ได้ถูกต้อง:
        </h5>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
          <li>เปิดโฟลเดอร์ Google Drive ที่ต้องการใช้เป็นที่เก็บไฟล์</li>
          <li>กดปุ่ม <strong>Share (แชร์)</strong> ที่โฟลเดอร์นั้น</li>
          <li>เพิ่มอีเมล <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">{serviceAccountEmail}</code></li>
          <li>กำหนดสิทธิ์เป็น <strong>Editor (ผู้แก้ไข)</strong> แล้วกดยืนยัน</li>
        </ol>
      </div>

      {/* Test Connection Output */}
      {testResult && (
        <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in ${
          testResult.success 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          {testResult.success ? <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />}
          <div>
            <span className="font-bold">{testResult.success ? 'Success: ' : 'Error: '}</span>
            <span>{testResult.message}</span>
          </div>
        </div>
      )}

      {/* Save & Test Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={isTesting}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-600 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
          <span>{isTesting ? 'Testing Drive Connection...' : 'Test Connection'}</span>
        </button>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 animate-in fade-in">
              <Check size={14} /> Drive Settings Saved!
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Cloud size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Drive Settings'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
