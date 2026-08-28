import React, { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  X, 
  Palette, 
  Tag, 
  Users, 
  Trash2, 
  Check, 
  Sparkles, 
  Image as ImageIcon, 
  Plus, 
  Edit2, 
  Download,
  AlertTriangle,
  UserPlus,
  ShieldCheck,
  Smile
} from 'lucide-react';

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GRADIENT_THEMES = [
  { id: 'default', name: 'Emerald Lagoon', class: 'bg-gradient-to-br from-emerald-950 via-teal-900/60 to-slate-950', preview: 'from-emerald-600 to-teal-700' },
  { id: 'cyber-midnight', name: 'Cyber Midnight', class: 'bg-gradient-to-br from-slate-950 via-purple-950/70 to-slate-900', preview: 'from-purple-600 to-indigo-900' },
  { id: 'sunset-horizon', name: 'Sunset Horizon', class: 'bg-gradient-to-br from-rose-950/80 via-amber-950/60 to-slate-950', preview: 'from-rose-600 to-amber-600' },
  { id: 'deep-ocean', name: 'Deep Ocean', class: 'bg-gradient-to-br from-blue-950 via-cyan-950/60 to-slate-950', preview: 'from-blue-600 to-cyan-700' },
  { id: 'minimal-charcoal', name: 'Minimal Charcoal', class: 'bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900', preview: 'from-neutral-700 to-neutral-900' },
  { id: 'royal-violet', name: 'Royal Violet', class: 'bg-gradient-to-br from-indigo-950 via-purple-950/60 to-slate-950', preview: 'from-indigo-600 to-purple-700' },
];

