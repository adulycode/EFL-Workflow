import React, { useState } from 'react';
import { X, Link2, FileText, FileSpreadsheet, Layers, Folder, Check, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (data: { fileName: string; fileUrl: string; fileType: string; fileSize?: number }) => void;
}

export const GoogleDrivePickerModal: React.FC<Props> = ({ isOpen, onClose, onAttach }) => {
  const [driveUrl, setDriveUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [detectedType, setDetectedType] = useState<string>('googledrive/file');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUrlChange = (val: string) => {
    setDriveUrl(val);
    setError('');

    // Auto-detect Google Drive file type from URL
    if (val.includes('docs.google.com/document')) {
      setDetectedType('googledrive/doc');
      if (!customTitle) setCustomTitle('Google Docs Document');
    } else if (val.includes('docs.google.com/spreadsheets')) {
      setDetectedType('googledrive/sheet');
      if (!customTitle) setCustomTitle('Google Sheets Spreadsheet');
    } else if (val.includes('docs.google.com/presentation')) {
      setDetectedType('googledrive/slide');
      if (!customTitle) setCustomTitle('Google Slides Presentation');
    } else if (val.includes('drive.google.com/drive/folders')) {
      setDetectedType('googledrive/folder');
      if (!customTitle) setCustomTitle('Google Drive Folder');
    } else if (val.includes('drive.google.com') || val.includes('docs.google.com')) {
      setDetectedType('googledrive/file');
      if (!customTitle) setCustomTitle('Google Drive File');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) {
      setError('Please enter a valid Google Drive link');
      return;
    }

    const title = customTitle.trim() || 'Google Drive File';
    onAttach({
      fileName: title,
      fileUrl: driveUrl.trim(),
      fileType: detectedType,
      fileSize: 0
    });

    setDriveUrl('');
    setCustomTitle('');
    onClose();
  };

  const getTypeIcon = () => {
    if (detectedType === 'googledrive/doc') return <FileText size={20} className="text-blue-500" />;
    if (detectedType === 'googledrive/sheet') return <FileSpreadsheet size={20} className="text-emerald-500" />;
    if (detectedType === 'googledrive/slide') return <Layers size={20} className="text-amber-500" />;
    if (detectedType === 'googledrive/folder') return <Folder size={20} className="text-yellow-500" />;
    return <Link2 size={20} className="text-indigo-500" />;
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" viewBox="0 0 87.3 78" fill="currentColor">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Attach from Google Drive
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Attach Docs, Sheets, Slides, or Drive files
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Google Drive / Docs / Sheets Share Link:
            </label>
            <input
              type="url"
              autoFocus
              value={driveUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/... or drive.google.com/..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            {error && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Document Display Name:
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Q3 Sprint Budget Sheet, Product Spec Doc..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Type Detection Preview */}
          {driveUrl && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800">
              <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                {getTypeIcon()}
              </div>
              <div className="text-xs">
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {customTitle || 'Google Drive Attachment'}
                </span>
                <p className="text-[10px] text-neutral-400 capitalize">
                  {detectedType.replace('googledrive/', 'Google ')}
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!driveUrl.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              <Check size={14} /> Attach Drive Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
