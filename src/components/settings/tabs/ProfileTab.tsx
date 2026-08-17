import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { Camera, Check, Moon, Sun, Globe, UserCheck, Sparkles } from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
];

export const ProfileTab: React.FC = () => {
  const { currentUser, isDarkMode, toggleDarkMode, language, setLanguage, updateProfile } = useAuthStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || 'Team Member');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>(isDarkMode ? 'dark' : 'light');
  const [selectedLang, setSelectedLang] = useState<'th' | 'en'>(language || 'th');
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

    // Apply theme
    toggleDarkMode(selectedTheme === 'dark');
    setLanguage(selectedLang);

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

      {/* Appearance & Language Preferences */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Preferences (การแสดงผลและภาษา)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Theme Mode (โหมดสี)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTheme('dark')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedTheme === 'dark'
                    ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon size={15} /> Dark Mode
              </button>

              <button
                type="button"
                onClick={() => setSelectedTheme('light')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedTheme === 'light'
                    ? 'bg-white border-emerald-500 text-emerald-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun size={15} /> Light Mode
              </button>
            </div>
          </div>

          {/* Language Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              System Language (ภาษาของระบบ)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedLang('th')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedLang === 'th'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="text-base">🇹🇭</span> ภาษาไทย
              </button>

              <button
                type="button"
                onClick={() => setSelectedLang('en')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedLang === 'en'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="text-base">🇺🇸</span> English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 animate-in fade-in">
            <Check size={14} /> Profile Saved Successfully!
          </span>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <UserCheck size={15} />
          <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </div>
    </form>
  );
};
