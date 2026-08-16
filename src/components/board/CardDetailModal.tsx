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
  MessageSquare, 
  Activity, 
  Clock, 
  Send,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';
import { format } from 'date-fns';

export const CardDetailModal: React.FC = () => {
  const { selectedCardId, setSelectedCardId, updateCard, deleteCard, addComment, labels } = useBoardStore();
  const { users, currentUser } = useAuthStore();

  const [cardDetails, setCardDetails] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [commentText, setCommentText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
    });
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

  // Image Upload / Attachment Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchDetails();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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

              {/* Comments / Activity Tabs */}
              <div>
                <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                  <button
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

                {activeTab === 'comments' ? (
                  <div className="space-y-4">
                    {/* Post Comment Form with Image Attachment */}
                    <form onSubmit={handlePostComment} className="space-y-2 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onPaste={handlePaste}
                          placeholder="Write a reply or paste/attach an image..."
                          className="flex-1 text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                        />

                        {/* Hidden File Input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />

                        {/* Attach Image Button */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          title="Attach Image"
                          className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
                        >
                          <ImageIcon size={16} />
                        </button>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={!commentText.trim() && !attachedImage}
                          className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity shrink-0 disabled:opacity-40"
                        >
                          <Send size={15} />
                        </button>
                      </div>

                      {/* Image Preview before Sending */}
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
                            <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed pl-7">
                              {c.content}
                            </p>
                          )}

                          {/* Attached Image Render with Lightbox Zoom */}
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
                ) : (
                  /* Activity Log Feed */
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {cardDetails.activities?.map((act: any) => (
                      <div key={act.id} className="flex items-start gap-2.5 text-xs text-neutral-500 py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0">
                        <Clock size={13} className="shrink-0 mt-0.5 text-neutral-400" />
                        <div>
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">{act.user?.name}</span>{' '}
                          <span>{act.actionType.replace('_', ' ').toLowerCase()}</span>{' '}
                          {act.details?.toColumn && <span className="font-medium text-neutral-700 dark:text-neutral-300">to {act.details.toColumn}</span>}
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

              {/* Assignees (Team of 20) */}
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

              {/* Labels */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1">
                  <Tag size={13} /> Labels
                </label>
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

              {/* Delete Card Button */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => deleteCard(selectedCardId)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 rounded-lg transition-colors font-medium"
                >
                  <Trash2 size={14} /> Delete Card
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
