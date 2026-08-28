import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { ProfileTab } from './tabs/ProfileTab';
import { NotificationsTab } from './tabs/NotificationsTab';
import { GoogleDriveTab } from './tabs/GoogleDriveTab';
import { MembersTab } from './tabs/MembersTab';
import { LabelsTab } from './tabs/LabelsTab';
import { Settings, User, Bell, Cloud, Users, Tag, X } from 'lucide-react';

type SettingsTabType = 'profile' | 'notifications' | 'googledrive' | 'members' | 'labels';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, closeSettings, settingsInitialTab, currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTabType>('profile');

  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaff = currentUser?.role === 'STAFF';

  const ALL_TABS = [
    { id: 'profile' as const, label: 'Profile & Appearance', thai: 'ข้อมูลส่วนตัว & ธีม', icon: User, color: 'text-emerald-500', allowed: true },
    { id: 'notifications' as const, label: 'Notifications', thai: 'การแจ้งเตือน (LINE/Email)', icon: Bell, color: 'text-amber-500', allowed: true },
    { id: 'googledrive' as const, label: 'Cloud & Google Drive', thai: 'คลาวด์และพื้นที่เก็บไฟล์', icon: Cloud, color: 'text-sky-500', allowed: isAdmin },
    { id: 'members' as const, label: 'Members & Roles', thai: 'สมาชิกและสิทธิ์การใช้งาน', icon: Users, color: 'text-purple-500', allowed: isAdmin },
    { id: 'labels' as const, label: 'Custom Labels', thai: 'ป้ายกำกับประจำบอร์ด', icon: Tag, color: 'text-pink-500', allowed: isAdmin || isStaff },
  ];

  const visibleTabs = ALL_TABS.filter((t) => t.allowed);

  useEffect(() => {
    if (settingsInitialTab) {
      const isAllowed = visibleTabs.some((t) => t.id === settingsInitialTab);
      setActiveTab(isAllowed ? settingsInitialTab : 'profile');
    } else {
      if (!visibleTabs.some((t) => t.id === activeTab)) {
        setActiveTab('profile');
      }
    }
  }, [settingsInitialTab, isSettingsOpen, currentUser?.role]);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>EFL-Workflow Settings</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  WORKSPACE
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                จัดการการตั้งค่าระบบ สมาชิก การแจ้งเตือน และการจัดเก็บไฟล์
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation Scrollable Bar */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 border-b-2 font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white/60 dark:bg-slate-900/60 rounded-t-xl'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={15} className={isActive ? tab.color : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'googledrive' && <GoogleDriveTab />}
          {activeTab === 'members' && <MembersTab />}
          {activeTab === 'labels' && <LabelsTab />}
        </div>

      </div>
    </div>
  );
};
