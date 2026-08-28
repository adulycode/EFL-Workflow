import { create } from 'zustand';
import { Workspace } from '../types';
import { useBoardStore } from './useBoardStore';
import { useAuthStore } from './useAuthStore';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;

  setCurrentWorkspace: (workspace: Workspace) => void;
  fetchWorkspaces: (userId?: string) => Promise<void>;
  createWorkspace: (data: { name: string; description?: string; icon?: string; color?: string; ownerId: string }) => Promise<Workspace | null>;
  inviteMember: (workspaceId: string, userId: string, role?: string) => Promise<boolean>;
  inviteMembersBatch: (workspaceId: string, userIds: string[], role?: string) => Promise<boolean>;
  removeMember: (workspaceId: string, userId: string) => Promise<boolean>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentWorkspace: null,
  workspaces: [],
  isLoading: false,

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
    useBoardStore.getState().fetchBoard(workspace.id);
  },

  fetchWorkspaces: async (userId?: string) => {
    try {
      set({ isLoading: true });
      const currentUserId = userId || useAuthStore.getState().currentUser?.id;
      const url = currentUserId ? `/api/workspaces?userId=${currentUserId}` : '/api/workspaces';
      
      const res = await fetch(url);
      if (res.ok) {
        const data: Workspace[] = await res.json();
        const active = get().currentWorkspace;
        const matched = active ? data.find((w) => w.id === active.id) : data[0];

        set({
          workspaces: data,
          currentWorkspace: matched || null,
          isLoading: false
        });

        if (matched) {
          useBoardStore.getState().fetchBoard(matched.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
      set({ isLoading: false });
    }
  },

  createWorkspace: async (data) => {
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const newSpace = await res.json();
        await get().fetchWorkspaces(data.ownerId);
        get().setCurrentWorkspace(newSpace);
        return newSpace;
      }
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
    return null;
  },

  inviteMember: async (workspaceId, userId, role = 'MEMBER') => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      });
      if (res.ok) {
        const activeUid = useAuthStore.getState().currentUser?.id;
        await get().fetchWorkspaces(activeUid);
        return true;
      }
    } catch (err) {
      console.error('Failed to invite member:', err);
    }
    return false;
  },

  inviteMembersBatch: async (workspaceId, userIds, role = 'MEMBER') => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, role })
      });
      if (res.ok) {
        const activeUid = useAuthStore.getState().currentUser?.id;
        await get().fetchWorkspaces(activeUid);
        return true;
      }
    } catch (err) {
      console.error('Failed to batch invite members:', err);
    }
    return false;
  },

  removeMember: async (workspaceId, userId) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const activeUid = useAuthStore.getState().currentUser?.id;
        await get().fetchWorkspaces(activeUid);
        return true;
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
    return false;
  }
}));
