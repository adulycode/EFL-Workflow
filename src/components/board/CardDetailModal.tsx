import React, { useEffect, useState, useRef } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
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
  AtSign,
  Smile,
  Mail,
  UserCheck,
  Sparkles,
  Image as CoverIcon,
  Pencil,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmModal } from '../common/ConfirmModal';
import { LabelManagerModal } from './LabelManagerModal';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import { SlashCommandMenu, SlashCommand } from '../common/SlashCommandMenu';
import { DueDatePicker } from '../common/DueDatePicker';

const POPULAR_CARD_ICONS = [
  '📝', '📌', '🚀', '💡', '🔥', '✨', '🎯', '📊', '📈', '🛠️', 
  '⚡', '🔍', '🐛', '🎨', '💻', '📅', '🏆', '📁', '🔒', '💬',
  '🤖', '💼', '⭐', '❤️', '✅', '⚠️', '🎉', '☕', '🌟', '📚'
];

const CURATED_COVER_BANNERS = [
  { name: 'Emerald Forest', value: 'linear-gradient(135deg, #047857 0%, #10b981 100%)' },
  { name: 'Cosmic Indigo', value: 'linear-gradient(135deg, #4338ca 0%, #818cf8 100%)' },
  { name: 'Rose Sunset', value: 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)' },
  { name: 'Ocean Blue', value: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' },
  { name: 'Amber Glow', value: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)' },
  { name: 'Purple Dream', value: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)' },
  { name: 'Abstract Mesh', value: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800' },
  { name: 'Modern Minimalist', value: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800' },
  { name: 'Blue Ocean', value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
  { name: 'Tech Circuit', value: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800' }
];

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

const EMOJI_CATEGORIES = [
  {
    name: 'Top Reactions',
    emojis: ['👍', '❤️', '🔥', '🎉', '🚀', '👀', '💯', '👏', '🙏', '✨', '💡', '✅', '❌', '⚠️', '⭐', '🙌']
  },
  {
    name: 'Smileys & Expressions',
    emojis: ['😀', '😄', '😂', '🤣', '😊', '😍', '🥰', '😘', '😋', '😜', '🤩', '🥳', '😎', '🤓', '🤔', '🤫', '🤭', '😳', '🥺', '😭', '🤯', '😴', '💪', '🤝']
  },
  {
    name: 'Work, Tasks & Status',
    emojis: ['📌', '📍', '📝', '📋', '📊', '📈', '📉', '📅', '📆', '⏳', '⌛', '⏰', '🎯', '🛠️', '⚙️', '🔧', '📦', '🏷️', '🔒', '🔑', '💬', '📢', '🔔', '📁', '📄', '📎', '💻', '🔍', '🏆', '⚡']
  }
];

export const CardDetailModal: React.FC = () => {
  const { 
    selectedCardId, 
    setSelectedCardId, 
    updateCard, 
    deleteCard, 
    archiveCard, 
    addComment, 
    updateComment,
    deleteComment,
    addAttachment, 
    deleteAttachment,
    labels 
  } = useBoardStore();
  const { users, currentUser } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();

  const [cardDetails, setCardDetails] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [coverColor, setCoverColor] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [icon, setIcon] = useState<string>('📝');
  const [coverBanner, setCoverBanner] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'activity'>('comments');
  const [showFileRefMenu, setShowFileRefMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiTab, setSelectedEmojiTab] = useState(0);

  // Comment Editing and Deleting State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isSavingCommentEdit, setIsSavingCommentEdit] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Notion-Style Features State
  const [showCardIconPicker, setShowCardIconPicker] = useState(false);
  const [showBannerGallery, setShowBannerGallery] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashPosition, setSlashPosition] = useState<{ top: number; left: number } | undefined>(undefined);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

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
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

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
        setDueDate(data.dueDate || '');
        setCoverColor(data.coverColor || null);
        setCoverImage(data.coverImage || null);
        setIcon(data.icon || '📝');
        setCoverBanner(data.coverBanner || null);
      }
    } catch (err) {
      console.error('Failed to load card details:', err);
    }
  };

  useEffect(() => {
    fetchDetails();

    const handleRealtimeUpdate = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.cardId === selectedCardId || detail.id === selectedCardId) {
        fetchDetails();
      }
    };

    window.addEventListener('realtime:comment_added', handleRealtimeUpdate);
    window.addEventListener('realtime:card_updated', handleRealtimeUpdate);

    return () => {
      window.removeEventListener('realtime:comment_added', handleRealtimeUpdate);
      window.removeEventListener('realtime:card_updated', handleRealtimeUpdate);
    };
  }, [selectedCardId]);

  if (!selectedCardId || !cardDetails) return null;

  const handleSaveBasic = async () => {
    await updateCard(selectedCardId, {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      coverColor: coverColor || undefined,
      coverImage: coverImage || undefined,
      icon,
      coverBanner: coverBanner || undefined
    });
  };

  const handleSelectIcon = async (newIcon: string) => {
    setIcon(newIcon);
    setShowCardIconPicker(false);
    await updateCard(selectedCardId, { icon: newIcon });
    fetchDetails();
  };

  const handleSelectCoverBanner = async (newBanner: string | null) => {
    setCoverBanner(newBanner);
    setShowBannerGallery(false);
    await updateCard(selectedCardId, { coverBanner: newBanner || '' });
    fetchDetails();
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1 && (lastSlashIndex === 0 || textBeforeCursor[lastSlashIndex - 1] === '\n' || textBeforeCursor[lastSlashIndex - 1] === ' ')) {
      const query = textBeforeCursor.slice(lastSlashIndex + 1);
      if (!query.includes('\n') && !query.includes(' ')) {
        setSlashQuery(query);
        setShowSlashMenu(true);
        return;
      }
    }
    setShowSlashMenu(false);
  };

  const handleSelectSlashCommand = (cmd: SlashCommand) => {
    if (!descriptionTextareaRef.current) return;
    const textarea = descriptionTextareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = description.slice(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
      const newText = description.slice(0, lastSlashIndex) + cmd.insertText + description.slice(cursorPos);
      setDescription(newText);
      setShowSlashMenu(false);
      updateCard(selectedCardId, { description: newText });
      setTimeout(() => {
        textarea.focus();
        const nextPos = lastSlashIndex + cmd.insertText.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 50);
    }
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

  const handleToggleStakeholder = async (userId: string, type: 'ASSIGNEE' | 'REPORT_TO' | 'FYI') => {
    const currentAssignees = cardDetails.assignees || [];
    const isCurrentlyAdded = currentAssignees.some(
      (a: any) => a.userId === userId && (a.type || 'ASSIGNEE') === type
    );

    let newAssigneesData: Array<{ userId: string; type: string }>;
    if (isCurrentlyAdded) {
      // Unselect from this role
      newAssigneesData = currentAssignees
        .filter((a: any) => !(a.userId === userId && (a.type || 'ASSIGNEE') === type))
        .map((a: any) => ({ userId: a.userId, type: a.type || 'ASSIGNEE' }));
    } else {
      // Assign new role and automatically remove any other role for this user (prevent duplicate avatars & conflicting roles)
      newAssigneesData = [
        ...currentAssignees
          .filter((a: any) => a.userId !== userId)
          .map((a: any) => ({ userId: a.userId, type: a.type || 'ASSIGNEE' })),
        { userId, type }
      ];
    }

    await updateCard(selectedCardId, { assigneesData: newAssigneesData });
    fetchDetails();
  };

  const handleToggleAssignee = (userId: string) => handleToggleStakeholder(userId, 'ASSIGNEE');

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
    const refSnippet = `[📎 ${att.fileName}](att:${att.id}) `;
    setCommentText((prev) => (prev ? `${prev} ${refSnippet}` : refSnippet));
    setShowFileRefMenu(false);
    setActiveTab('comments');
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  // Insert Emoji into Comment Box
  const handleInsertEmoji = (emoji: string) => {
    const textarea = commentInputRef.current;
    if (!textarea) {
      setCommentText((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart ?? commentText.length;
    const end = textarea.selectionEnd ?? commentText.length;
    const newText = commentText.substring(0, start) + emoji + commentText.substring(end);
    setCommentText(newText);
    setTimeout(() => {
      textarea.focus();
      const cursor = start + emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 10);
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

    await addComment(selectedCardId, commentText.trim(), attachedImage || undefined, currentUser?.id);
    setCommentText('');
    setAttachedImage(null);
    if (commentFileInputRef.current) commentFileInputRef.current.value = '';
    fetchDetails();
  };

  const handleStartEditComment = (c: any) => {
    setEditingCommentId(c.id);
    setEditingCommentText(c.content || '');
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    setIsSavingCommentEdit(true);
    const success = await updateComment(selectedCardId, commentId, editingCommentText.trim(), currentUser?.id);
    setIsSavingCommentEdit(false);
    if (success) {
      setCardDetails((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments?.map((c: any) =>
            c.id === commentId ? { ...c, content: editingCommentText.trim(), updatedAt: new Date().toISOString() } : c
          )
        };
      });
      setEditingCommentId(null);
      setEditingCommentText('');
    }
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentToDelete) return;
    const targetId = commentToDelete;
    setCommentToDelete(null);
    const success = await deleteComment(selectedCardId, targetId, currentUser?.id);
    if (success) {
      setCardDetails((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments?.filter((c: any) => c.id !== targetId)
        };
      });
    }
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
    const nowIso = nextStatus ? new Date().toISOString() : null;

    setCardDetails((prev: any) => ({
      ...prev,
      checklists: prev.checklists.map((c: any) => {
        if (c.id !== checklistId) return c;
        return {
          ...c,
          items: c.items.map((i: any) =>
            i.id === itemId ? { ...i, isCompleted: nextStatus, completedAt: nowIso } : i
          )
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

  // Helper to render comment text with clickable referenced file links (clean badge without long URLs)
  const renderCommentContent = (content: string) => {
    // 1. Sanitize any accidentally pasted raw base64 data URLs in comments
    const sanitized = content
      .replace(/\(data:[A-Za-z-+\/0-9.]+;base64,[A-Za-z0-9+/=]+\)/g, '')
      .replace(/data:[A-Za-z-+\/0-9.]+;base64,[A-Za-z0-9+/=]{50,}/g, '');

    // 2. Parse markdown link tokens: [label](target)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(sanitized)) !== null) {
      if (match.index > lastIndex) {
        parts.push(sanitized.substring(lastIndex, match.index));
      }

      const label = match[1];
      const target = match[2];

      // Resolve attachment if using att:id or url
      let fileUrl = target;
      let displayName = label.replace(/^[📎📄📊📽️📁]\s*/, '');

      if (target.startsWith('att:')) {
        const attId = target.slice(4);
        const foundAtt = cardDetails.attachments?.find((a: any) => a.id === attId);
        if (foundAtt) {
          fileUrl = foundAtt.fileUrl;
          displayName = foundAtt.fileName;
        }
      } else if (target.startsWith('data:')) {
        const foundAtt = cardDetails.attachments?.find((a: any) => a.fileName === displayName || a.fileUrl === target);
        if (foundAtt) {
          fileUrl = foundAtt.fileUrl;
        }
      }

      parts.push(
        <a
          key={match.index}
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          download={fileUrl.startsWith('data:') ? displayName : undefined}
          title={`Click to open ${displayName}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 mx-1 my-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl border border-blue-200/90 dark:border-blue-900/60 shadow-sm transition-all cursor-pointer"
        >
          <Paperclip size={12} className="shrink-0" />
          <span className="truncate max-w-[200px]">{displayName}</span>
          <ExternalLink size={10} className="shrink-0 opacity-70" />
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < sanitized.length) {
      parts.push(sanitized.substring(lastIndex));
    }

    return parts.length > 0 ? parts : sanitized;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
          
          {/* Card Top Cover Banner (Image, Gradient or Solid Color) */}
          {coverBanner ? (
            <div className="relative w-full h-36 bg-neutral-100 dark:bg-neutral-800 overflow-hidden group">
              {coverBanner.startsWith('http') ? (
                <img src={coverBanner} alt="Card Cover" className="w-full h-full object-cover" />
              ) : (
                <div style={{ background: coverBanner }} className="w-full h-full" />
              )}
              <div className="absolute top-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setShowBannerGallery(true)}
                  className="px-2.5 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs font-semibold backdrop-blur flex items-center gap-1.5 shadow"
                >
                  <CoverIcon size={13} /> Change Cover
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCoverBanner(null)}
                  className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs font-semibold backdrop-blur shadow"
                  title="Remove Cover"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : coverImage ? (
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

          {/* Quick Notion Add Actions Bar (Icon & Cover triggers) */}
          <div className="px-6 pt-3 flex items-center gap-2 text-xs font-semibold text-neutral-400">
            <button
              type="button"
              onClick={() => setShowCardIconPicker(!showCardIconPicker)}
              className="px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center gap-1 transition-colors"
            >
              <Smile size={13} className="text-emerald-500" />
              <span>{icon ? `${icon} Change Icon` : 'Add Icon'}</span>
            </button>

            {!coverBanner && !coverImage && (
              <button
                type="button"
                onClick={() => setShowBannerGallery(true)}
                className="px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center gap-1 transition-colors"
              >
                <CoverIcon size={13} className="text-blue-500" />
                <span>Add Cover Banner</span>
              </button>
            )}
          </div>

          {/* Icon Picker Popover */}
          {showCardIconPicker && (
            <div className="absolute top-16 left-6 z-50 p-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-2 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300 pb-1 border-b border-neutral-100 dark:border-neutral-800">
                <span>เลือก Emoji ประจำการ์ด</span>
                <button type="button" onClick={() => setShowCardIconPicker(false)} className="text-neutral-400 hover:text-neutral-600">✕</button>
              </div>
              <div className="grid grid-cols-6 gap-1.5 max-w-[240px]">
                {POPULAR_CARD_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectIcon(emoji)}
                    className="w-8 h-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-lg flex items-center justify-center transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cover Banner Gallery Modal */}
          {showBannerGallery && (
            <div className="absolute top-16 left-6 right-6 z-50 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 max-h-[380px] overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-500" />
                  <span>Notion Cover Gallery & Gradients</span>
                </span>
                <button type="button" onClick={() => setShowBannerGallery(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">✕</button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CURATED_COVER_BANNERS.map((banner) => (
                  <button
                    key={banner.name}
                    type="button"
                    onClick={() => handleSelectCoverBanner(banner.value)}
                    className="h-16 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:ring-2 hover:ring-emerald-500 transition-all relative group text-left"
                  >
                    {banner.value.startsWith('http') ? (
                      <img src={banner.value} alt={banner.name} className="w-full h-full object-cover" />
                    ) : (
                      <div style={{ background: banner.value }} className="w-full h-full" />
                    )}
                    <span className="absolute bottom-1 left-2 text-[10px] font-bold text-white drop-shadow bg-black/40 px-1.5 py-0.5 rounded">
                      {banner.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between">
            <div className="flex items-start gap-2.5 flex-1 pr-4">
              <button
                type="button"
                onClick={() => setShowCardIconPicker(!showCardIconPicker)}
                className="text-2xl select-none hover:scale-110 transition-transform p-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0 mt-0.5"
                title="Change card icon"
              >
                {icon || '📝'}
              </button>
              <div className="flex-1 min-w-0">
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
              {/* Description with Slash Command Menu */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Description & Notes
                  </label>
                  <span className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
                    <Sparkles size={11} className="text-emerald-500" />
                    พิมพ์ <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono">/</kbd> สำหรับ Slash Commands
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    ref={descriptionTextareaRef}
                    value={description}
                    onChange={handleDescriptionChange}
                    onBlur={handleSaveBasic}
                    placeholder="เขียนรายละเอียดงาน... หรือพิมพ์ / เพื่อแทรก Callout, Checklist, Headings, Code"
                    rows={4}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed font-sans"
                  />

                  {/* Slash Command Palette Popup */}
                  {showSlashMenu && (
                    <SlashCommandMenu
                      query={slashQuery}
                      onSelect={handleSelectSlashCommand}
                      onClose={() => setShowSlashMenu(false)}
                      position={{ top: 40, left: 10 }}
                    />
                  )}
                </div>
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
                              <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none min-w-0 mr-2">
                                <input
                                  type="checkbox"
                                  checked={item.isCompleted}
                                  onChange={() => handleToggleChecklistItem(chk.id, item.id, item.isCompleted)}
                                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 dark:text-white focus:ring-0 cursor-pointer shrink-0"
                                />
                                <span
                                  className={`text-xs truncate ${
                                    item.isCompleted
                                      ? 'line-through text-neutral-400 dark:text-neutral-500'
                                      : 'text-neutral-800 dark:text-neutral-200'
                                  }`}
                                >
                                  {item.content}
                                </span>
                              </label>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Completed Timestamp Badge */}
                                {item.isCompleted && item.completedAt && (
                                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs">
                                    <Clock size={10} />
                                    <span>{format(new Date(item.completedAt), 'd MMM, HH:mm')}</span>
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteChecklistItem(chk.id, item.id)}
                                  className="opacity-60 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all"
                                  title="Remove item"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
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
                    {/* Post Comment Form with Spacious Textarea */}
                    <form onSubmit={handlePostComment} className="bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2.5 shadow-sm">
                      <div className="relative">
                        <textarea
                          ref={commentInputRef}
                          rows={3}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onPaste={handlePaste}
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handlePostComment(e);
                            }
                          }}
                          placeholder="Write a comment, reply, ask a question, or reference a file... (Ctrl + Enter to send)"
                          className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white resize-y min-h-[75px] leading-relaxed"
                        />
                      </div>

                      {/* Image Attachment Preview */}
                      {attachedImage && (
                        <div className="relative inline-block">
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

                      {/* Comment Toolbar (Bottom of textarea) */}
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60 dark:border-neutral-800/80">
                        <span className="text-[10px] text-neutral-400 font-medium hidden sm:inline">
                          Pro-tip: Press <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[9px] font-semibold">Ctrl + Enter</kbd> to send
                        </span>

                        <div className="flex items-center gap-2 ml-auto">
                          {/* Reference File Dropdown Trigger */}
                          {cardDetails.attachments && cardDetails.attachments.length > 0 && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowFileRefMenu(!showFileRefMenu)}
                                title="Reference an uploaded file / Google Drive document in comment"
                                className="px-2.5 py-1.5 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm"
                              >
                                <Paperclip size={13} className="text-blue-500" />
                                <span>Ref File</span>
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

                          {/* Emoji Picker Button & Popup */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setShowEmojiPicker(!showEmojiPicker);
                                setShowFileRefMenu(false);
                              }}
                              title="Insert Emoji (ใส่อีโมจิ)"
                              className="p-1.5 text-neutral-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
                            >
                              <Smile size={16} />
                            </button>

                            {/* Emoji Picker Floating Popup */}
                            {showEmojiPicker && (
                              <div className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                                {/* Category Tabs */}
                                <div className="flex border-b border-neutral-100 dark:border-neutral-800 pb-1.5 mb-2 gap-1 overflow-x-auto">
                                  {EMOJI_CATEGORIES.map((cat, idx) => (
                                    <button
                                      key={cat.name}
                                      type="button"
                                      onClick={() => setSelectedEmojiTab(idx)}
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                                        selectedEmojiTab === idx
                                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                                          : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                                      }`}
                                    >
                                      {cat.name}
                                    </button>
                                  ))}
                                </div>

                                {/* Emoji Grid */}
                                <div className="grid grid-cols-7 gap-1 max-h-44 overflow-y-auto p-0.5">
                                  {EMOJI_CATEGORIES[selectedEmojiTab]?.emojis.map((emoji, eIdx) => (
                                    <button
                                      key={eIdx}
                                      type="button"
                                      onClick={() => handleInsertEmoji(emoji)}
                                      className="h-8 w-8 text-base flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:scale-125 transition-transform"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => commentFileInputRef.current?.click()}
                            title="Attach Image"
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
                          >
                            <ImageIcon size={16} />
                          </button>

                          <button
                            type="submit"
                            disabled={!commentText.trim() && !attachedImage}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity shrink-0 disabled:opacity-40 shadow-sm"
                          >
                            <Send size={13} />
                            <span>Send</span>
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Comment List */}
                    <div className="space-y-3">
                      {cardDetails.comments?.map((c: any) => {
                        const isAuthor = currentUser && (c.userId === currentUser.id || (c.user?.email && currentUser.email && c.user.email.toLowerCase() === currentUser.email.toLowerCase()));
                        const isAdmin = currentUser?.role === 'ADMIN';
                        const canEdit = isAuthor;
                        const canDelete = isAuthor || isAdmin;
                        const isEditing = editingCommentId === c.id;
                        const isEdited = c.updatedAt && c.createdAt && Math.abs(new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) > 3000;

                        return (
                          <div key={c.id} className="group/comment bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-2xl text-xs space-y-2 border border-neutral-200/60 dark:border-neutral-800 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700">
                            <div className="flex items-center justify-between text-[11px] text-neutral-400">
                              <div className="flex items-center gap-2 flex-wrap">
                                <img
                                  src={c.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'User')}`}
                                  alt={c.user?.name}
                                  className="w-5 h-5 rounded-full object-cover shadow-sm"
                                />
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{c.user?.name}</span>
                                {c.isEmailReply && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shadow-xs">
                                    <Mail size={10} />
                                    <span>via Email</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span>{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                                {isEdited && (
                                  <span className="text-[10px] text-neutral-400 italic" title={`แก้ไขล่าสุด ${format(new Date(c.updatedAt), 'MMM d, HH:mm')}`}>
                                    (แก้ไขแล้ว)
                                  </span>
                                )}

                                {/* Action buttons (Edit / Delete) */}
                                {(canEdit || canDelete) && !isEditing && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                    {canEdit && (
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditComment(c)}
                                        className="p-1 text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70 transition-colors"
                                        title="แก้ไขข้อความ"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                    )}
                                    {canDelete && (
                                      <button
                                        type="button"
                                        onClick={() => setCommentToDelete(c.id)}
                                        className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                        title="ลบคอมเมนต์"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="pl-7 space-y-2 pt-1">
                                <textarea
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                      e.preventDefault();
                                      handleSaveEditComment(c.id);
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      handleCancelEditComment();
                                    }
                                  }}
                                  autoFocus
                                  rows={3}
                                  className="w-full text-xs p-2.5 rounded-xl border border-emerald-500/50 dark:border-emerald-500/50 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-inner resize-none"
                                  placeholder="แก้ไขข้อความคอมเมนต์..."
                                />
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-neutral-400">Ctrl+Enter เพื่อบันทึก, Esc เพื่อยกเลิก</span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={handleCancelEditComment}
                                      className="px-2.5 py-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                                    >
                                      ยกเลิก
                                    </button>
                                    <button
                                      type="button"
                                      disabled={!editingCommentText.trim() || isSavingCommentEdit}
                                      onClick={() => handleSaveEditComment(c.id)}
                                      className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                                    >
                                      <Check size={12} />
                                      <span>{isSavingCommentEdit ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                        );
                      })}
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
                    <div className="space-y-2">
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
                  <div className="space-y-2">
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
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>กำหนดส่ง (Due Date)</span>
                </label>
                <DueDatePicker
                  value={dueDate}
                  onChange={(isoStr) => {
                    setDueDate(isoStr || '');
                    updateCard(selectedCardId, {
                      dueDate: isoStr ? isoStr : undefined
                    });
                  }}
                />
              </div>

              {/* 1. Assignees (ผู้รับผิดชอบหลัก - Doers) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Users size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Assignees (ผู้รับผิดชอบหลัก)</span>
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                  {(() => {
                    const filteredAssignees = users.filter((u) => {
                      const isAssignableUser = u.isActive !== false && u.isAssignable !== false;
                      const isNotAdmin = u.role !== 'ADMIN';
                      const isCurrentlyAssigned = cardDetails.assignees?.some((a: any) => a.userId === u.id && (a.type === 'ASSIGNEE' || !a.type));
                      const isInOtherRole = cardDetails.assignees?.some((a: any) => a.userId === u.id && (a.type === 'REPORT_TO' || a.type === 'FYI'));

                      // If selected in Report To or FYI, hide from Assignees
                      if (isInOtherRole) return false;
                      return isAssignableUser && (isNotAdmin || isCurrentlyAssigned);
                    });

                    if (filteredAssignees.length === 0) {
                      return (
                        <div className="text-[11px] text-neutral-400 p-2 text-center">
                          ไม่มีรายชื่อให้เลือก
                        </div>
                      );
                    }

                    return filteredAssignees.map((u) => {
                      const isAssigned = cardDetails.assignees?.some((a: any) => a.userId === u.id && (a.type === 'ASSIGNEE' || !a.type));
                      const isInactive = u.isActive === false;
                      return (
                        <button
                          key={`assignee-${u.id}`}
                          type="button"
                          onClick={() => handleToggleStakeholder(u.id, 'ASSIGNEE')}
                          className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
                            isAssigned
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <span className="truncate flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isInactive && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded">
                                Inactive
                              </span>
                            )}
                          </span>
                          {isAssigned && <span className="text-[10px] font-bold">✓</span>}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* 2. Report To (รายงานผู้บังคับบัญชา / เจ้านาย) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <span className="text-amber-500">👑</span>
                  <span>Report to (รายงานเจ้านาย/ผู้บริหาร)</span>
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-amber-200/80 dark:border-amber-950/60 shadow-sm">
                  {(() => {
                    const filteredBosses = users.filter((u) => {
                      // Hide current logged-in user from Report To (cannot report to oneself)
                      if (currentUser && u.id === currentUser.id) return false;

                      const isBoss = u.role === 'ADMIN' || (u.jobTitle && /director|executive|manager|head|lead|ceo|coo|owner/i.test(u.jobTitle));
                      const isReportTo = cardDetails.assignees?.some((a: any) => a.userId === u.id && a.type === 'REPORT_TO');
                      const isEligible = u.isActive !== false && u.isAssignable !== false;
                      const isInOtherRole = cardDetails.assignees?.some((a: any) => a.userId === u.id && ((a.type || 'ASSIGNEE') === 'ASSIGNEE' || a.type === 'FYI'));

                      // If selected in Assignees or FYI, hide from Report To
                      if (isInOtherRole) return false;
                      return (isBoss && isEligible) || isReportTo;
                    });

                    if (filteredBosses.length === 0) {
                      return (
                        <div className="text-[11px] text-neutral-400 p-2 text-center">
                          ไม่มีรายชื่อให้เลือก
                        </div>
                      );
                    }

                    return filteredBosses.map((u) => {
                      const isReportTo = cardDetails.assignees?.some((a: any) => a.userId === u.id && a.type === 'REPORT_TO');
                      const isInactive = u.isActive === false;
                      return (
                        <button
                          key={`reportto-${u.id}`}
                          type="button"
                          onClick={() => handleToggleStakeholder(u.id, 'REPORT_TO')}
                          className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
                            isReportTo
                              ? 'bg-amber-600 text-white font-bold'
                              : 'hover:bg-amber-50 dark:hover:bg-amber-950/30 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <span className="truncate flex items-center gap-1.5">
                            <span className="text-[11px]">👑</span>
                            <span>{u.name}</span>
                            {isInactive && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded">
                                Inactive
                              </span>
                            )}
                          </span>
                          {isReportTo && <span className="text-[10px] font-bold">✓</span>}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* 3. FYI (แจ้งเพื่อทราบ / ผู้เข้าร่วม) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <span className="text-sky-500">📢</span>
                  <span>FYI (แจ้งเพื่อทราบ / ผู้ร่วมรับรู้)</span>
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-sky-200/80 dark:border-sky-950/60 shadow-sm">
                  {(() => {
                    const filteredFyi = users.filter((u) => {
                      // Hide current logged-in user from FYI (cannot FYI oneself)
                      if (currentUser && u.id === currentUser.id) return false;

                      const isBoss = u.role === 'ADMIN' || (u.jobTitle && /director|executive|manager|head|lead|ceo|coo|owner/i.test(u.jobTitle));
                      const isFyi = cardDetails.assignees?.some((a: any) => a.userId === u.id && a.type === 'FYI');
                      const isEligible = u.isActive !== false && u.isAssignable !== false && !isBoss;
                      const isInOtherRole = cardDetails.assignees?.some((a: any) => a.userId === u.id && ((a.type || 'ASSIGNEE') === 'ASSIGNEE' || a.type === 'REPORT_TO'));

                      // If selected in Assignees or Report To, hide from FYI
                      if (isInOtherRole) return false;
                      return isEligible || isFyi;
                    });

                    if (filteredFyi.length === 0) {
                      return (
                        <div className="text-[11px] text-neutral-400 p-2 text-center">
                          ไม่มีรายชื่อให้เลือก
                        </div>
                      );
                    }

                    return filteredFyi.map((u) => {
                      const isFyi = cardDetails.assignees?.some((a: any) => a.userId === u.id && a.type === 'FYI');
                      const isInactive = u.isActive === false;
                      return (
                        <button
                          key={`fyi-${u.id}`}
                          type="button"
                          onClick={() => handleToggleStakeholder(u.id, 'FYI')}
                          className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
                            isFyi
                              ? 'bg-sky-600 text-white font-bold'
                              : 'hover:bg-sky-50 dark:hover:bg-sky-950/30 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <span className="truncate flex items-center gap-1.5">
                            <span className="text-[10px]">👁️</span>
                            <span>{u.name}</span>
                            {isInactive && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded">
                                Inactive
                              </span>
                            )}
                          </span>
                          {isFyi && <span className="text-[10px] font-bold">✓</span>}
                        </button>
                      );
                    });
                  })()}
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

                {(currentUser?.role === 'ADMIN' || currentWorkspace?.ownerId === currentUser?.id || cardDetails?.createdById === currentUser?.id) && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteCardConfirm(true)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 rounded-xl transition-colors font-medium"
                  >
                    <Trash2 size={14} /> Delete Permanently (ลบการ์ดถาวร)
                  </button>
                )}
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

      {/* Confirmation Modal for Delete Comment */}
      <ConfirmModal
        isOpen={Boolean(commentToDelete)}
        type="danger"
        title="ยืนยันการลบคอมเมนต์"
        message="คุณต้องการลบคอมเมนต์นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบคอมเมนต์"
        cancelText="ยกเลิก"
        onConfirm={handleConfirmDeleteComment}
        onCancel={() => setCommentToDelete(null)}
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
