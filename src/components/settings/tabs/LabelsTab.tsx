import React, { useState } from 'react';
import { useBoardStore } from '../../../store/useBoardStore';
import { Label } from '../../../types';
import { Tag, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

const PRESET_COLORS = [
  { bg: '#ef4444', text: '#ffffff', name: 'Red' },
  { bg: '#f97316', text: '#ffffff', name: 'Orange' },
  { bg: '#f59e0b', text: '#000000', name: 'Amber' },
  { bg: '#10b981', text: '#ffffff', name: 'Emerald' },
  { bg: '#06b6d4', text: '#ffffff', name: 'Cyan' },
  { bg: '#3b82f6', text: '#ffffff', name: 'Blue' },
  { bg: '#6366f1', text: '#ffffff', name: 'Indigo' },
  { bg: '#a855f7', text: '#ffffff', name: 'Purple' },
  { bg: '#ec4899', text: '#ffffff', name: 'Pink' },
  { bg: '#64748b', text: '#ffffff', name: 'Slate' }
];

export const LabelsTab: React.FC = () => {
  const { labels, createLabel, updateLabel, deleteLabel } = useBoardStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [colorBg, setColorBg] = useState('#10b981');
  const [colorText, setColorText] = useState('#ffffff');

  const startCreate = () => {
    setName('');
    setColorBg('#10b981');
    setColorText('#ffffff');
    setIsCreating(true);
    setEditingLabelId(null);
  };

  const startEdit = (label: Label) => {
    setEditingLabelId(label.id);
    setName(label.name);
    setColorBg(label.colorBg);
    setColorText(label.colorText);
    setIsCreating(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingLabelId) {
      await updateLabel(editingLabelId, { name: name.trim(), colorBg, colorText });
      setEditingLabelId(null);
    } else {
      await createLabel(name.trim(), colorBg, colorText);
      setIsCreating(false);
    }

    setName('');
  };

  return (
    <div className="space-y-5">
      {/* Header with Title & Add Label Button */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Custom Labels & Categories (จัดการป้ายกำกับประจำบอร์ด)
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            สร้างและแก้ไขแท็กสีสำหรับจำแนกประเภทการ์ดงาน
          </p>
        </div>

        {!isCreating && !editingLabelId && (
          <button
            type="button"
            onClick={startCreate}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Create Label</span>
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      {(isCreating || editingLabelId) && (
        <form onSubmit={handleSave} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Tag size={13} className="text-emerald-500" />
              <span>{editingLabelId ? 'Edit Label' : 'Create New Label'}</span>
            </h5>

            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingLabelId(null);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={15} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Label Title (ชื่อป้ายกำกับ)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Design, High Priority, Backend, Bug"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Color Palettes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Color Palette (เลือกสีป้าย)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setColorBg(c.bg);
                    setColorText(c.text);
                  }}
                  className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                    colorBg === c.bg ? 'border-slate-900 dark:border-white shadow-md scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.bg }}
                >
                  {colorBg === c.bg && <Check size={13} color={c.text} />}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Live Preview:
            </span>
            <div className="inline-block px-3 py-1 rounded-lg text-xs font-bold shadow-sm" style={{ backgroundColor: colorBg, color: colorText }}>
              {name || 'Label Preview'}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingLabelId(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
            >
              {editingLabelId ? 'Update Label' : 'Save Label'}
            </button>
          </div>
        </form>
      )}

      {/* Existing Labels List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800">
        {labels.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No labels created yet. Click "Create Label" above to add one.
          </div>
        ) : (
          labels.map((label: Label) => (
            <div
              key={label.id}
              className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              {/* Badge Preview */}
              <div className="flex items-center gap-3">
                <div
                  className="px-3 py-1 rounded-lg text-xs font-bold shadow-sm min-w-[80px] text-center"
                  style={{ backgroundColor: label.colorBg, color: label.colorText }}
                >
                  {label.name}
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {label.colorBg}
                </span>
              </div>

              {/* Edit / Delete Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(label)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Label"
                >
                  <Edit2 size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete label "${label.name}"?`)) {
                      deleteLabel(label.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete Label"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
