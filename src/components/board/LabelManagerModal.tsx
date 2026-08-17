import React, { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { X, Tag, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { Label } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { bg: '#fee2e2', text: '#dc2626', name: 'Red' },
  { bg: '#dcfce7', text: '#16a34a', name: 'Green' },
  { bg: '#e0f2fe', text: '#0284c7', name: 'Blue' },
  { bg: '#f3e8ff', text: '#9333ea', name: 'Purple' },
  { bg: '#ffedd5', text: '#ea580c', name: 'Orange' },
  { bg: '#fef3c7', text: '#d97706', name: 'Amber' },
  { bg: '#ccfbf1', text: '#0d9488', name: 'Teal' },
  { bg: '#fce7f3', text: '#db2777', name: 'Pink' },
  { bg: '#f1f5f9', text: '#475569', name: 'Slate' },
  { bg: '#312e81', text: '#e0e7ff', name: 'Dark Indigo' }
];

export const LabelManagerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { labels, createLabel, updateLabel, deleteLabel } = useBoardStore();

  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await createLabel(newName.trim(), selectedColor.bg, selectedColor.text);
    setNewName('');
  };

  const handleStartEdit = (label: Label) => {
    setEditingLabelId(label.id);
    setEditName(label.name);
    const found = PRESET_COLORS.find((c) => c.bg === label.colorBg) || {
      bg: label.colorBg,
      text: label.colorText,
      name: 'Custom'
    };
    setEditColor(found);
  };

  const handleSaveEdit = async () => {
    if (!editingLabelId || !editName.trim()) return;
    await updateLabel(editingLabelId, {
      name: editName.trim(),
      colorBg: editColor.bg,
      colorText: editColor.text
    });
    setEditingLabelId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md max-h-[85vh] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Tag size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Manage Labels (จัดการป้ายกำกับ)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Create and customize workspace tags
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create New Label Form */}
          <form onSubmit={handleCreate} className="bg-neutral-50 dark:bg-neutral-950/50 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-3">
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              + Create New Label
            </h3>

            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Label name (e.g. Hotfix, Marketing, Backend)..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            />

            {/* Color Presets */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5">
                Select Color:
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    style={{ backgroundColor: c.bg, color: c.text }}
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                      selectedColor.bg === c.bg ? 'ring-2 ring-neutral-900 dark:ring-white scale-105 shadow-sm' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview & Add Button */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
              <span
                style={{ backgroundColor: selectedColor.bg, color: selectedColor.text }}
                className="text-xs font-bold px-3 py-1 rounded-md"
              >
                {newName.trim() || 'Label Preview'}
              </span>

              <button
                type="submit"
                disabled={!newName.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:opacity-90 disabled:opacity-40 shadow-sm"
              >
                <Plus size={14} /> Add Label
              </button>
            </div>
          </form>

          {/* Current Labels List */}
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-3">
              Existing Labels ({labels.length})
            </h3>

            <div className="space-y-2">
              {labels.map((lbl) => (
                <div
                  key={lbl.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                >
                  {editingLabelId === lbl.id ? (
                    <div className="flex-1 space-y-2 mr-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setEditColor(c)}
                            style={{ backgroundColor: c.bg, color: c.text }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              editColor.bg === c.bg ? 'ring-2 ring-neutral-900 dark:ring-white' : ''
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="text-[11px] font-bold px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingLabelId(null)}
                          className="text-[11px] text-neutral-500 hover:text-neutral-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span
                        style={{ backgroundColor: lbl.colorBg, color: lbl.colorText }}
                        className="text-xs font-semibold px-3 py-1 rounded-md"
                      >
                        {lbl.name}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(lbl)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          title="Edit Label"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete label "${lbl.name}"?`)) {
                              deleteLabel(lbl.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Label"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
