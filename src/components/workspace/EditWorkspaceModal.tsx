import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Workspace } from '../../types';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { X, Save, Palette, Smile } from 'lucide-react';

interface Props {
  workspace: Workspace;
  onClose: () => void;
}

const EMOJI_ICONS = [
  '💼', '🚀', '🎨', '⚙️', '📊', '⚡', '🌟', '🎯', '💡', '🔥',
  '💻', '🛠️', '🔧', '🏢', '📚', '🏆', '☕', '🌐', '🤖', '📦',
  '📝', '📋', '📁', '💡', '🔒', '🔔', '✨', '⭐', '🌈', '🎉'
];

const PALETTE_COLORS = [
  '#16a34a', // Emerald
  '#2563eb', // Blue
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#e11d48', // Rose
  '#0d9488', // Teal
  '#d97706', // Amber
  '#4f46e5', // Indigo
  '#475569', // Slate
  '#0284c7'  // Sky
];

export const EditWorkspaceModal: React.FC<Props> = ({ workspace, onClose }) => {
  const { updateWorkspace } = useWorkspaceStore();

  const [name, setName] = useState(workspace.name || '');
  const [description, setDescription] = useState(workspace.description || '');
  const [icon, setIcon] = useState(workspace.icon || '📁');
  const [color, setColor] = useState(workspace.color || '#16a34a');
  const [customEmoji, setCustomEmoji] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const result = await updateWorkspace(workspace.id, {
      name: name.trim(),
      description: description.trim(),
      icon: (icon || '📁').trim(),
      color
    });

    setIsSubmitting(false);
    if (result) {
      onClose();
    }
  };

  const handleCustomEmojiChange = (val: string) => {
    setCustomEmoji(val);
    if (val.trim()) {
      setIcon(val.trim());
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${color}18`, borderColor: color }}
              className="h-10 w-10 rounded-2xl flex items-center justify-center text-xl border shadow-inner shrink-0"
            >
              {icon}
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <span>แก้ไขข้อมูล Workspace</span>
                <span className="text-[11px] font-normal text-neutral-400">({workspace.name})</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                เปลี่ยนไอคอน สีธีม ชื่อ หรือคำอธิบายของพื้นที่ทำงานนี้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Workspace Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              ชื่อ Workspace *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maintenance & IT, Marketing Team..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-500/50 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              คำอธิบาย (Description)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="วัตถุประสงค์หรือหน้าที่ของพื้นที่ทำงานนี้..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-500/50 transition-all resize-none"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Smile size={13} className="text-neutral-400" />
                <span>เลือกไอคอน (Icon / Emoji)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-neutral-400">พิมพ์อิโมจิเอง:</span>
                <input
                  type="text"
                  maxLength={4}
                  value={customEmoji}
                  onChange={(e) => handleCustomEmojiChange(e.target.value)}
                  placeholder="เช่น 🚀"
                  className="w-16 text-center text-xs px-2 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto bg-neutral-50 dark:bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
              {EMOJI_ICONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setIcon(em);
                    setCustomEmoji('');
                  }}
                  className={`h-8 w-8 text-base rounded-lg flex items-center justify-center transition-all ${
                    icon === em
                      ? 'bg-white dark:bg-neutral-800 shadow-md scale-110 ring-2 ring-emerald-500 font-bold'
                      : 'opacity-75 hover:opacity-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 hover:scale-105'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Palette size={13} className="text-neutral-400" />
                <span>สีธีม (Theme Color)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-neutral-400">เลือกสีเอง:</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-6 w-8 rounded cursor-pointer border border-neutral-300 dark:border-neutral-700 bg-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 bg-neutral-50 dark:bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-7 w-7 rounded-lg transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white scale-110 shadow-sm' : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="bg-neutral-50 dark:bg-neutral-950/50 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3">
            <div
              style={{ backgroundColor: `${color}18`, borderColor: color }}
              className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl border shadow-sm shrink-0"
            >
              {icon}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">
                ตัวอย่างการแสดงผล (Live Preview)
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                {name || 'ชื่อ Workspace'}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {description || 'คำอธิบายพื้นที่ทำงาน'}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium transition-colors"
            >
              ยกเลิก (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="text-xs font-semibold px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={14} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง (Save)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
