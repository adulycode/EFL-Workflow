import { create } from 'zustand';
import { Board, Column, Card, Label, Priority, ViewMode } from '../types';

export type DueDateFilterStatus = 'ALL' | 'OVERDUE' | 'TODAY' | 'THIS_WEEK' | 'NO_DATE';
export type { ViewMode };

export interface FilterState {
  searchQuery: string;
  selectedLabelId: string | null;
  selectedPriority: Priority | 'ALL';
  selectedAssigneeId: string | null;
  selectedDueDateStatus: DueDateFilterStatus;
  onlyMyTasks: boolean;
}

interface BoardState {
  board: Board | null;
  labels: Label[];
  archivedCards: Card[];
  activeCard: Card | null;
  selectedCardId: string | null;
  filters: FilterState;
  viewMode: ViewMode;
  isLoading: boolean;

  setBoard: (board: Board) => void;
  setActiveCard: (card: Card | null) => void;
  setSelectedCardId: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  fetchBoard: (workspaceId?: string) => Promise<void>;
  fetchArchivedCards: () => Promise<void>;

  // Column Operations
  createColumn: (boardId: string, title: string) => Promise<void>;
  updateColumn: (columnId: string, data: string | { title?: string; autoArchiveDays?: number }) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;

  // Card Operations
  createCard: (columnId: string, title: string, priority?: Priority) => Promise<void>;
  moveCard: (cardId: string, sourceColId: string, destColId: string, newIndex: number) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<Card> & { assigneeIds?: string[]; labelIds?: string[]; assigneesData?: Array<{ userId: string; type: string }> }) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  archiveCard: (cardId: string) => Promise<void>;
  restoreCard: (cardId: string) => Promise<void>;
  addComment: (cardId: string, content: string, imageUrl?: string, userId?: string) => Promise<void>;
  updateComment: (cardId: string, commentId: string, content: string, userId?: string) => Promise<boolean>;
  deleteComment: (cardId: string, commentId: string, userId?: string) => Promise<boolean>;

  // Attachment Operations
  addAttachment: (cardId: string, data: { fileName: string; fileUrl: string; fileType?: string; fileSize?: number; userId?: string }) => Promise<void>;
  deleteAttachment: (cardId: string, attachmentId: string) => Promise<void>;

  // Board Operations
  updateBoard: (boardId: string, data: { title?: string; description?: string; icon?: string; background?: string }) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;

  // Label Operations
  createLabel: (name: string, colorBg: string, colorText: string) => Promise<void>;
  updateLabel: (labelId: string, data: { name?: string; colorBg?: string; colorText?: string }) => Promise<void>;
  deleteLabel: (labelId: string) => Promise<void>;
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  selectedLabelId: null,
  selectedPriority: 'ALL',
  selectedAssigneeId: null,
  selectedDueDateStatus: 'ALL',
  onlyMyTasks: false
};

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  labels: [],
  archivedCards: [],
  activeCard: null,
  selectedCardId: null,
  filters: DEFAULT_FILTERS,
  viewMode: 'board',
  isLoading: false,

  setBoard: (board) => set({ board }),
  setActiveCard: (card) => set({ activeCard: card }),
  setSelectedCardId: (id) => set({ selectedCardId: id }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  fetchBoard: async (workspaceId?: string) => {
    try {
      set({ isLoading: true });
      const currentBoard = get().board;
      const targetWsId = workspaceId || currentBoard?.workspaceId;
      const url = targetWsId ? `/api/boards?workspaceId=${targetWsId}` : '/api/boards';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        set({ board: data.board, labels: data.labels, isLoading: false });
        if (data.board) {
          get().fetchArchivedCards();
        }
      }
    } catch (err) {
      console.error('Failed to fetch board:', err);
      set({ isLoading: false });
    }
  },

  fetchArchivedCards: async () => {
    const board = get().board;
    if (!board) return;
    try {
      const res = await fetch(`/api/boards/${board.id}/archived`);
      if (res.ok) {
        const data = await res.json();
        set({ archivedCards: data });
      }
    } catch (err) {
      console.error('Failed to fetch archived cards:', err);
    }
  },

  // Column Actions
  createColumn: async (boardId: string, title: string) => {
    try {
      const res = await fetch('/api/boards/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, title })
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to create column:', err);
    }
  },

  updateColumn: async (columnId: string, data: string | { title?: string; autoArchiveDays?: number }) => {
    try {
      const payload = typeof data === 'string' ? { title: data } : data;
      const res = await fetch(`/api/boards/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to update column:', err);
    }
  },

  deleteColumn: async (columnId: string) => {
    try {
      const res = await fetch(`/api/boards/columns/${columnId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to delete column:', err);
    }
  },

  createCard: async (columnId: string, title: string, priority: Priority = 'MEDIUM') => {
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId, title, priority })
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  },

  moveCard: async (cardId, sourceColId, destColId, newIndex) => {
    const currentBoard = get().board;
    if (!currentBoard) return;

    const clonedColumns = currentBoard.columns.map((col) => ({
      ...col,
      cards: [...col.cards]
    }));

    const sourceCol = clonedColumns.find((c) => c.id === sourceColId);
    const destCol = clonedColumns.find((c) => c.id === destColId);
    if (!sourceCol || !destCol) return;

    const cardIndex = sourceCol.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const [movedCard] = sourceCol.cards.splice(cardIndex, 1);
    movedCard.columnId = destColId;
    destCol.cards.splice(newIndex, 0, movedCard);

    const prevCard = destCol.cards[newIndex - 1];
    const nextCard = destCol.cards[newIndex + 1];
    let position = 1000;

    if (!prevCard && !nextCard) position = 1000;
    else if (!prevCard) position = (nextCard?.position || 1000) / 2;
    else if (!nextCard) position = prevCard.position + 1000;
    else position = (prevCard.position + nextCard.position) / 2;

    movedCard.position = position;

    set({ board: { ...currentBoard, columns: clonedColumns } });

    try {
      await fetch(`/api/cards/${cardId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: destColId, position })
      });
    } catch (err) {
      console.error('Failed to persist move:', err);
      set({ board: currentBoard });
    }
  },

  updateCard: async (cardId, updates) => {
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to update card:', err);
    }
  },

  deleteCard: async (cardId) => {
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
      if (res.ok) {
        set({ selectedCardId: null });
        get().fetchBoard();
        get().fetchArchivedCards();
      }
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  },

  archiveCard: async (cardId) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true })
      });
      if (res.ok) {
        set({ selectedCardId: null });
        get().fetchBoard();
        get().fetchArchivedCards();
      }
    } catch (err) {
      console.error('Failed to archive card:', err);
    }
  },

  restoreCard: async (cardId) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false })
      });
      if (res.ok) {
        get().fetchBoard();
        get().fetchArchivedCards();
      }
    } catch (err) {
      console.error('Failed to restore card:', err);
    }
  },

  addComment: async (cardId, content, imageUrl, userId) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, imageUrl, userId })
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  },

  updateComment: async (cardId, commentId, content, userId) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userId })
      });
      if (res.ok) {
        get().fetchBoard();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update comment:', err);
      return false;
    }
  },

  deleteComment: async (cardId, commentId, userId) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/comments/${commentId}?userId=${encodeURIComponent(userId || '')}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        get().fetchBoard();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete comment:', err);
      return false;
    }
  },

  // Attachments Actions
  addAttachment: async (cardId, data) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to add attachment:', err);
    }
  },

  deleteAttachment: async (cardId, attachmentId) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  },

  // Labels Actions
  createLabel: async (name, colorBg, colorText) => {
    try {
      const res = await fetch('/api/boards/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, colorBg, colorText })
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to create label:', err);
    }
  },

  updateLabel: async (labelId, data) => {
    try {
      const res = await fetch(`/api/boards/labels/${labelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to update label:', err);
    }
  },

  // Board Operations
  updateBoard: async (boardId, data) => {
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          board: state.board?.id === boardId ? { ...state.board, ...updated } : state.board
        }));
      }
    } catch (err) {
      console.error('Failed to update board:', err);
    }
  },

  deleteBoard: async (boardId) => {
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to delete board:', err);
    }
  },

  deleteLabel: async (labelId) => {
    try {
      const res = await fetch(`/api/boards/labels/${labelId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to delete label:', err);
    }
  }
}));
