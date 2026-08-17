import React, { useEffect, useState, useRef } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Priority } from '../../types';
import { 
  X, 
  Calendar, 
  Tag, 
  Users, 
  Trash2, 
  Archive,
  MessageSquare, 
  Activity, 
  Clock, 
  Send,
  Image as ImageIcon,
  Maximize2,
  CheckSquare,
  Plus,
  Paperclip,
  Download,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Palette,
  ExternalLink,
  Folder,
  Layers,
  AtSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmModal } from '../common/ConfirmModal';
import { LabelManagerModal } from './LabelManagerModal';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';

const COVER_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#64748b'  // Slate
];

export const CardDetailModal: React.FC = () => {
  const { 
    selectedCardId, 
    setSelectedCardId, 
    updateCard, 
    deleteCard, 
    archiveCard, 
    addComment, 
    addAttachment, 
    deleteAttachment,
    labels 
  } = useBoardStore();
  const { users, currentUser } = useAuthStore();

  const [cardDetails, setCardDetails] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [coverColor, setCoverColor] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'activity'>('comments');
  const [showFileRefMenu, setShowFileRefMenu] = useState(false);

  // Confirmation Popups State
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteCardConfirm, setShowDeleteCardConfirm] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<string | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);

  // Modal Triggers
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);

  const [newChecklistTitle, setNewChecklistTitle] = useState('Checklist');
  const [addingItemChecklistId, setAddingItemChecklistId] = useState<string | null>(null);
  const [newItemContent, setNewItemContent] = useState('');

  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const fetchDetails = async () => {
    if (!selectedCardId) return;
    try {
      const res = await fetch(`/api/cards/${selectedCardId}/details`);
      if (res.ok) {
        const data = await res.json();
        setCardDetails(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setPriority(data.priority);
        setDueDate(data.dueDate ? format(new Date(data.dueDate), 'yyyy-MM-dd') : '');
        setCoverColor(data.coverColor || null);
        setCoverImage(data.coverImage || null);
      }
    } catch (err) {
      console.error('Failed to load card details:', err);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [selectedCardId]);

  if (!selectedCardId || !cardDetails) return null;

  const handleSaveBasic = async () => {
    await updateCard(selectedCardId, {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      coverColor: coverColor || undefined,
      coverImage: coverImage || undefined
    });
  };

  const handleSetCoverColor = async (color: string | null) => {
    setCoverColor(color);
    setCoverImage(null);
    await updateCard(selectedCardId, { coverColor: color || '', coverImage: '' });
    setShowCoverMenu(false);
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setCoverImage(result);
      setCoverColor(null);
      await updateCard(selectedCardId, { coverImage: result, coverColor: '' });
      setShowCoverMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleAssignee = async (userId: string) => {
    const currentAssigneeIds = cardDetails.assignees.map((a: any) => a.userId);
    const newAssigneeIds = currentAssigneeIds.includes(userId)
      ? currentAssigneeIds.filter((id: string) => id !== userId)
      : [...currentAssigneeIds, userId];

    await updateCard(selectedCardId, { assigneeIds: newAssigneeIds });
    fetchDetails();
  };

  const handleToggleLabel = async (labelId: string) => {
    const currentLabelIds = cardDetails.labels.map((l: any) => l.labelId);
    const newLabelIds = currentLabelIds.includes(labelId)
      ? currentLabelIds.filter((id: string) => id !== labelId)
      : [...currentLabelIds, labelId];

    await updateCard(selectedCardId, { labelIds: newLabelIds });
    fetchDetails();
  };

  // Image Upload Handler for Comments
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // File Upload Handler for Card Attachments
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const fileUrl = reader.result as string;
      await addAttachment(selectedCardId, {
        fileName: file.name,
        fileUrl,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        userId: currentUser?.id
      });
      fetchDetails();
    };
    reader.readAsDataURL(file);
  };

  // Google Drive Attachment Handler
  const handleAttachGoogleDrive = async (data: { fileName: string; fileUrl: string; fileType: string; fileSize?: number }) => {
    await addAttachment(selectedCardId, {
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      fileSize: data.fileSize || 0,
      userId: currentUser?.id
    });
    fetchDetails();
  };

  // Insert File Reference into Comment Box
  const handleInsertFileRef = (att: any) => {
    const refSnippet = `[📎 ${att.fileName}](${att.fileUrl}) `;
    setCommentText((prev) => (prev ? `${prev} ${refSnippet}` : refSnippet));
    setShowFileRefMenu(false);
    setActiveTab('comments');
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  // Clipboard Paste Image Handler
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            setAttachedImage(reader.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !attachedImage) return;

    await addComment(selectedCardId, commentText.trim(), attachedImage || undefined);
    setCommentText('');
    setAttachedImage(null);
    if (commentFileInputRef.current) commentFileInputRef.current.value = '';
    fetchDetails();
  };

  // Confirm Actions
  const handleConfirmArchive = async () => {
    setShowArchiveConfirm(false);
    await archiveCard(selectedCardId);
  };

  const handleConfirmDeleteCard = async () => {
    setShowDeleteCardConfirm(false);
    await deleteCard(selectedCardId);
  };

  // ================= CHECKLIST ACTIONS =================

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;

    try {
      const res = await fetch(`/api/cards/${selectedCardId}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newChecklistTitle.trim(),
          userId: currentUser?.id
        })
      });
      if (res.ok) {
        const created = await res.json();
        setCardDetails((prev: any) => ({
          ...prev,
          checklists: [...(prev.checklists || []), created]
        }));
        setNewChecklistTitle('Checklist');
        setShowAddChecklistModal(false);
        useBoardStore.getState().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to create checklist:', err);
    }
  };

  const handleConfirmDeleteChecklist = async () => {
    if (!checklistToDelete) return;
    const chkId = checklistToDelete;
    setChecklistToDelete(null);

    setCardDetails((prev: any) => ({
      ...prev,
      checklists: prev.checklists.filter((c: any) => c.id !== chkId)
    }));

    try {
      await fetch(`/api/cards/${selectedCardId}/checklists/${chkId}`, {
        method: 'DELETE'
      });
      useBoardStore.getState().fetchBoard();
    } catch (err) {
      console.error('Failed to delete checklist:', err);
      fetchDetails();
    }
  };

  const handleAddChecklistItem = async (checklistId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemContent.trim()) return;

    const contentToAdd = newItemContent.trim();
    setNewItemContent('');

    try {
      const res = await fetch(`/api/cards/${selectedCardId}/checklists/${checklistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToAdd })
      });
      if (res.ok) {
        const newItem = await res.json();
        setCardDetails((prev: any) => ({
          ...prev,
          checklists: prev.checklists.map((c: any) =>
            c.id === checklistId ? { ...c, items: [...(c.items || []), newItem] } : c
          )
        }));
        useBoardStore.getState().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to add checklist item:', err);
      fetchDetails();
    }
  };

  const handleToggleChecklistItem = async (checklistId: string, itemId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    setCardDetails((prev: any) => ({
      ...prev,
      checklists: prev.checklists.map((c: any) => {
        if (c.id !== checklistId) return c;
        return {
          ...c,
          items: c.items.map((i: any) => (i.id === itemId ? { ...i, isCompleted: nextStatus } : i))
        };
      })
    }));

    try {
      await fetch(`/api/cards/${selectedCardId}/checklists/${checklistId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: nextStatus })
      });
      useBoardStore.getState().fetchBoard();
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
      fetchDetails();
    }
  };

  const handleDeleteChecklistItem = async (checklistId: string, itemId: string) => {
    setCardDetails((prev: any) => ({
      ...prev,
      checklists: prev.checklists.map((c: any) => {
        if (c.id !== checklistId) return c;
        return {
          ...c,
          items: c.items.filter((i: any) => i.id !== itemId)
        };
      })
    }));

    try {
      await fetch(`/api/cards/${selectedCardId}/checklists/${checklistId}/items/${itemId}`, {
        method: 'DELETE'
      });
      useBoardStore.getState().fetchBoard();
    } catch (err) {
      console.error('Failed to delete checklist item:', err);
      fetchDetails();
    }
  };

  const handleConfirmDeleteAttachment = async () => {
    if (!attachmentToDelete) return;
    const attId = attachmentToDelete;
    setAttachmentToDelete(null);

    await deleteAttachment(selectedCardId, attId);
    fetchDetails();
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isGoogleDriveAttachment = (att: any) => {
    return (
      att.fileType?.startsWith('googledrive') ||
      att.fileUrl?.includes('drive.google.com') ||
      att.fileUrl?.includes('docs.google.com')
    );
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'googledrive/doc') return <FileText size={18} className="text-blue-500" />;
    if (fileType === 'googledrive/sheet') return <FileSpreadsheet size={18} className="text-emerald-500" />;
    if (fileType === 'googledrive/slide') return <Layers size={18} className="text-amber-500" />;
    if (fileType === 'googledrive/folder') return <Folder size={18} className="text-yellow-500" />;
    if (fileType.includes('pdf')) return <FileText size={18} className="text-rose-500" />;
    if (fileType.includes('sheet') || fileType.includes('csv') || fileType.includes('excel'))
      return <FileSpreadsheet size={18} className="text-emerald-500" />;
    if (fileType.includes('zip') || fileType.includes('tar') || fileType.includes('rar'))
      return <FileArchive size={18} className="text-amber-500" />;
    if (fileType.includes('image')) return <ImageIcon size={18} className="text-blue-500" />;
    return <FileText size={18} className="text-neutral-500" />;
  };

  // Helper to render comment text with clickable referenced file links
  const renderCommentContent = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg border border-blue-200/80 dark:border-blue-900/50 shadow-sm transition-colors"
        >
          <ExternalLink size={10} />
          <span>{label}</span>
        </a>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Card Top Cover Banner in Modal */}
          {coverImage ? (
            <div className="relative w-full h-36 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <img src={coverImage} alt="Card Cover" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleSetCoverColor(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors text-xs font-semibold flex items-center gap-1"
              >
                <X size={13} /> Remove Cover
              </button>
            </div>
          ) : coverColor ? (
            <div style={{ backgroundColor: coverColor }} className="relative w-full h-8">
              <button
                type="button"
                onClick={() => handleSetCoverColor(null)}
                className="absolute top-1 right-2 text-white/80 hover:text-white text-[10px] font-bold"
              >
                ✕
              </button>
            </div>
          ) : null}

          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between">
            <div className="flex-1 pr-4">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                in column: {cardDetails.column?.title}
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveBasic}
                className="text-base font-bold text-neutral-900 dark:text-white bg-transparent w-full focus:outline-none border-b border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 py-0.5 mt-0.5"
              />
            </div>
            <button
              onClick={() => setSelectedCardId(null)}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSaveBasic}
                  placeholder="Add detailed task notes, acceptance criteria..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 resize-none leading-relaxed"
                />
              </div>

              {/* Checklists Section */}
              {cardDetails.checklists && cardDetails.checklists.length > 0 && (
                <div className="space-y-4">
                  {cardDetails.checklists.map((chk: any) => {
                    const total = chk.items?.length || 0;
                    const completed = chk.items?.filter((i: any) => i.isCompleted).length || 0;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                      <div key={chk.id} className="bg-neutral-50/80 dark:bg-neutral-950/60 p-4 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 space-y-3 shadow-sm">
                        {/* Checklist Title & Progress */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckSquare size={16} className="text-neutral-700 dark:text-neutral-300" />
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                              {chk.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                              {percent}%
                            </span>
                            <button
                              type="button"
                              onClick={() => setChecklistToDelete(chk.id)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2 py-1 rounded-lg transition-colors"
                              title="Delete this checklist"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full transition-all duration-300 ${
                              percent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                          />
                        </div>

                        {/* Checklist Items List */}
                        <div className="space-y-1.5 pt-1">
                          {chk.items?.map((item: any) => (
                            <div
                              key={item.id}
                              className="group flex items-center justify-between gap-2 p-2 rounded-xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                            >
                              <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={item.isCompleted}
                                  onChange={() => handleToggleChecklistItem(chk.id, item.id, item.isCompleted)}
                                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 dark:text-white focus:ring-0 cursor-pointer"
                                />
                                <span
                                  className={`text-xs ${
                                    item.isCompleted
                                      ? 'line-through text-neutral-400 dark:text-neutral-500'
                                      : 'text-neutral-800 dark:text-neutral-200'
                                  }`}
                                >
                                  {item.content}
                                </span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleDeleteChecklistItem(chk.id, item.id)}
                                className="opacity-60 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all"
                                title="Remove item"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Item Form */}
                        {addingItemChecklistId === chk.id ? (
                          <form onSubmit={(e) => handleAddChecklistItem(chk.id, e)} className="pt-2 space-y-2">
                            <input
                              type="text"
                              autoFocus
                              value={newItemContent}
                              onChange={(e) => setNewItemContent(e.target.value)}
                              placeholder="Add an item..."
                              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                type="submit"
                                disabled={!newItemContent.trim()}
                                className="text-xs font-semibold px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-90 disabled:opacity-50"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingItemChecklistId(null);
                                  setNewItemContent('');
                                }}
                                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingItemChecklistId(chk.id);
                              setNewItemContent('');
                            }}
                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1 pt-1"
                          >
                            <Plus size={13} /> Add an item
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tabs for Comments / Attachments / Activity */}
              <div>
                <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-1.5 text-xs font-semibold pb-1 relative transition-colors ${
                      activeTab === 'comments'
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <MessageSquare size={14} />
                    Comments ({cardDetails.comments?.length || 0})
                    {activeTab === 'comments' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white rounded-full -mb-2" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('attachments')}
                    className={`flex items-center gap-1.5 text-xs font-semibold pb-1 relative transition-colors ${
                      activeTab === 'attachments'
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <Paperclip size={14} />
                    Files ({cardDetails.attachments?.length || 0})
                    {activeTab === 'attachments' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white rounded-full -mb-2" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-1.5 text-xs font-semibold pb-1 relative transition-colors ${
                      activeTab === 'activity'
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <Activity size={14} />
                    Activity History
                    {activeTab === 'activity' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white rounded-full -mb-2" />
                    )}
                  </button>
                </div>

                {/* Tab 1: Comments */}
                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {/* Post Comment Form */}
                    <form onSubmit={handlePostComment} className="space-y-2 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                      <div className="flex gap-2 items-center relative">
                        <input
                          ref={commentInputRef}
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onPaste={handlePaste}
                          placeholder="Write a reply, ask a question, or reference a file..."
                          className="flex-1 text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                        />

                        {/* Reference File Dropdown Trigger */}
                        {cardDetails.attachments && cardDetails.attachments.length > 0 && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowFileRefMenu(!showFileRefMenu)}
                              title="Reference an uploaded file / Google Drive document in comment"
                              className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors shrink-0 flex items-center gap-1 text-xs font-semibold"
                            >
                              <Paperclip size={15} />
                              <span className="text-[11px] hidden sm:inline">Ref File</span>
                            </button>

                            {/* File Ref Menu */}
                            {showFileRefMenu && (
                              <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1 mb-1">
                                  Select file to reference:
                                </p>
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                  {cardDetails.attachments.map((att: any) => (
                                    <button
                                      key={att.id}
                                      type="button"
                                      onClick={() => handleInsertFileRef(att)}
                                      className="w-full text-left p-1.5 rounded-lg text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors truncate"
                                    >
                                      <div className="shrink-0">{getFileIcon(att.fileType)}</div>
                                      <span className="truncate text-neutral-800 dark:text-neutral-200">{att.fileName}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <input
                          ref={commentFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => commentFileInputRef.current?.click()}
                          title="Attach Image"
                          className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
                        >
                          <ImageIcon size={16} />
                        </button>

                        <button
                          type="submit"
                          disabled={!commentText.trim() && !attachedImage}
                          className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity shrink-0 disabled:opacity-40"
                        >
                          <Send size={15} />
                        </button>
                      </div>

                      {attachedImage && (
                        <div className="relative inline-block mt-2">
                          <img
                            src={attachedImage}
                            alt="Attached preview"
                            className="h-20 w-auto rounded-xl object-cover border border-neutral-300 dark:border-neutral-700 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setAttachedImage(null)}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </form>

                    {/* Comment List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {cardDetails.comments?.map((c: any) => (
                        <div key={c.id} className="bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-2xl text-xs space-y-2 border border-neutral-200/60 dark:border-neutral-800">
                          <div className="flex items-center justify-between text-[11px] text-neutral-400">
                            <div className="flex items-center gap-2">
                              <img
                                src={c.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'User')}`}
                                alt={c.user?.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{c.user?.name}</span>
                            </div>
                            <span>{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                          </div>

                          {c.content && (
                            <div className="text-neutral-800 dark:text-neutral-200 leading-relaxed pl-7 break-words">
                              {renderCommentContent(c.content)}
                            </div>
                          )}

                          {c.imageUrl && (
                            <div className="pl-7 pt-1">
                              <div className="relative group inline-block">
                                <img
                                  src={c.imageUrl}
                                  alt="Comment attachment"
                                  onClick={() => setLightboxImage(c.imageUrl)}
                                  className="max-h-48 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm cursor-zoom-in group-hover:opacity-95 transition-opacity"
                                />
                                <button
                                  type="button"
                                  onClick={() => setLightboxImage(c.imageUrl)}
                                  className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Maximize2 size={12} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 2: Document & Google Drive Attachments */}
                {activeTab === 'attachments' && (
                  <div className="space-y-4">
                    {/* Upload / Google Drive buttons */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs text-neutral-500">
                        Upload files or link directly to Google Drive / Docs.
                      </p>
                      
                      <div className="flex items-center gap-2">
                        {/* Google Drive Trigger */}
                        <button
                          type="button"
                          onClick={() => setShowDrivePicker(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 87.3 78" fill="currentColor">
                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                          </svg>
                          <span>Google Drive</span>
                        </button>

                        {/* Local File Upload */}
                        <input
                          ref={attachmentFileInputRef}
                          type="file"
                          onChange={handleAttachmentUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => attachmentFileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity"
                        >
                          <Paperclip size={13} /> Upload File
                        </button>
                      </div>
                    </div>

                    {/* Attachment List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {cardDetails.attachments && cardDetails.attachments.length > 0 ? (
                        cardDetails.attachments.map((att: any) => {
                          const isDrive = isGoogleDriveAttachment(att);

                          return (
                            <div
                              key={att.id}
                              className={`flex items-center justify-between p-3 rounded-xl border ${
                                isDrive
                                  ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/40'
                                  : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                                <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                  {getFileIcon(att.fileType)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                      {att.fileName}
                                    </h5>
                                    {isDrive && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                        Google Drive
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-neutral-400">
                                    {att.fileSize > 0 ? `${formatFileSize(att.fileSize)} • ` : ''}
                                    {format(new Date(att.createdAt), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Ref in Comment Shortcut */}
                                <button
                                  type="button"
                                  onClick={() => handleInsertFileRef(att)}
                                  title="Reference this file in comment / conversation"
                                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-blue-600 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-blue-300 transition-colors shadow-sm"
                                >
                                  <AtSign size={11} />
                                  <span>Ref in Chat</span>
                                </button>

                                {isDrive ? (
                                  <a
                                    href={att.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                                  >
                                    <ExternalLink size={12} />
                                    <span>Open</span>
                                  </a>
                                ) : (
                                  <a
                                    href={att.fileUrl}
                                    download={att.fileName}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                    title="Download Attachment"
                                  >
                                    <Download size={15} />
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setAttachmentToDelete(att.id)}
                                  className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Delete Attachment"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-neutral-400 text-xs">
                          No file attachments uploaded yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Activity History */}
                {activeTab === 'activity' && (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {cardDetails.activities?.map((act: any) => (
                      <div key={act.id} className="flex items-start gap-2.5 text-xs text-neutral-500 py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0">
                        <Clock size={13} className="shrink-0 mt-0.5 text-neutral-400" />
                        <div>
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">{act.user?.name}</span>{' '}
                          <span>{act.actionType.replace('_', ' ').toLowerCase()}</span>{' '}
                          {act.details?.toColumn && <span className="font-medium text-neutral-700 dark:text-neutral-300">to {act.details.toColumn}</span>}
                          {act.details?.title && <span className="font-medium text-neutral-700 dark:text-neutral-300">({act.details.title})</span>}
                          {act.details?.fileName && <span className="font-medium text-neutral-700 dark:text-neutral-300">({act.details.fileName})</span>}
                          {act.details?.hasImage && <span className="text-emerald-600 font-medium">(with image)</span>}
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            {format(new Date(act.createdAt), 'MMM d, HH:mm')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Properties */}
            <div className="space-y-5 bg-neutral-50 dark:bg-neutral-950/60 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80">
              {/* Card Cover Selector Button */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Card Cover
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCoverMenu(!showCoverMenu)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Palette size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{coverImage ? 'Custom Image' : coverColor ? 'Color Strip' : 'No Cover'}</span>
                    </div>
                    {coverColor && <div style={{ backgroundColor: coverColor }} className="w-3.5 h-3.5 rounded-full" />}
                  </button>

                  {/* Cover Palette Dropdown */}
                  {showCoverMenu && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 shadow-2xl z-50 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Color Palette</span>
                        <button
                          type="button"
                          onClick={() => handleSetCoverColor(null)}
                          className="text-[10px] text-rose-500 font-bold hover:underline"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5">
                        {COVER_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleSetCoverColor(c)}
                            style={{ backgroundColor: c }}
                            className={`h-6 rounded-lg transition-transform ${
                              coverColor === c ? 'ring-2 ring-neutral-900 dark:ring-white scale-110' : 'hover:opacity-90'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <input
                          ref={coverImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => coverImageInputRef.current?.click()}
                          className="w-full py-1.5 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 flex items-center justify-center gap-1.5"
                        >
                          <ImageIcon size={12} /> Upload Image Cover
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Add to Card actions */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Add to Card
                </label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddChecklistModal(true)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm transition-all"
                  >
                    <CheckSquare size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Add Checklist / To-Do</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDrivePicker(true)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-xs font-semibold text-blue-600 dark:text-blue-400 shadow-sm transition-all"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 87.3 78" fill="currentColor">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                    <span>Attach from Google Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => attachmentFileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm transition-all"
                  >
                    <Paperclip size={14} className="text-neutral-500" />
                    <span>Upload Local File</span>
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value as Priority);
                    updateCard(selectedCardId, { priority: e.target.value as Priority });
                  }}
                  className="w-full text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 text-neutral-800 dark:text-neutral-200 focus:outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
                  <Calendar size={13} /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    updateCard(selectedCardId, {
                      dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                    });
                  }}
                  className="w-full text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 text-neutral-800 dark:text-neutral-200 focus:outline-none"
                />
              </div>

              {/* Assignees */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1">
                  <Users size={13} /> Assignees
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  {users.map((u) => {
                    const isAssigned = cardDetails.assignees?.some((a: any) => a.userId === u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleToggleAssignee(u.id)}
                        className={`w-full flex items-center justify-between p-1.5 rounded text-xs transition-colors ${
                          isAssigned
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <span className="truncate">{u.name}</span>
                        {isAssigned && <span className="text-[10px] font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Labels with Manage Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <Tag size={13} /> Labels
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLabelManager(true)}
                    className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
                  >
                    + Manage
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {labels.map((lbl) => {
                    const hasLabel = cardDetails.labels?.some((l: any) => l.labelId === lbl.id);
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => handleToggleLabel(lbl.id)}
                        style={{
                          backgroundColor: hasLabel ? lbl.colorText : lbl.colorBg,
                          color: hasLabel ? '#ffffff' : lbl.colorText
                        }}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                          hasLabel ? 'ring-2 ring-neutral-400' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {lbl.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions: Archive & Delete */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowArchiveConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 p-2 rounded-xl transition-colors font-semibold"
                >
                  <Archive size={14} /> Archive Card (ย้ายเข้าคลัง)
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteCardConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 rounded-xl transition-colors font-medium"
                >
                  <Trash2 size={14} /> Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Archive Card */}
      <ConfirmModal
        isOpen={showArchiveConfirm}
        type="warning"
        title="Archive Card"
        message={`Are you sure you want to archive "${cardDetails.title}"? The card will be hidden from the active board, but you can restore it anytime from Archived Items.`}
        confirmText="Archive Card"
        cancelText="Cancel"
        onConfirm={handleConfirmArchive}
        onCancel={() => setShowArchiveConfirm(false)}
      />

      {/* Confirmation Modal for Delete Card Permanently */}
      <ConfirmModal
        isOpen={showDeleteCardConfirm}
        type="danger"
        title="Delete Card Permanently"
        message={`Are you sure you want to delete "${cardDetails.title}"? All checklists, attachments, comments, and activity logs will be permanently deleted. This action cannot be undone.`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteCard}
        onCancel={() => setShowDeleteCardConfirm(false)}
      />

      {/* Confirmation Modal for Delete Checklist */}
      <ConfirmModal
        isOpen={Boolean(checklistToDelete)}
        type="danger"
        title="Delete Checklist"
        message="Are you sure you want to delete this checklist and all its items? This action cannot be undone."
        confirmText="Delete Checklist"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteChecklist}
        onCancel={() => setChecklistToDelete(null)}
      />

      {/* Confirmation Modal for Delete Attachment */}
      <ConfirmModal
        isOpen={Boolean(attachmentToDelete)}
        type="danger"
        title="Delete File Attachment"
        message="Are you sure you want to delete this attachment? This cannot be undone."
        confirmText="Delete File"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteAttachment}
        onCancel={() => setAttachmentToDelete(null)}
      />

      {/* Label Manager Modal */}
      <LabelManagerModal
        isOpen={showLabelManager}
        onClose={() => {
          setShowLabelManager(false);
          fetchDetails();
        }}
      />

      {/* Google Drive Picker Modal */}
      <GoogleDrivePickerModal
        isOpen={showDrivePicker}
        onClose={() => setShowDrivePicker(false)}
        onAttach={handleAttachGoogleDrive}
      />

      {/* Add Checklist Modal */}
      {showAddChecklistModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-sm p-5 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <CheckSquare size={14} /> Add Checklist
              </h3>
              <button
                type="button"
                onClick={() => setShowAddChecklistModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateChecklist} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="e.g. QA Checklist, Acceptance Criteria..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChecklistModal(false)}
                  className="text-xs px-3 py-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newChecklistTitle.trim()}
                  className="text-xs font-semibold px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  Add Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-100"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Zoomed attachment"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-neutral-900 text-white rounded-full border border-neutral-700 hover:bg-neutral-800 shadow"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