export const HD_WALLPAPERS = [
  { id: 'wp-mountain', name: 'Mountain Summit', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80' },
  { id: 'wp-galaxy', name: 'Cosmic Galaxy', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80' },
  { id: 'wp-forest', name: 'Misty Pine Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&auto=format&fit=crop&q=80' },
  { id: 'wp-architecture', name: 'Minimal Architecture', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80' },
  { id: 'wp-ocean', name: 'Sunset Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80' },
  { id: 'wp-abstract', name: 'Warm Flow', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&auto=format&fit=crop&q=80' },
];

export const EMOJI_PRESETS = ['📋', '🚀', '🎯', '💡', '💰', '🎨', '🛠️', '📊', '⚡', '🌟', '🔥', '🎓', '📚', '💼', '💻', '📈'];

export const LABEL_COLORS = [
  { bg: '#fee2e2', text: '#991b1b', name: 'Red' },
  { bg: '#ffedd5', text: '#9a3412', name: 'Orange' },
  { bg: '#fef3c7', text: '#92400e', name: 'Amber' },
  { bg: '#dcfce7', text: '#166534', name: 'Green' },
  { bg: '#e0f2fe', text: '#075985', name: 'Sky' },
  { bg: '#e0e7ff', text: '#3730a3', name: 'Indigo' },
  { bg: '#f3e8ff', text: '#6b21a8', name: 'Purple' },
  { bg: '#fce7f3', text: '#9d174d', name: 'Pink' },
];

export const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({ isOpen, onClose }) => {
  const { board, labels, updateBoard, deleteBoard, createLabel, updateLabel, deleteLabel } = useBoardStore();
  const { currentWorkspace, inviteMember, removeMember } = useWorkspaceStore();
  const { users, currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'theme' | 'labels' | 'members' | 'danger'>('theme');

  // Theme state
  const [title, setTitle] = useState(board?.title || '');
  const [description, setDescription] = useState(board?.description || '');
  const [icon, setIcon] = useState(board?.icon || '📋');
  const [selectedBg, setSelectedBg] = useState(board?.background || 'default');
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Label form state
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

  // Member invite state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !board) return null;

  const handleSaveTheme = async (newBg?: string, newIcon?: string) => {
    setIsSaving(true);
    const bgToSave = newBg !== undefined ? newBg : selectedBg;
    const iconToSave = newIcon !== undefined ? newIcon : icon;

    await updateBoard(board.id, {
      title: title.trim() || board.title,
      description: description.trim() || undefined,
      icon: iconToSave,
      background: bgToSave
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCreateOrUpdateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    if (editingLabelId) {
      await updateLabel(editingLabelId, {
        name: newLabelName.trim(),
        colorBg: newLabelColor.bg,
        colorText: newLabelColor.text
      });
      setEditingLabelId(null);
    } else {
      await createLabel(newLabelName.trim(), newLabelColor.bg, newLabelColor.text);
    }

    setNewLabelName('');
  };

  const handleInviteMember = async () => {
    if (!selectedUserId || !currentWorkspace) return;
    await inviteMember(currentWorkspace.id, selectedUserId, 'MEMBER');
    setSelectedUserId('');
  };

  const handleDeleteBoard = async () => {
    if (!board) return;
    await deleteBoard(board.id);
    onClose();
  };

  // Filter out existing workspace members from invite picker
  const existingMemberIds = new Set(currentWorkspace?.members?.map((m) => m.userId) || []);
  const availableUsersToInvite = users.filter((u) => !existingMemberIds.has(u.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{board.title}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Settings
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ปรับแต่งธีม วอลเปเปอร์ ป้ายกำกับ และจัดการสมาชิกในบอร์ด
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'theme'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Palette size={14} />
            <span>🎨 ธีม & พื้นหลัง</span>
          </button>

          <button
            onClick={() => setActiveTab('labels')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'labels'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Tag size={14} />
            <span>🏷️ ป้ายกำกับ (Labels)</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'members'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users size={14} />
            <span>👥 สมาชิก ({currentWorkspace?.members?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'danger'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Trash2 size={14} />
            <span>🗑️ จัดการบอร์ด</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: THEME & WALLPAPER */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              {/* Board Title & Emoji Picker */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  ไอคอน & ชื่อบอร์ด (Board Icon & Title)
                </label>
                
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <button
                      type="button"
                      className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform"
                    >
                      {icon}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ชื่อบอร์ดงาน..."
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Emoji Quick Select */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  {EMOJI_PRESETS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        setIcon(e);
                        handleSaveTheme(undefined, e);
                      }}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                        icon === e ? 'bg-emerald-500/20 border border-emerald-500/40 scale-110' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gradient Color Themes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    ชุดสี Gradient พรีเมียม (Vibrant Gradients)
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles size={11} /> 1-Click เปลี่ยนธีมทันที
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {GRADIENT_THEMES.map((theme) => {
                    const isSelected = selectedBg === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setSelectedBg(theme.id);
                          handleSaveTheme(theme.id);
                        }}
                        className={`group relative p-3 rounded-2xl border text-left transition-all overflow-hidden ${
                          isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className={`h-12 w-full rounded-xl bg-gradient-to-br ${theme.preview} mb-2 shadow-inner flex items-center justify-center`}>
                          {isSelected && <Check size={18} className="text-white drop-shadow-md" />}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {theme.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Curated HD Wallpapers */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  ภาพถ่ายความคมชัดสูง (Curated HD Wallpapers)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {HD_WALLPAPERS.map((wp) => {
                    const isSelected = selectedBg === wp.url;
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => {
                          setSelectedBg(wp.url);
                          handleSaveTheme(wp.url);
                        }}
                        className={`group relative p-2 rounded-2xl border text-left transition-all overflow-hidden ${
                          isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="h-16 w-full rounded-xl overflow-hidden mb-1.5 relative shadow-inner">
                          <img src={wp.url} alt={wp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center">
                              <Check size={18} className="text-white drop-shadow-md" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {wp.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ใส่วอลเปเปอร์แบบ Custom (Image URL)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customBgUrl}
                    onChange={(e) => setCustomBgUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 font-mono text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customBgUrl.trim()) {
                        setSelectedBg(customBgUrl.trim());
                        handleSaveTheme(customBgUrl.trim());
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow transition-colors"
                  >
                    ใช้ภาพนี้
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LABELS MANAGER */}
          {activeTab === 'labels' && (
            <div className="space-y-6">
              {/* Create/Edit Form */}
              <form onSubmit={handleCreateOrUpdateLabel} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {editingLabelId ? '✏️ แก้ไขป้ายกำกับ' : '➕ เพิ่มป้ายกำกับใหม่'}
                  </span>
                  {editingLabelId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLabelId(null);
                        setNewLabelName('');
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="ชื่อป้ายกำกับ เช่น Bug, Urgency, Design..."
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100 font-semibold"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>{editingLabelId ? 'บันทึก' : 'เพิ่ม Label'}</span>
                  </button>
                </div>

                {/* Color Palette */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {LABEL_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setNewLabelColor(c)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-transform flex items-center gap-1 ${
                        newLabelColor.bg === c.bg ? 'ring-2 ring-emerald-500 scale-105' : 'hover:scale-102'
                      }`}
                      style={{ backgroundColor: c.bg, color: c.text }}
                    >
                      {newLabelColor.bg === c.bg && <Check size={12} />}
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </form>

              {/* Existing Labels List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  ป้ายกำกับทั้งหมดในระบบ ({labels.length})
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {labels.map((l) => (
                    <div
                      key={l.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between group shadow-xs"
                    >
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: l.colorBg, color: l.colorText }}
                      >
                        {l.name}
                      </span>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLabelId(l.id);
                            setNewLabelName(l.name);
                            const matchedColor = LABEL_COLORS.find((c) => c.bg === l.colorBg) || { bg: l.colorBg, text: l.colorText, name: 'Custom' };
                            setNewLabelColor(matchedColor);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLabel(l.id)}
                          className="p-1 text-rose-400 hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS & INVITE */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Invite Member Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <UserPlus size={16} />
                  <span>เชิญพนักงานเข้าร่วมบอร์ดงาน (Invite Colleague)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- เลือกพนักงานในองค์กรที่ต้องการเชิญ --</option>
                    {availableUsersToInvite.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) - {u.jobTitle || 'Staff'}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleInviteMember}
                    disabled={!selectedUserId}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>เชิญเข้าบอร์ด</span>
                  </button>
                </div>
              </div>

              {/* Existing Members List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  สมาชิกที่ได้รับสิทธิ์ในบอร์ดนี้ ({currentWorkspace?.members?.length || 0} คน)
                </label>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                  {currentWorkspace?.members?.map((m) => (
                    <div key={m.userId} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user.name)}`}
                          alt={m.user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{m.user.name}</span>
                            {m.role === 'OWNER' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                OWNER
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{m.user.email}</span>
                        </div>
                      </div>

                      {m.userId !== currentWorkspace.ownerId && currentUser?.id === currentWorkspace.ownerId && (
                        <button
                          type="button"
                          onClick={() => removeMember(currentWorkspace.id, m.userId)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        >
                          ลบออก
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DANGER ZONE & EXPORT */}
          {activeTab === 'danger' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    ส่งออกข้อมูลบอร์ด (Export Board Data)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    ดาวน์โหลดข้อมูลการ์ดงานและสถานะทั้งหมดเป็นไฟล์ CSV / Excel
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const btn = document.querySelector('[title*="Export board data"]') as HTMLButtonElement;
                    if (btn) btn.click();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Delete Board */}
              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <AlertTriangle size={16} />
                  <h4 className="text-xs font-bold">ลบบอร์ดงานถาวร (Delete Board)</h4>
                </div>

                <p className="text-[11px] text-rose-600/80 dark:text-rose-300/80 leading-relaxed">
                  การลบบอร์ดนี้จะลบคอลัมน์ การ์ดงาน เอกสารแนบ และคอมเมนต์ทั้งหมดภายในบอร์ดอย่างถาวร และไม่สามารถกู้คืนได้
                </p>

                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleDeleteBoard}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      ยืนยันการลบบอร์ดนี้
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold text-xs hover:bg-rose-200 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>ลบบอร์ดนี้</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <Check size={14} /> บันทึกการเปลี่ยนแปลงแล้ว!
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-sm transition-all"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
