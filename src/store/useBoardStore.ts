import { create } from 'zustand';
import { Board, Column, Card, Label, Priority } from '../types';

interface FilterState {
  searchQuery: string;
  selectedLabelId: string | null;
  selectedPriority: Priority | 'ALL';
  onlyMyTasks: boolean;
}

interface BoardState {
  board: Board | null;
  labels: Label[];
  activeCard: Card | null;
  selectedCardId: string | null;
  filters: FilterState;
  isLoading: boolean;

  setBoard: (board: Board) => void;
  setActiveCard: (card: Card | null) => void;
  setSelectedCardId: (id: string | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  fetchBoard: (workspaceId?: string) => Promise<void>;

  // Column Operations
  createColumn: (boardId: string, title: string) => Promise<void>;
  updateColumn: (columnId: string, title: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;

  // Card Operations
  createCard: (columnId: string, title: string, priority?: Priority) => Promise<void>;
  moveCard: (cardId: string, sourceColId: string, destColId: string, newIndex: number) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<Card> & { assigneeIds?: string[]; labelIds?: string[] }) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  addComment: (cardId: string, content: string, imageUrl?: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  labels: [],
  activeCard: null,
  selectedCardId: null,
  filters: {
    searchQuery: '',
    selectedLabelId: null,
    selectedPriority: 'ALL',
    onlyMyTasks: false
  },
  isLoading: false,

  setBoard: (board) => set({ board }),
  setActiveCard: (card) => set({ activeCard: card }),
  setSelectedCardId: (id) => set({ selectedCardId: id }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

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
      }
    } catch (err) {
      console.error('Failed to fetch board:', err);
      set({ isLoading: false });
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

  updateColumn: async (columnId: string, title: string) => {
    try {
      const res = await fetch(`/api/boards/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
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
      }
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  },

  addComment: async (cardId, content, imageUrl) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, imageUrl })
      });
      if (res.ok) {
        get().fetchBoard();
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  }
}));
