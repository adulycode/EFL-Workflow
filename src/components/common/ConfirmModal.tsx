import React from 'react';
import { AlertTriangle, Archive, Trash2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  type?: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  type = 'danger',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-sm p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3 rounded-2xl shrink-0 ${
              type === 'danger'
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                : type === 'warning'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
            }`}
          >
            {type === 'danger' ? (
              <Trash2 size={20} />
            ) : type === 'warning' ? (
              <Archive size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
              type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
