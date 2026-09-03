import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';
import { useBoardStore } from '../../../store/useBoardStore';
import { 
  Camera, 
  Check, 
  Moon, 
  Sun, 
  UserCheck, 
  Sparkles, 
  RotateCcw, 
  LayoutGrid, 
  Kanban, 
  Table as TableIcon, 
  Calendar as CalendarIcon, 
  Building2, 
  CheckCircle2,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=fed7aa',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Milo&backgroundColor=bae6fd',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Zoe&backgroundColor=fbcfe8',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Oliver&backgroundColor=bbf7d0',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Jasper&backgroundColor=ddd6fe',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Luna&backgroundColor=fef08a',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Leo&backgroundColor=f1f5f9',
];

export const ProfileTab: React.FC = () => {
  const { currentUser, isDarkMode, toggleDarkMode, language, setLanguage, updateProfile } = useAuthStore();
  const { workspaces } = useWorkspaceStore();
  const { initLandingPreferences } = useBoardStore();

  const userId = currentUser?.id || '';

  const [name, setName] = useState(currentUser?.name || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || 'Team Member');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>(isDarkMode ? 'dark' : 'light');
  const [selectedLang, setSelectedLang] = useState<'th' | 'en'>(language || 'th');
  
  // Personal Landing Preferences (Default: 'LAST_VISITED')
  const [landingView, setLandingView] = useState<string>(() => {
    return (userId && localStorage.getItem(`efl_pref_landing_view_${userId}`)) || 'LAST_VISITED';
  });
  const [landingWorkspace, setLandingWorkspace] = useState<string>(() => {
    return (userId && localStorage.getItem(`efl_pref_landing_workspace_${userId}`)) || 'LAST_VISITED';
  });
  const [landingFilter, setLandingFilter] = useState<string>(() => {
    return (userId && localStorage.getItem(`efl_pref_landing_filter_${userId}`)) || 'DEFAULT';
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    // Apply theme & language
    toggleDarkMode(selectedTheme === 'dark');
    setLanguage(selectedLang);

    // Persist Landing Preferences
    if (userId) {
      try {
        localStorage.setItem(`efl_pref_landing_view_${userId}`, landingView);
        localStorage.setItem(`efl_pref_landing_workspace_${userId}`, landingWorkspace);
        localStorage.setItem(`efl_pref_landing_filter_${userId}`, landingFilter);
        initLandingPreferences(userId);
      } catch (e) {
        console.error('Failed to save landing preferences:', e);
      }
    }

    const success = await updateProfile({
      name,
      jobTitle,
      avatarUrl,
      theme: selectedTheme,
      language: selectedLang
    });

    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner / Avatar Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
        <div className="relative group">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-700 dark:text-slate-200">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              name.slice(0, 2).toUpperCase()
            )}
          </div>

          <label className="absolute inset-0 bg-black/50 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[10px] font-medium">
            <Camera size={18} className="mb-0.5" />
            <span>Upload</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
              <span>{name || 'Your Name'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                {currentUser?.role || 'MEMBER'}
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
          </div>

          {/* Preset Avatars */}
          <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" /> Presets:
            </span>
            {PRESET_AVATARS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatarUrl(url)}
                className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-transform hover:scale-110 ${
                  avatarUrl === url ? 'border-emerald-500 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={url} alt={`preset-${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Details Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Full Name (ชื่อ-นามสกุล)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 text-slate-900 dark:text-slate-100"
            placeholder="e.g. Somchai Prasert"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Job Title / Role (ตำแหน่งในทีม)
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 text-slate-900 dark:text-slate-100"
            placeholder="e.g. Frontend Specialist, Scrum Master"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* PERSONAL DEFAULT LANDING PREFERENCES SECTION */}
      {/* ======================================================== */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <Compass size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              หน้าเริ่มต้นเมื่อเปิดระบบ (Default Landing Preferences)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              เลือกหน้าจอและ Workspace ที่ต้องการให้ระบบเปิดขึ้นมาเป็นหน้าแรกเมื่อเข้าสู่ระบบ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          {/* 1. Default View Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>มุมมองเริ่มต้น (Default View Mode)</span>
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'LAST_VISITED', label: 'จำหน้าจอล่าสุดที่เข้าใช้ (Remember Last Visited)', icon: RotateCcw, desc: 'เปิดมาเจอหน้าที่เปิดค้างไว้ล่าสุดอัตโนมัติ' },
                { id: 'board', label: 'บอร์ด Kanban (Kanban Board)', icon: Kanban, desc: 'มุมมองการ์ดแบ่งตามขั้นตอนการทำงาน' },
                { id: 'table', label: 'ตาราง (Table Spreadsheet)', icon: TableIcon, desc: 'มุมมองตารางรายการสำหรับดูข้อมูลละเอียด' },
                { id: 'calendar', label: 'ปฏิทินงาน (Calendar View)', icon: CalendarIcon, desc: 'มุมมองปฏิทินตามกำหนดส่ง Due Date' },
                { id: 'overview', label: 'ภาพรวม Spaces (Overview Dashboard)', icon: LayoutGrid, desc: 'สรุปสถานะและภาระงานของทุกแผนก' }
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = landingView === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLandingView(opt.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/50 shadow-xs'
                        : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {opt.label}
                        </span>
                        {isSelected && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Default Workspace & Default Filter */}
          <div className="space-y-4">
            {/* Default Workspace */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Workspace เริ่มต้น (Default Space)</span>
              </label>
              
              <div className="space-y-1.5">
                {/* Option: Remember Last Active Workspace */}
                <button
                  type="button"
                  onClick={() => setLandingWorkspace('LAST_VISITED')}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    landingWorkspace === 'LAST_VISITED'
                      ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/50 shadow-xs'
                      : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw size={14} className={landingWorkspace === 'LAST_VISITED' ? 'text-emerald-500' : 'text-slate-400'} />
                    <span className={`text-xs font-bold ${landingWorkspace === 'LAST_VISITED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      จำ Space ล่าสุดที่เข้าใช้ (Last Active Space)
                    </span>
                  </div>
                  {landingWorkspace === 'LAST_VISITED' && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />}
                </button>

                {/* Specific Workspace Picker */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    หรือเลือกเจาะจง Workspace ประจำ:
                  </span>
                  <select
                    value={landingWorkspace === 'LAST_VISITED' ? '' : landingWorkspace}
                    onChange={(e) => setLandingWorkspace(e.target.value || 'LAST_VISITED')}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- ใช้แบบจำ Space ล่าสุด (Last Active) --</option>
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        🏢 {ws.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Default Filter: My Tasks vs All */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                ตัวกรองงานเริ่มต้น (Default Task Filter)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLandingFilter('DEFAULT')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    landingFilter === 'DEFAULT'
                      ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'bg-white/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  📋 แสดงงานทั้งหมด
                </button>

                <button
                  type="button"
                  onClick={() => setLandingFilter('MY_TASKS')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    landingFilter === 'MY_TASKS'
                      ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'bg-white/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  👤 เฉพาะงานของฉัน (My Tasks)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Mode Preferences */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Theme & Display (โหมดสีหน้าจอ)
        </h4>

        <div className="max-w-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedTheme('dark')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                selectedTheme === 'dark'
                  ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              <Moon size={15} /> Dark Mode
            </button>

            <button
              type="button"
              onClick={() => setSelectedTheme('light')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                selectedTheme === 'light'
                  ? 'bg-white border-emerald-500 text-emerald-600 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              <Sun size={15} /> Light Mode
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 animate-in fade-in">
            <Check size={14} /> Preferences Saved Successfully!
          </span>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
        >
          <UserCheck size={15} />
          <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>
    </form>
  );
};
