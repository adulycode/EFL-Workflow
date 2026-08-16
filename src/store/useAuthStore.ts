import { create } from 'zustand';
import { User } from '../types';
import { useWorkspaceStore } from './useWorkspaceStore';

interface AuthState {
  currentUser: User | null;
  users: User[];
  isDarkMode: boolean;
  isLoading: boolean;
  
  setCurrentUser: (user: User) => void;
  setUsers: (users: User[]) => void;
  toggleDarkMode: () => void;
  fetchUsers: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  users: [],
  isDarkMode: false,
  isLoading: false,

  setCurrentUser: (user) => {
    set({ currentUser: user });
    // When switching user, strictly fetch only workspaces that this user owns or is invited to
    useWorkspaceStore.getState().fetchWorkspaces(user.id);
  },

  setUsers: (users) => set({ users }),

  toggleDarkMode: () => {
    const next = !get().isDarkMode;
    set({ isDarkMode: next });
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  fetchUsers: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const users = await res.json();
        const initialUser = get().currentUser || users[0] || null;
        set({
          users,
          currentUser: initialUser,
          isLoading: false
        });
        if (initialUser) {
          useWorkspaceStore.getState().fetchWorkspaces(initialUser.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      set({ isLoading: false });
    }
  }
}));
