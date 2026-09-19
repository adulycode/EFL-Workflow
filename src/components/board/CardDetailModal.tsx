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
  Check,
  ArrowRightLeft,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { ConfirmModal } from '../common/ConfirmModal';
import { LabelManagerModal } from './LabelManagerModal';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import { SlashCommandMenu, SlashCommand } from '../common/SlashCommandMenu';
import { DueDatePicker } from '../common/DueDatePicker';
import { LinkPreviewCard } from '../common/LinkPreviewCard';
import { MoveCardModal } from './MoveCardModal';

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
    labels,
    board,
    fetchBoard
  } = useBoardStore();
  const { users, currentUser } = useAuthStore();
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();

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
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'comments' | 'photos' | 'attachments' | 'activity'>('comments');
  const [showFileRefMenu, setShowFileRefMenu] = useState(false);
  const [showPhotoRefMenu, setShowPhotoRefMenu] = useState(false);
  const [selectedRefPhotos, setSelectedRefPhotos] = useState<string[]>([]);
  const [hoveredPhotoPreview, setHoveredPhotoPreview] = useState<{ url: string; name: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiTab, setSelectedEmojiTab] = useState(0);

  // Advanced Checklist State (Inline Edit & Due Date)
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<string | null>(null);
  const [editingChecklistItemText, setEditingChecklistItemText] = useState('');
  const [activeChecklistDuePickerId, setActiveChecklistDuePickerId] = useState<string | null>(null);

  // Comment Editing and Deleting State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingCommentImages, setEditingCommentImages] = useState<string[]>([]);
  const [isSavingCommentEdit, setIsSavingCommentEdit] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const editCommentFileInputRef = useRef<HTMLInputElement>(null);

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
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);

  const [newChecklistTitle, setNewChecklistTitle] = useState('Checklist');
  const [addingItemChecklistId, setAddingItemChecklistId] = useState<string | null>(null);
  const [newItemContent, setNewItemContent] = useState('');

  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);
  const photoUploadInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Floating Menu Refs for Outside Click Handling
  const photoRefMenuRef = useRef<HTMLDivElement>(null);
  const photoRefButtonRef = useRef<HTMLButtonElement>(null);
  const fileRefMenuRef = useRef<HTMLDivElement>(null);
  const fileRefButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiPickerButtonRef = useRef<HTMLButtonElement>(null);

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
        } else if (showMoveModal) {
          setShowMoveModal(false);
        } else if (showDrivePicker) {
          setShowDrivePicker(false);
        } else if (showLabelManager) {
          setShowLabelManager(false);
        } else if (showCoverMenu) {
          setShowCoverMenu(false);
        } else if (showCardIconPicker) {
          setShowCardIconPicker(false);
        } else if (showBannerGallery) {
          setShowBannerGallery(false);
        } else if (showEmojiPicker) {
          setShowEmojiPicker(false);
        } else if (showFileRefMenu) {
          setShowFileRefMenu(false);
        } else if (showPhotoRefMenu) {
          setShowPhotoRefMenu(false);
        } else if (activeChecklistDuePickerId) {
          setActiveChecklistDuePickerId(null);
        } else {
          setSelectedCardId(null);
        }
      } else if (e.key === 'ArrowLeft' && lightboxImage && lightboxImages.length > 1) {
        setLightboxIndex((prev) => {
          const nextIdx = prev > 0 ? prev - 1 : lightboxImages.length - 1;
          setLightboxImage(lightboxImages[nextIdx]);
          return nextIdx;
        });
      } else if (e.key === 'ArrowRight' && lightboxImage && lightboxImages.length > 1) {
        setLightboxIndex((prev) => {
          const nextIdx = prev < lightboxImages.length - 1 ? prev + 1 : 0;
          setLightboxImage(lightboxImages[nextIdx]);
          return nextIdx;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('realtime:comment_added', handleRealtimeUpdate);
    window.addEventListener('realtime:card_updated', handleRealtimeUpdate);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('realtime:comment_added', handleRealtimeUpdate);
      window.removeEventListener('realtime:card_updated', handleRealtimeUpdate);
    };
  }, [
    selectedCardId, 
    lightboxImage, 
    lightboxImages,
    showMoveModal, 
    showDrivePicker, 
    showLabelManager, 
    showCoverMenu, 
    showCardIconPicker, 
    showBannerGallery, 
    showEmojiPicker, 
    showFileRefMenu,
    showPhotoRefMenu,
    activeChecklistDuePickerId
  ]);

  // Reset all transient popups, selections, and menus when switching or closing cards
  useEffect(() => {
    setShowPhotoRefMenu(false);
    setShowFileRefMenu(false);
    setShowEmojiPicker(false);
    setSelectedRefPhotos([]);
    setHoveredPhotoPreview(null);
    setAttachedImages([]);
    setCommentText('');
    setLightboxImage(null);
    setLightboxImages([]);
    setShowMoveModal(false);
    setShowDrivePicker(false);
    setShowLabelManager(false);
    setShowCoverMenu(false);
    setShowCardIconPicker(false);
    setShowBannerGallery(false);
    setActiveChecklistDuePickerId(null);
    setEditingChecklistItemId(null);
    setEditingCommentId(null);
  }, [selectedCardId]);

  // Outside click listener to dismiss floating menus (Photo Ref, File Ref, Emoji Picker)
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        showPhotoRefMenu &&
        photoRefMenuRef.current &&
        !photoRefMenuRef.current.contains(target) &&
        !photoRefButtonRef.current?.contains(target)
      ) {
        setShowPhotoRefMenu(false);
        setHoveredPhotoPreview(null);
      }
      if (
        showFileRefMenu &&
        fileRefMenuRef.current &&
        !fileRefMenuRef.current.contains(target) &&
        !fileRefButtonRef.current?.contains(target)
      ) {
        setShowFileRefMenu(false);
      }
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        !emojiPickerButtonRef.current?.contains(target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showPhotoRefMenu || showFileRefMenu || showEmojiPicker) {
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
    }
  }, [showPhotoRefMenu, showFileRefMenu, showEmojiPicker]);

  if (!selectedCardId || !cardDetails) return null;

  const cardAttachments: any[] = cardDetails.attachments || [];
  const isImageAttachment = (att: any) =>
    Boolean(att.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(att.fileName || ''));
  const cardPhotos = cardAttachments.filter(isImageAttachment);
  const cardDocs = cardAttachments.filter((att: any) => !isImageAttachment(att));

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

  // Image Upload Handler for Comments (Multiple up to 5)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 5 - attachedImages.length;
    if (availableSlots <= 0) {
      alert('สามารถแนบรูปภาพในคอมเมนต์ได้สูงสุด 5 รูป');
      e.target.value = '';
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      alert(`แนบได้สูงสุด 5 รูป (จะเลือก ${filesToProcess.length} รูปแรก)`);
    }

    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.ps1', '.vbs', '.sh', '.msi', '.dll', '.scr'];

    filesToProcess.forEach((file) => {
      const fileExt = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
      if (dangerousExtensions.includes(fileExt)) return;

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setAttachedImages((prev) => {
            if (prev.length >= 5) return prev;
            return [...prev, reader.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Open Lightbox with Carousel array
  const openLightbox = (images: string[], startIndex: number = 0) => {
    if (!images || images.length === 0) return;
    setLightboxImages(images);
    const validIdx = startIndex >= 0 && startIndex < images.length ? startIndex : 0;
    setLightboxIndex(validIdx);
    setLightboxImage(images[validIdx]);
  };

  // Open this Card's specific Google Drive folder (EFL-Trello > Workspace > Card)
  const handleOpenCardDriveFolder = async () => {
    if (!selectedCardId) return;
    try {
      const res = await fetch(`/api/cards/${selectedCardId}/drive-folder`);
      if (res.ok) {
        const data = await res.json();
        if (data.folderUrl) {
          window.open(data.folderUrl, '_blank');
          return;
        }
      }
      window.open('https://drive.google.com/drive/folders/1N1tclaApps6k8gmz-1SIbBWacOAW-T1D', '_blank');
    } catch {
      window.open('https://drive.google.com/drive/folders/1N1tclaApps6k8gmz-1SIbBWacOAW-T1D', '_blank');
    }
  };

  // Photo Upload Handler for Photos Gallery
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setActiveTab('photos');
    Array.from(files).forEach((file) => {
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.ps1', '.vbs', '.sh', '.msi', '.dll', '.scr'];
      const fileExt = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
      if (dangerousExtensions.includes(fileExt)) {
        alert('ไม่อนุญาตให้อัปโหลดไฟล์ประเภทนี้ เพื่อความปลอดภัยของระบบ');
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const fileUrl = reader.result as string;
        await addAttachment(selectedCardId, {
          fileName: file.name,
          fileUrl,
          fileType: file.type || 'image/jpeg',
          fileSize: file.size,
          userId: currentUser?.id
        });
        fetchDetails();
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // File Upload Handler for Card Attachments (Documents & Drive)
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.ps1', '.vbs', '.sh', '.msi', '.dll', '.scr'];
    const fileExt = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
    if (dangerousExtensions.includes(fileExt)) {
      alert('ไม่อนุญาตให้อัปโหลดไฟล์ประเภทนี้ เพื่อความปลอดภัยของระบบ');
      e.target.value = '';
      return;
    }

    const isImg = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(file.name);
    setActiveTab(isImg ? 'photos' : 'attachments');

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
    e.target.value = '';
  };

  // Save Checklist Item Content (Inline Edit)
  const handleSaveChecklistItemContent = async (checklistId: string, itemId: string, newContent: string) => {
    if (!newContent.trim()) {
      setEditingChecklistItemId(null);
      return;
    }
    const trimmed = newContent.trim();
    setEditingChecklistItemId(null);

    setCardDetails((prev: any) => ({
      ...prev,
      checklists: prev.checklists?.map((c: any) => {
        if (c.id !== checklistId) return c;
        return {
          ...c,
          items: c.items?.map((i: any) => (i.id === itemId ? { ...i, content: trimmed } : i))
        };
      })
    }));

    try {
      await fetch(`/api/cards/${selectedCardId}/checklists/${checklistId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed })
      });
      useBoardStore.getState().fetchBoard();
    } catch (err) {
      console.error('Failed to update checklist item content:', err);
      fetchDetails();
    }
  };

  // Save Checklist Item Due Date (Deadline)
  const handleSaveChecklistItemDueDate = async (checklistId: string, itemId: string, newDueDate: string | null) => {
    setActiveChecklistDuePickerId(null);

    setCardDetails((prev: any) => ({
      ...prev,
      checklists: prev.checklists?.map((c: any) => {
        if (c.id !== checklistId) return c;
        return {
          ...c,
          items: c.items?.map((i: any) => (i.id === itemId ? { ...i, dueDate: newDueDate } : i))
        };
      })
    }));

    try {
      await fetch(`/api/cards/${selectedCardId}/checklists/${checklistId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDueDate })
      });
      useBoardStore.getState().fetchBoard();
    } catch (err) {
      console.error('Failed to update checklist item due date:', err);
      fetchDetails();
    }
  };

  // Google Drive Attachment Handler
  const handleAttachGoogleDrive = async (data: { fileName: string; fileUrl: string; fileType: string; fileSize?: number }) => {
    setActiveTab('attachments');
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

  // Insert Selected Photo References into Comment Box
  const handleInsertSelectedPhotos = () => {
    if (selectedRefPhotos.length === 0) return;
    const insertTexts = selectedRefPhotos.map((attId) => {
      const found = cardDetails?.attachments?.find((a: any) => a.id === attId);
      if (found) {
        return `[🖼️ ${found.fileName}](att:${found.id})`;
      }
      return '';
    }).filter(Boolean);

    setCommentText((prev) => (prev ? `${prev} ${insertTexts.join(' ')} ` : `${insertTexts.join(' ')} `));
    setSelectedRefPhotos([]);
    setShowPhotoRefMenu(false);
    setActiveTab('comments');
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  // Reference single photo from Photos tab in Comment Box
  const handleRefPhotoInComment = (photo: any) => {
    const textToInsert = `[🖼️ ${photo.fileName}](att:${photo.id}) `;
    setCommentText((prev) => (prev ? `${prev} ${textToInsert}` : textToInsert));
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

  // Clipboard Paste Image Handler (Multiple up to 5)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageItems: DataTransferItem[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageItems.push(items[i]);
      }
    }
    if (imageItems.length === 0) return;

    const availableSlots = 5 - attachedImages.length;
    if (availableSlots <= 0) {
      alert('สามารถแนบรูปภาพในคอมเมนต์ได้สูงสุด 5 รูป');
      return;
    }

    imageItems.slice(0, availableSlots).forEach((item) => {
      const blob = item.getAsFile();
      if (blob) {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setAttachedImages((prev) => {
              if (prev.length >= 5) return prev;
              return [...prev, reader.result as string];
            });
          }
        };
        reader.readAsDataURL(blob);
      }
    });
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && attachedImages.length === 0) return;

    await addComment(selectedCardId, commentText.trim(), attachedImages, currentUser?.id, attachedImages);
    setCommentText('');
    setAttachedImages([]);
    if (commentFileInputRef.current) commentFileInputRef.current.value = '';
    fetchDetails();
  };

  const handleEditCommentImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 5 - editingCommentImages.length;
    if (availableSlots <= 0) {
      alert('สามารถแนบรูปภาพในคอมเมนต์ได้สูงสุด 5 รูป');
      e.target.value = '';
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      alert(`แนบได้สูงสุด 5 รูป (จะเลือก ${filesToProcess.length} รูปแรก)`);
    }

    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.ps1', '.vbs', '.sh', '.msi', '.dll', '.scr'];

    filesToProcess.forEach((file) => {
      const fileExt = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
      if (dangerousExtensions.includes(fileExt)) return;

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setEditingCommentImages((prev) => {
            if (prev.length >= 5) return prev;
            return [...prev, reader.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveEditCommentImage = (index: number) => {
    setEditingCommentImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleStartEditComment = (c: any) => {
    setEditingCommentId(c.id);
    setEditingCommentText(c.content || '');
    let imgs: string[] = [];
    if (c.imageUrl) {
      if (c.imageUrl.startsWith('[') && c.imageUrl.endsWith(']')) {
        try {
          const parsed = JSON.parse(c.imageUrl);
          if (Array.isArray(parsed)) imgs = parsed;
        } catch {}
      }
      if (imgs.length === 0) imgs = [c.imageUrl];
    }
    setEditingCommentImages(imgs);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
    setEditingCommentImages([]);
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editingCommentText.trim() && editingCommentImages.length === 0) return;
    setIsSavingCommentEdit(true);
    const success = await updateComment(
      selectedCardId,
      commentId,
      editingCommentText.trim(),
      currentUser?.id,
      editingCommentImages
    );
    setIsSavingCommentEdit(false);
    if (success) {
      const storedImageUrl = editingCommentImages.length === 0
        ? null
        : editingCommentImages.length === 1
        ? editingCommentImages[0]
        : JSON.stringify(editingCommentImages);

      setCardDetails((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments?.map((c: any) =>
            c.id === commentId
              ? {
                  ...c,
                  content: editingCommentText.trim(),
                  imageUrl: storedImageUrl,
                  updatedAt: new Date().toISOString()
                }
              : c
          )
        };
      });
      setEditingCommentId(null);
      setEditingCommentText('');
      setEditingCommentImages([]);
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

  const getDocBadgeStyle = (fileName: string, fileType?: string) => {
    const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '';
    if (ext === '.pdf' || fileType?.includes('pdf')) {
      return {
        tag: 'PDF',
        className: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900 hover:bg-rose-100',
        badgeClass: 'bg-rose-600 text-white',
        icon: <FileText size={12} className="text-rose-600 dark:text-rose-400" />
      };
    }
    if (['.doc', '.docx'].includes(ext) || fileType?.includes('word') || fileType?.includes('doc')) {
      return {
        tag: 'DOC',
        className: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900 hover:bg-blue-100',
        badgeClass: 'bg-blue-600 text-white',
        icon: <FileText size={12} className="text-blue-600 dark:text-blue-400" />
      };
    }
    if (['.xls', '.xlsx', '.csv'].includes(ext) || fileType?.includes('sheet') || fileType?.includes('excel')) {
      return {
        tag: 'XLS',
        className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100',
        badgeClass: 'bg-emerald-600 text-white',
        icon: <FileSpreadsheet size={12} className="text-emerald-600 dark:text-emerald-400" />
      };
    }
    if (['.ppt', '.pptx'].includes(ext) || fileType?.includes('presentation') || fileType?.includes('powerpoint')) {
      return {
        tag: 'PPT',
        className: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900 hover:bg-orange-100',
        badgeClass: 'bg-orange-600 text-white',
        icon: <Layers size={12} className="text-orange-600 dark:text-orange-400" />
      };
    }
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext) || fileType?.includes('zip') || fileType?.includes('compressed')) {
      return {
        tag: 'ZIP',
        className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900 hover:bg-amber-100',
        badgeClass: 'bg-amber-600 text-white',
        icon: <FileArchive size={12} className="text-amber-600 dark:text-amber-400" />
      };
    }
    return {
      tag: 'FILE',
      className: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200',
      badgeClass: 'bg-neutral-600 text-white',
      icon: <Paperclip size={12} className="text-neutral-500" />
    };
  };

  // Helper to render comment text with clickable links and Rich Preview Cards
  const renderCommentContent = (content: string) => {
    // 1. Sanitize any accidentally pasted raw base64 data URLs in comments
    const sanitized = content
      .replace(/\(data:[A-Za-z-+\/0-9.]+;base64,[A-Za-z0-9+/=]+\)/g, '')
      .replace(/data:[A-Za-z-+\/0-9.]+;base64,[A-Za-z0-9+/=]{50,}/g, '');

    // Extract all unique raw URLs in the comment for Link Preview Cards
    const rawUrlRegex = /(https?:\/\/[^\s<>()"']+)/gi;
    const detectedUrls: string[] = [];
    let urlMatch;
    while ((urlMatch = rawUrlRegex.exec(sanitized)) !== null) {
      const u = urlMatch[1];
      if (!detectedUrls.includes(u) && !u.startsWith('data:') && !u.startsWith('att:')) {
        detectedUrls.push(u);
      }
    }

    // Collect image previews for inline rendering
    const detectedImages: { url: string; name: string }[] = [];

    // 2. Parse text into segments (supporting markdown [label](target), raw URLs, and plain text with linebreaks)
    const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s<>()"']+)/g;
    const textElements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(sanitized)) !== null) {
      if (match.index > lastIndex) {
        textElements.push(sanitized.substring(lastIndex, match.index));
      }

      const fullMatch = match[0];
      if (fullMatch.startsWith('[')) {
        // Markdown link [label](target)
        const label = match[2];
        const target = match[3];

        let fileUrl = target;
        let displayName = label.replace(/^[📎📄📊📽️📁]\s*/, '');
        let isImage = false;
        let matchedAtt: any = null;

        if (target.startsWith('att:')) {
          const attId = target.slice(4);
          fileUrl = `/api/attachments/${attId}/view`;
          const foundAtt = cardDetails.attachments?.find((a: any) => a.id === attId);
          matchedAtt = foundAtt;
          if (foundAtt) {
            displayName = foundAtt.fileName;
            isImage = Boolean(foundAtt.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(foundAtt.fileName));
          } else {
            isImage = /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(displayName);
          }
        } else if (target.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(displayName) || /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(target)) {
          isImage = true;
          const foundAtt = cardDetails.attachments?.find((a: any) => a.fileName === displayName || a.fileUrl === target);
          matchedAtt = foundAtt;
          if (foundAtt) {
            fileUrl = `/api/attachments/${foundAtt.id}/view`;
          }
        } else if (cardDetails.attachments) {
          const foundAtt = cardDetails.attachments.find((a: any) => a.fileName === displayName || a.fileUrl === target);
          matchedAtt = foundAtt;
          if (foundAtt) {
            fileUrl = `/api/attachments/${foundAtt.id}/view`;
            isImage = Boolean(foundAtt.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(foundAtt.fileName));
          }
        }

        if (isImage) {
          detectedImages.push({ url: fileUrl, name: displayName });
        }

        const badgeStyle = getDocBadgeStyle(displayName, matchedAtt?.fileType);

        textElements.push(
          <button
            key={`md-${match.index}`}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (isImage) {
                openLightbox([fileUrl], 0);
              } else if (fileUrl.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = displayName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                window.open(fileUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            title={isImage ? `Click to view ${displayName}` : `Click to open ${displayName}`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 mx-0.5 my-0.5 text-xs font-semibold rounded-lg border shadow-2xs transition-all cursor-pointer ${
              isImage 
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200/90 dark:border-blue-900/60 hover:bg-blue-100'
                : badgeStyle.className
            }`}
          >
            {isImage ? (
              <ImageIcon size={12} className="shrink-0 text-blue-500" />
            ) : (
              <>
                <span className={`px-1 py-0.2 rounded text-[9px] font-extrabold tracking-wider ${badgeStyle.badgeClass}`}>
                  {badgeStyle.tag}
                </span>
                {badgeStyle.icon}
              </>
            )}
            <span className="truncate max-w-[200px]">{displayName}</span>
            {isImage ? <Maximize2 size={10} className="shrink-0 opacity-70" /> : <ExternalLink size={10} className="shrink-0 opacity-70" />}
          </button>
        );
      } else {
        // Raw URL: format cleanly
        const rawUrl = fullMatch;
        let displayUrl = rawUrl;
        try {
          const parsed = new URL(rawUrl);
          displayUrl = `${parsed.hostname}${parsed.pathname.length > 25 ? parsed.pathname.slice(0, 25) + '...' : parsed.pathname}`;
        } catch {
          displayUrl = rawUrl.length > 40 ? rawUrl.slice(0, 40) + '...' : rawUrl;
        }

        textElements.push(
          <a
            key={`url-${match.index}`}
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={rawUrl}
            className="text-emerald-600 dark:text-emerald-400 font-semibold underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors mx-0.5 break-all"
          >
            {displayUrl}
          </a>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < sanitized.length) {
      textElements.push(sanitized.substring(lastIndex));
    }

    return (
      <div className="space-y-2">
        <div className="whitespace-pre-wrap leading-relaxed">
          {textElements.length > 0 ? textElements : sanitized}
        </div>

        {/* Render Dynamic Smart Image Layout for Images Referenced in Comment */}
        {detectedImages.length === 1 && (
          <div className="pt-1">
            <div className="relative group inline-block">
              <img
                src={detectedImages[0].url}
                alt={detectedImages[0].name}
                onClick={() => openLightbox([detectedImages[0].url], 0)}
                className="max-h-36 max-w-full rounded-xl object-contain border border-neutral-200 dark:border-neutral-700 shadow-2xs cursor-zoom-in group-hover:opacity-95 transition-opacity bg-neutral-100 dark:bg-neutral-800"
              />
              <button
                type="button"
                onClick={() => openLightbox([detectedImages[0].url], 0)}
                className="absolute bottom-1.5 right-1.5 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                title="ขยายรูป"
              >
                <Maximize2 size={10} />
              </button>
            </div>
          </div>
        )}

        {detectedImages.length > 1 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {detectedImages.slice(0, 5).map((img, idx) => {
              const overflowCount = detectedImages.length - 4;
              return (
                <div
                  key={idx}
                  onClick={() => openLightbox(detectedImages.map((i) => i.url), idx)}
                  title={`${img.name} (คลิกเพื่อดูรูปขนาดเต็ม)`}
                  className="relative w-12 h-12 sm:w-13 sm:h-13 aspect-square rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-2xs group cursor-zoom-in bg-neutral-100 dark:bg-neutral-800 shrink-0 hover:ring-2 hover:ring-blue-500 hover:scale-105 transition-all"
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  {idx === 4 && overflowCount > 1 && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white font-bold backdrop-blur-xs">
                      <span className="text-xs leading-none">+{overflowCount}</span>
                      <span className="text-[8px] text-neutral-300">รูปภาพ</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Rich Link Preview Cards (Limited to first 3 previews per comment for optimal performance) */}
        {detectedUrls.length > 0 && (
          <div className="pt-1 space-y-2">
            {detectedUrls.slice(0, 3).map((u) => (
              <LinkPreviewCard key={u} url={u} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedCardId(null);
          }
        }}
      >
        <div 
          className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative cursor-default"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          
          {/* Card Top Cover Banner (Image, Gradient or Solid Color) */}
          {coverBanner ? (
            coverBanner.startsWith('http') || coverBanner.startsWith('/') || coverBanner.startsWith('data:image') ? (
              <div className="relative w-full h-36 bg-neutral-100 dark:bg-neutral-800 overflow-hidden group">
                <img src={coverBanner} alt="Card Cover" className="w-full h-full object-cover" />
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
            ) : (
              <div style={{ background: coverBanner }} className="relative w-full h-8 group">
                <div className="absolute top-1 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setShowBannerGallery(true)}
                    className="px-2 py-0.5 bg-black/40 hover:bg-black/60 text-white rounded text-[10px] font-semibold backdrop-blur flex items-center gap-1"
                  >
                    <CoverIcon size={11} /> Change
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectCoverBanner(null)}
                    className="p-0.5 px-1 bg-black/40 hover:bg-black/60 text-white rounded text-[10px] font-bold"
                    title="Remove Cover"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    in column: {cardDetails.column?.title}
                  </span>
                  {cardDetails.createdBy && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full font-medium">
                      <img
                        src={cardDetails.createdBy.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(cardDetails.createdBy.name)}`}
                        alt={cardDetails.createdBy.name}
                        className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-violet-400"
                      />
                      <span>สร้างโดย: <strong className="font-semibold text-neutral-800 dark:text-neutral-100">{cardDetails.createdBy.name}</strong></span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveBasic}
                  className="text-base font-bold text-neutral-900 dark:text-white bg-transparent w-full focus:outline-none border-b border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 py-0.5 mt-0.5"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(currentUser?.role === 'ADMIN' ||
                currentWorkspace?.ownerId === currentUser?.id ||
                cardDetails?.createdById === currentUser?.id ||
                cardDetails?.assignees?.some((a: any) => a.userId === currentUser?.id)) && (
                <button
                  type="button"
                  onClick={() => setShowMoveModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition-all shadow-xs cursor-pointer"
                  title="Move Card (ย้ายไปบอร์ดหรือคอลัมน์อื่น)"
                >
                  <ArrowRightLeft size={13} />
                  <span>Move Card</span>
                </button>
              )}
              <button
                onClick={() => setSelectedCardId(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={18} />
              </button>
            </div>
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
                          {chk.items?.map((item: any) => {
                            const isEditing = editingChecklistItemId === item.id;
                            const hasDue = Boolean(item.dueDate);
                            const isOverdue = hasDue && !item.isCompleted && isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate));
                            const isDueToday = hasDue && !item.isCompleted && isToday(new Date(item.dueDate));

                            return (
                              <div
                                key={item.id}
                                className="group flex items-center justify-between gap-2 p-2 rounded-xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all relative"
                              >
                                <div className="flex items-center gap-2.5 flex-1 select-none min-w-0 mr-2">
                                  <input
                                    type="checkbox"
                                    checked={item.isCompleted}
                                    onChange={() => handleToggleChecklistItem(chk.id, item.id, item.isCompleted)}
                                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 dark:text-white focus:ring-0 cursor-pointer shrink-0"
                                  />
                                  {isEditing ? (
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <input
                                        type="text"
                                        autoFocus
                                        value={editingChecklistItemText}
                                        onChange={(e) => setEditingChecklistItemText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveChecklistItemContent(chk.id, item.id, editingChecklistItemText);
                                          } else if (e.key === 'Escape') {
                                            setEditingChecklistItemId(null);
                                          }
                                        }}
                                        onBlur={() => handleSaveChecklistItemContent(chk.id, item.id, editingChecklistItemText)}
                                        className="w-full text-xs px-2 py-1 rounded-lg border border-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          handleSaveChecklistItemContent(chk.id, item.id, editingChecklistItemText);
                                        }}
                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                      >
                                        <Check size={13} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <span
                                        onClick={() => {
                                          if (!item.isCompleted) {
                                            setEditingChecklistItemId(item.id);
                                            setEditingChecklistItemText(item.content);
                                          }
                                        }}
                                        className={`text-xs truncate ${
                                          item.isCompleted
                                            ? 'line-through text-neutral-400 dark:text-neutral-500 cursor-default'
                                            : 'text-neutral-800 dark:text-neutral-200 cursor-text hover:text-blue-600 dark:hover:text-blue-400'
                                        }`}
                                        title={item.isCompleted ? item.content : "Click to edit text"}
                                      >
                                        {item.content}
                                      </span>
                                      {!item.isCompleted && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingChecklistItemId(item.id);
                                            setEditingChecklistItemText(item.content);
                                          }}
                                          className="opacity-0 group-hover:opacity-70 hover:opacity-100 p-0.5 text-neutral-400 hover:text-blue-500 transition-opacity"
                                          title="Edit text"
                                        >
                                          <Pencil size={11} />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Due Date Badge & Picker */}
                                  <div className="relative">
                                    {hasDue ? (
                                      <button
                                        type="button"
                                        onClick={() => setActiveChecklistDuePickerId(activeChecklistDuePickerId === item.id ? null : item.id)}
                                        className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${
                                          item.isCompleted
                                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700'
                                            : isOverdue
                                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 animate-pulse'
                                            : isDueToday
                                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900'
                                        }`}
                                        title="Change deadline"
                                      >
                                        <Calendar size={10} />
                                        <span>{format(new Date(item.dueDate), 'd MMM')}</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setActiveChecklistDuePickerId(activeChecklistDuePickerId === item.id ? null : item.id)}
                                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-all"
                                        title="Add deadline"
                                      >
                                        <Calendar size={12} />
                                      </button>
                                    )}

                                    {/* Date Picker Popover */}
                                    {activeChecklistDuePickerId === item.id && (
                                      <div 
                                        className="absolute right-0 top-full mt-1.5 z-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-2.5 w-56 animate-in fade-in zoom-in-95 space-y-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
                                          <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">กำหนดส่งงาน (Deadline)</span>
                                          <button 
                                            type="button"
                                            onClick={() => setActiveChecklistDuePickerId(null)}
                                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                        <input
                                          type="date"
                                          defaultValue={item.dueDate ? format(new Date(item.dueDate), 'yyyy-MM-dd') : ''}
                                          onChange={(e) => {
                                            if (e.target.value) {
                                              handleSaveChecklistItemDueDate(chk.id, item.id, new Date(e.target.value).toISOString());
                                            }
                                          }}
                                          className="w-full text-xs p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                                        />
                                        {hasDue && (
                                          <button
                                            type="button"
                                            onClick={() => handleSaveChecklistItemDueDate(chk.id, item.id, null)}
                                            className="w-full text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 py-1 rounded-lg transition-colors text-center"
                                          >
                                            ลบกำหนดส่ง
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>

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
                            );
                          })}
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
                <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-1.5 text-xs font-semibold pb-1 relative transition-colors shrink-0 ${
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
                    onClick={() => setActiveTab('photos')}
                    className={`flex items-center gap-1.5 text-xs font-semibold pb-1 relative transition-colors shrink-0 ${
                      activeTab === 'photos'
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <ImageIcon size={14} />
                    Photos ({cardPhotos.length})
                    {activeTab === 'photos' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white rounded-full -mb-2" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('attachments')}
                    className={`flex items-center gap-1.5 text-xs font-semibold pb-1 relative transition-colors shrink-0 ${
                      activeTab === 'attachments'
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <Paperclip size={14} />
                    Files ({cardDocs.length})
                    {activeTab === 'attachments' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white rounded-full -mb-2" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-1.5 text-xs font-semibold pb-1 relative transition-colors shrink-0 ${
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

                      {/* Image Attachments Preview (Multiple up to 5) */}
                      {attachedImages.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-neutral-500">
                            <span>แนบรูปภาพแล้ว {attachedImages.length}/5 รูป</span>
                            {attachedImages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setAttachedImages([])}
                                className="text-rose-600 dark:text-rose-400 hover:underline text-[10px] font-semibold"
                              >
                                ลบทั้งหมด
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {attachedImages.map((imgUrl, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={imgUrl}
                                  alt={`Attached preview ${idx + 1}`}
                                  onClick={() => openLightbox(attachedImages, idx)}
                                  className="h-14 w-14 rounded-xl object-cover border border-neutral-300 dark:border-neutral-700 shadow-sm cursor-zoom-in"
                                />
                                <button
                                  type="button"
                                  onClick={() => setAttachedImages((prev) => prev.filter((_, i) => i !== idx))}
                                  className="absolute -top-1 -right-1 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow transition-transform group-hover:scale-110"
                                  title="ลบรูปนี้"
                                >
                                  <X size={9} />
                                </button>
                                <span className="absolute bottom-0.5 right-0.5 px-0.5 py-0.2 bg-black/60 text-white text-[8px] font-bold rounded">
                                  {idx + 1}/{attachedImages.length}
                                </span>
                              </div>
                            ))}
                            {attachedImages.length < 5 && (
                              <button
                                type="button"
                                onClick={() => commentFileInputRef.current?.click()}
                                className="h-14 w-14 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-blue-500 text-neutral-400 hover:text-blue-500 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9px] font-semibold"
                              >
                                <Plus size={14} />
                                <span>+ เพิ่ม</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Comment Toolbar (Bottom of textarea) */}
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60 dark:border-neutral-800/80">
                        <span className="text-[10px] text-neutral-400 font-medium hidden sm:inline">
                          Pro-tip: Press <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[9px] font-semibold">Ctrl + Enter</kbd> to send
                        </span>

                        <div className="flex items-center gap-2 ml-auto">
                          {/* Reference Photo Dropdown Trigger (with 1:1 Thumbnails & Multi-Select) */}
                          <div className="relative">
                            <button
                              ref={photoRefButtonRef}
                              type="button"
                              onClick={() => {
                                setShowPhotoRefMenu(!showPhotoRefMenu);
                                setShowFileRefMenu(false);
                                setShowEmojiPicker(false);
                              }}
                              title="Reference photos in comment (อ้างอิงรูปภาพในคอมเมนต์)"
                              className={`px-2.5 py-1.5 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold border shadow-sm ${
                                cardPhotos.length > 0
                                  ? 'text-neutral-700 dark:text-neutral-200 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                                  : 'text-neutral-400 hover:text-neutral-600 border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50 dark:bg-neutral-900/50'
                              }`}
                            >
                              <ImageIcon size={13} className="text-blue-500" />
                              <span>Ref Photo</span>
                              {cardPhotos.length > 0 && (
                                <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">
                                  {cardPhotos.length}
                                </span>
                              )}
                            </button>

                            {/* Photo Ref Multi-Select Menu */}
                            {showPhotoRefMenu && (
                              <div
                                ref={photoRefMenuRef}
                                className="absolute right-0 bottom-full mb-2 w-80 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                              >
                                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                                  <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                                    เลือกรูปภาพอ้างอิง ({cardPhotos.length})
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => photoUploadInputRef.current?.click()}
                                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                      <Plus size={10} /> อัปโหลดใหม่
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowPhotoRefMenu(false)}
                                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                      title="ปิดเมนู"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>

                                {cardPhotos.length > 0 ? (
                                  <>
                                    <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1">
                                      {cardPhotos.map((photo: any) => {
                                        const isSelected = selectedRefPhotos.includes(photo.id);
                                        const photoUrl = photo.fileUrl?.startsWith('data:') ? photo.fileUrl : `/api/attachments/${photo.id}/view`;

                                        return (
                                          <div
                                            key={photo.id}
                                            onClick={() => {
                                              setSelectedRefPhotos((prev) =>
                                                prev.includes(photo.id)
                                                  ? prev.filter((id) => id !== photo.id)
                                                  : [...prev, photo.id]
                                              );
                                            }}
                                            onMouseEnter={() => setHoveredPhotoPreview({ url: photoUrl, name: photo.fileName })}
                                            onMouseLeave={() => setHoveredPhotoPreview(null)}
                                            className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                                              isSelected
                                                ? 'border-blue-600 ring-2 ring-blue-500/40 shadow-sm'
                                                : 'border-neutral-200 dark:border-neutral-700 hover:border-blue-400'
                                            }`}
                                          >
                                            <img src={photoUrl} alt={photo.fileName} className="w-full h-full object-cover" />
                                            {isSelected && (
                                              <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                                                <div className="bg-blue-600 rounded-full p-0.5 shadow">
                                                  <Check size={12} />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-neutral-100 dark:border-neutral-800">
                                      <span className="text-[11px] text-neutral-500">
                                        เลือก {selectedRefPhotos.length} รูป
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {selectedRefPhotos.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => setSelectedRefPhotos([])}
                                            className="text-[11px] text-neutral-400 hover:text-neutral-600 px-2 py-1"
                                          >
                                            ล้าง
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          disabled={selectedRefPhotos.length === 0}
                                          onClick={handleInsertSelectedPhotos}
                                          className="text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                                        >
                                          แทรก {selectedRefPhotos.length > 0 ? `${selectedRefPhotos.length} รูป` : ''}
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center py-6 space-y-2.5">
                                    <p className="text-xs text-neutral-400">ยังไม่มีรูปภาพใน Gallery ของการ์ดนี้</p>
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => photoUploadInputRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 transition-colors"
                                      >
                                        <Plus size={12} /> อัปโหลดรูปภาพ
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setShowPhotoRefMenu(false)}
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                                      >
                                        ปิด
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Reference File Dropdown Trigger (Filtered Non-Image Documents) */}
                          {cardDocs.length > 0 && (
                            <div className="relative">
                              <button
                                ref={fileRefButtonRef}
                                type="button"
                                onClick={() => {
                                  setShowFileRefMenu(!showFileRefMenu);
                                  setShowPhotoRefMenu(false);
                                  setShowEmojiPicker(false);
                                }}
                                title="Reference an uploaded file / Google Drive document in comment"
                                className="px-2.5 py-1.5 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm"
                              >
                                <Paperclip size={13} className="text-neutral-500" />
                                <span>Ref File</span>
                                <span className="px-1.5 py-0.2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-[10px] font-bold">
                                  {cardDocs.length}
                                </span>
                              </button>

                              {/* File Ref Menu */}
                              {showFileRefMenu && (
                                <div
                                  ref={fileRefMenuRef}
                                  className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1">
                                      Select file to reference:
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setShowFileRefMenu(false)}
                                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md"
                                      title="ปิดเมนู"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto space-y-1">
                                    {cardDocs.map((att: any) => {
                                      const badge = getDocBadgeStyle(att.fileName, att.fileType);
                                      return (
                                        <button
                                          key={att.id}
                                          type="button"
                                          onClick={() => handleInsertFileRef(att)}
                                          className="w-full text-left p-1.5 rounded-lg text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors truncate"
                                        >
                                          <span className={`px-1 py-0.2 rounded text-[9px] font-extrabold tracking-wider ${badge.badgeClass}`}>
                                            {badge.tag}
                                          </span>
                                          <span className="truncate text-neutral-800 dark:text-neutral-200 flex-1">{att.fileName}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <input
                            ref={commentFileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />

                          {/* Emoji Picker Button & Popup */}
                          <div className="relative">
                            <button
                              ref={emojiPickerButtonRef}
                              type="button"
                              onClick={() => {
                                setShowEmojiPicker(!showEmojiPicker);
                                setShowFileRefMenu(false);
                                setShowPhotoRefMenu(false);
                              }}
                              title="Insert Emoji (ใส่อีโมจิ)"
                              className="p-1.5 text-neutral-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
                            >
                              <Smile size={16} />
                            </button>

                            {/* Emoji Picker Floating Popup */}
                            {showEmojiPicker && (
                              <div
                                ref={emojiPickerRef}
                                className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                              >
                                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-1.5 mb-2">
                                  {/* Category Tabs */}
                                  <div className="flex gap-1 overflow-x-auto">
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
                                  <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(false)}
                                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md shrink-0 ml-1"
                                    title="ปิด"
                                  >
                                    <X size={12} />
                                  </button>
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
                            disabled={attachedImages.length >= 5}
                            onClick={() => commentFileInputRef.current?.click()}
                            title={`Attach Images (แนบรูปภาพ สูงสุด 5 รูป) [${attachedImages.length}/5]`}
                            className="relative p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors shrink-0 disabled:opacity-40"
                          >
                            <ImageIcon size={16} />
                            {attachedImages.length > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">
                                {attachedImages.length}
                              </span>
                            )}
                          </button>

                          <button
                            type="submit"
                            disabled={!commentText.trim() && attachedImages.length === 0}
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
                                  onPaste={(e) => {
                                    const items = e.clipboardData.items;
                                    const imageItems: DataTransferItem[] = [];
                                    for (let i = 0; i < items.length; i++) {
                                      if (items[i].type.indexOf('image') !== -1) {
                                        imageItems.push(items[i]);
                                      }
                                    }
                                    if (imageItems.length === 0) return;

                                    const availableSlots = 5 - editingCommentImages.length;
                                    if (availableSlots <= 0) {
                                      alert('สามารถแนบรูปภาพในคอมเมนต์ได้สูงสุด 5 รูป');
                                      return;
                                    }

                                    imageItems.slice(0, availableSlots).forEach((item) => {
                                      const blob = item.getAsFile();
                                      if (blob) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          if (reader.result) {
                                            setEditingCommentImages((prev) => {
                                              if (prev.length >= 5) return prev;
                                              return [...prev, reader.result as string];
                                            });
                                          }
                                        };
                                        reader.readAsDataURL(blob);
                                      }
                                    });
                                  }}
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
                                  placeholder="แก้ไขข้อความคอมเมนต์... (สามารถกด Ctrl+V เพื่อวางรูปภาพได้)"
                                />

                                {/* Hidden file input for edit comment */}
                                <input
                                  ref={editCommentFileInputRef}
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={handleEditCommentImageFileChange}
                                  className="hidden"
                                />

                                {/* Images in Editing Mode */}
                                {editingCommentImages.length > 0 && (
                                  <div className="flex flex-wrap gap-2 items-center p-2 rounded-xl bg-neutral-100/90 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
                                    {editingCommentImages.map((imgUrl, imgIdx) => (
                                      <div key={imgIdx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900 shrink-0 shadow-xs">
                                        <img src={imgUrl} alt={`Edit preview ${imgIdx}`} className="w-full h-full object-cover" />
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveEditCommentImage(imgIdx)}
                                          title="ลบรูปนี้ออกจากคอมเมนต์"
                                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/75 hover:bg-rose-600 text-white transition-colors"
                                        >
                                          <X size={11} />
                                        </button>
                                      </div>
                                    ))}

                                    {editingCommentImages.length < 5 && (
                                      <button
                                        type="button"
                                        onClick={() => editCommentFileInputRef.current?.click()}
                                        className="w-14 h-14 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 flex flex-col items-center justify-center text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
                                        title="เพิ่มรูปภาพ (สูงสุด 5 รูป)"
                                      >
                                        <Plus size={15} />
                                        <span className="text-[9px] font-semibold">เพิ่มรูป</span>
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Action Bar */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={editingCommentImages.length >= 5}
                                      onClick={() => editCommentFileInputRef.current?.click()}
                                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-40"
                                      title={`แนบรูปภาพเพิ่ม (${editingCommentImages.length}/5)`}
                                    >
                                      <ImageIcon size={13} />
                                      <span>{editingCommentImages.length > 0 ? `รูปภาพ (${editingCommentImages.length}/5)` : 'แนบรูปภาพ'}</span>
                                    </button>
                                    <span className="text-[10px] text-neutral-400 hidden sm:inline">Ctrl+Enter เพื่อบันทึก, Esc เพื่อยกเลิก</span>
                                  </div>
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
                                      disabled={(!editingCommentText.trim() && editingCommentImages.length === 0) || isSavingCommentEdit}
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

                                {(() => {
                                  if (!c.imageUrl) return null;
                                  let imgs: string[] = [];
                                  if (c.imageUrl.startsWith('[') && c.imageUrl.endsWith(']')) {
                                    try {
                                      const parsed = JSON.parse(c.imageUrl);
                                      if (Array.isArray(parsed)) imgs = parsed;
                                    } catch {}
                                  }
                                  if (imgs.length === 0) {
                                    imgs = [c.imageUrl];
                                  }

                                  if (imgs.length === 1) {
                                    return (
                                      <div className="pl-7 pt-1">
                                        <div className="relative group inline-block">
                                          <img
                                            src={imgs[0]}
                                            alt="Comment attachment"
                                            onClick={() => openLightbox(imgs, 0)}
                                            className="max-h-36 max-w-full rounded-xl object-contain border border-neutral-200 dark:border-neutral-700 shadow-2xs cursor-zoom-in group-hover:opacity-95 transition-opacity bg-neutral-100 dark:bg-neutral-800"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => openLightbox(imgs, 0)}
                                            className="absolute bottom-1.5 right-1.5 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="ขยายรูป"
                                          >
                                            <Maximize2 size={10} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="pl-7 pt-1">
                                      <div className="flex flex-wrap gap-1.5">
                                        {imgs.slice(0, 5).map((imgUrl, imgIdx) => (
                                          <div
                                            key={imgIdx}
                                            onClick={() => openLightbox(imgs, imgIdx)}
                                            title={`รูปที่ ${imgIdx + 1}/${imgs.length} (คลิกเพื่อดูรูปขนาดเต็ม)`}
                                            className="relative w-12 h-12 sm:w-13 sm:h-13 aspect-square rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-2xs group cursor-zoom-in bg-neutral-100 dark:bg-neutral-800 shrink-0 hover:ring-2 hover:ring-blue-500 hover:scale-105 transition-all"
                                          >
                                            <img src={imgUrl} alt={`Comment photo ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/70 text-white text-[8px] font-bold rounded">
                                              {imgIdx + 1}/{imgs.length}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 2: Photos Gallery (1:1 Square Grid with Lightbox Carousel) */}
                {activeTab === 'photos' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200/80 dark:border-neutral-800 flex-wrap gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                          Photos Gallery ({cardPhotos.length})
                        </h4>
                        <p className="text-[11px] text-neutral-400">
                          รูปภาพที่อัปโหลดที่นี่หรือส่งในคอมเมนต์จะถูกจัดเก็บไว้ใน Gallery อัตโนมัติ
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          ref={photoUploadInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={handleOpenCardDriveFolder}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-sm"
                          title="เปิดโฟลเดอร์ของงานนี้ใน Google Drive (EFL-Trello > Workspace > Card)"
                        >
                          <Folder size={13} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Drive Folder</span>
                          <ExternalLink size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() => photoUploadInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                        >
                          <ImageIcon size={13} /> อัปโหลดรูปภาพ
                        </button>
                      </div>
                    </div>

                    {cardPhotos.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {cardPhotos.map((photo: any, pIdx: number) => {
                          const pUrl = photo.fileUrl?.startsWith('data:') ? photo.fileUrl : `/api/attachments/${photo.id}/view`;
                          const allPhotoUrls = cardPhotos.map((p: any) =>
                            p.fileUrl?.startsWith('data:') ? p.fileUrl : `/api/attachments/${p.id}/view`
                          );

                          return (
                            <div
                              key={photo.id}
                              className="group relative aspect-square rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 shadow-2xs hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer"
                              onClick={() => openLightbox(allPhotoUrls, pIdx)}
                            >
                              <img
                                src={pUrl}
                                alt={photo.fileName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />

                              {/* Hover Action Overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRefPhotoInComment(photo);
                                    }}
                                    title="Ref in Comment (อ้างอิงในแชท)"
                                    className="p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg transition-colors"
                                  >
                                    <AtSign size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (photo.fileUrl?.startsWith('data:')) {
                                        const link = document.createElement('a');
                                        link.href = photo.fileUrl;
                                        link.download = photo.fileName;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      } else {
                                        window.open(`/api/attachments/${photo.id}/download`, '_blank');
                                      }
                                    }}
                                    title="Download Photo"
                                    className="p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg transition-colors"
                                  >
                                    <Download size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAttachmentToDelete(photo.id);
                                    }}
                                    title="Delete Photo"
                                    className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>

                                <div className="text-white">
                                  <p className="text-[10px] font-semibold truncate leading-tight">{photo.fileName}</p>
                                  <p className="text-[9px] text-neutral-300">
                                    {photo.fileSize > 0 ? formatFileSize(photo.fileSize) : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2">
                        <ImageIcon size={32} className="mx-auto text-neutral-400" />
                        <p className="text-xs text-neutral-500">ยังไม่มีรูปภาพในการ์ดนี้</p>
                        <button
                          type="button"
                          onClick={() => photoUploadInputRef.current?.click()}
                          className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                          อัปโหลดรูปภาพแรก
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Document & Google Drive Attachments */}
                {activeTab === 'attachments' && (
                  <div className="space-y-4">
                    {/* Upload / Google Drive buttons */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs text-neutral-500">
                        Upload files or link directly to Google Drive / Docs.
                      </p>
                      
                      <div className="flex items-center gap-2">
                        {/* Open Card Folder in Google Drive */}
                        <button
                          type="button"
                          onClick={handleOpenCardDriveFolder}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-sm"
                          title="เปิดโฟลเดอร์ของงานนี้ใน Google Drive (EFL-Trello > Workspace > Card)"
                        >
                          <Folder size={13} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Drive Folder</span>
                          <ExternalLink size={10} />
                        </button>

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

                        {/* Local File Upload Button */}
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
                      {cardDocs.length > 0 ? (
                        cardDocs.map((att: any) => {
                          const isDrive = isGoogleDriveAttachment(att);
                          const docBadge = getDocBadgeStyle(att.fileName, att.fileType);

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
                                <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm shrink-0">
                                  {docBadge.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-1 py-0.2 rounded text-[9px] font-extrabold tracking-wider ${docBadge.badgeClass}`}>
                                      {docBadge.tag}
                                    </span>
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
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (att.fileUrl?.startsWith('data:')) {
                                          const link = document.createElement('a');
                                          link.href = att.fileUrl;
                                          link.download = att.fileName;
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        } else {
                                          window.open(`/api/attachments/${att.id}/download`, '_blank');
                                        }
                                      }}
                                      className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                      title="Download Attachment"
                                    >
                                      <Download size={15} />
                                    </button>
                                  </div>
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
                          ยังไม่มีไฟล์เอกสารที่อัปโหลดในการ์ดนี้
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

                  {/* Persistent Attachment File Input (always mounted regardless of activeTab) */}
                  <input
                    ref={attachmentFileInputRef}
                    type="file"
                    onChange={handleAttachmentUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('attachments');
                      setShowDrivePicker(true);
                    }}
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
                    onClick={() => {
                      setActiveTab('attachments');
                      attachmentFileInputRef.current?.click();
                    }}
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

      {/* Lightbox Zoom Modal (Carousel with Prev/Next & Keyboard Arrows) */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-100 select-none"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Zoomed attachment"
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain mx-auto transition-transform"
            />

            {/* Prev / Next buttons if multiple images */}
            {lightboxImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = lightboxIndex > 0 ? lightboxIndex - 1 : lightboxImages.length - 1;
                    setLightboxIndex(nextIdx);
                    setLightboxImage(lightboxImages[nextIdx]);
                  }}
                  className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full border border-white/20 shadow-xl transition-all cursor-pointer"
                  title="Previous image (Left Arrow ◀)"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = lightboxIndex < lightboxImages.length - 1 ? lightboxIndex + 1 : 0;
                    setLightboxIndex(nextIdx);
                    setLightboxImage(lightboxImages[nextIdx]);
                  }}
                  className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full border border-white/20 shadow-xl transition-all cursor-pointer"
                  title="Next image (Right Arrow ▶)"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            {/* Bottom bar indicator & controls */}
            <div className="mt-3 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white text-xs shadow-lg">
              {lightboxImages.length > 1 && (
                <span className="font-semibold text-neutral-300">
                  {lightboxIndex + 1} / {lightboxImages.length}
                </span>
              )}
              {lightboxImages.length > 1 && <span className="text-neutral-600">|</span>}
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="p-1 hover:text-blue-400 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={14} />
              </a>
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = lightboxImage;
                  link.download = `photo-${Date.now()}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="p-1 hover:text-blue-400 transition-colors cursor-pointer"
                title="Download image"
              >
                <Download size={14} />
              </button>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 hover:text-rose-400 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hover Photo Preview for thumbnails */}
      {hoveredPhotoPreview && (
        <div className="fixed pointer-events-none z-[100] bottom-16 right-16 p-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 animate-in fade-in zoom-in-95 max-w-xs">
          <img src={hoveredPhotoPreview.url} alt={hoveredPhotoPreview.name} className="max-h-56 max-w-full rounded-xl object-contain mx-auto" />
          <p className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200 text-center truncate mt-1.5">
            {hoveredPhotoPreview.name}
          </p>
        </div>
      )}

      {/* Move Card Modal */}
      {cardDetails && (
        <MoveCardModal
          isOpen={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          cardId={cardDetails.id}
          cardTitle={cardDetails.title}
          currentColumnId={cardDetails.columnId}
          currentBoardId={cardDetails?.column?.boardId || board?.id}
          currentWorkspaceId={cardDetails?.column?.board?.workspace?.id || cardDetails?.column?.board?.workspaceId || currentWorkspace?.id}
          onSuccess={(targetWorkspaceId, targetBoardId) => {
            setShowMoveModal(false);
            setSelectedCardId(null);
            const activeWsId = cardDetails?.column?.board?.workspace?.id || cardDetails?.column?.board?.workspaceId || currentWorkspace?.id;
            const activeBrdId = cardDetails?.column?.boardId || board?.id;

            if (targetWorkspaceId && targetWorkspaceId !== activeWsId) {
              const targetWs = workspaces.find((w) => w.id === targetWorkspaceId);
              if (targetWs) {
                setCurrentWorkspace(targetWs);
              }
              if (targetBoardId) {
                fetchBoard(targetWorkspaceId, targetBoardId);
              }
            } else if (targetBoardId && targetBoardId !== activeBrdId) {
              fetchBoard(targetWorkspaceId || activeWsId, targetBoardId);
            } else {
              fetchBoard();
            }
          }}
        />
      )}
    </>
  );
};
