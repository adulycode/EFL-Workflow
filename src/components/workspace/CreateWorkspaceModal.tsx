import React, { useState } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { X, Plus, Sparkles } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const EMOJI_ICONS = ['💼', '🚀', '🎨', '⚙️', '📊', '⚡', '🌟', '🎯', '💡', '🔥'];
const PALETTE_COLORS = ['#16a34a', '#2563eb', '#9333ea', '#ea580c', '#e11d48', '#0d9488'];

export const CreateWorkspaceModal: React.FC<Props> = ({ onClose }) => {
  const { createWorkspace } = useWorkspaceStore();
  const { currentUser } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('💼');
  const [color, setColor] = useState('#16a34a');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentUser) return;

    setIsSubmitting(true);
    const result = await createWorkspace({
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      ownerId: currentUser.id
    });

    setIsSubmitting(false);
    if (result) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Create New Workspace
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                A shared space for projects, boards, and team members
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Workspace Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Workspace Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Team, Design System, Product Lab..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this workspace be used for?"
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none resize-none"
            />
          </div>

          {/* Icon & Color Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Icon
              </label>
              <div className="flex flex-wrap gap-1.5 bg-neutral-50 dark:bg-neutral-950 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                {EMOJI_ICONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setIcon(em)}
                    className={`h-7 w-7 text-sm rounded-md flex items-center justify-center transition-all ${
                      icon === em
                        ? 'bg-neutral-200 dark:bg-neutral-800 scale-110 shadow-sm'
                        : 'opacity-70 hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Theme Color
              </label>
              <div className="flex flex-wrap gap-1.5 bg-neutral-50 dark:bg-neutral-950 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`h-7 w-7 rounded-md transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white scale-105' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="text-xs font-semibold px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus size={14} /> Create Space
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
