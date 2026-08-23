import { create } from 'zustand';
import { User, Role } from '../types';
import { useWorkspaceStore } from './useWorkspaceStore';

interface AuthState {
  currentUser: User | null;
  users: User[];
  isDarkMode: boolean;
  language: 'th' | 'en';
  isLoading: boolean;
  isSettingsOpen: boolean;
  settingsInitialTab: 'profile' | 'notifications' | 'googledrive' | 'members' | 'labels';
  
  setCurrentUser: (user: User) => void;
  setUsers: (users: User[]) => void;
  toggleDarkMode: (explicit?: boolean) => void;
  setLanguage: (lang: 'th' | 'en') => void;
  openSettings: (tab?: 'profile' | 'notifications' | 'googledrive' | 'members' | 'labels') => void;
  closeSettings: () => void;
  fetchUsers: () => Promise<void>;
  loginWithSsoToken: (token: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  updateUserRole: (userId: string, role: Role) => Promise<boolean>;
  updateUserStatus: (userId: string, isActive: boolean) => Promise<boolean>;
  inviteUser: (email: string, name: string, role: Role, jobTitle?: string) => Promise<boolean>;
}

// Read initial session from localStorage
const getSavedUser = (): User | null => {
  try {
    const saved = localStorage.getItem('efl_sso_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getSavedUser(),
  users: [],
  isDarkMode: false,
  language: 'th',
  isLoading: false,
  isSettingsOpen: false,
  settingsInitialTab: 'profile',

  setCurrentUser: (user) => {
    try {
      localStorage.setItem('efl_sso_user', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user session:', e);
    }
    set({ 
      currentUser: user,
      language: (user.language as 'th' | 'en') || 'th'
    });
    if (user.theme === 'dark') {
      get().toggleDarkMode(true);
    } else if (user.theme === 'light') {
      get().toggleDarkMode(false);
    }
    // Fetch only workspaces that this user owns or is invited to
    useWorkspaceStore.getState().fetchWorkspaces(user.id);
  },

  setUsers: (users) => set({ users }),

  toggleDarkMode: (explicit) => {
    const next = explicit !== undefined ? explicit : !get().isDarkMode;
    set({ isDarkMode: next });
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  setLanguage: (language) => set({ language }),

  openSettings: (tab = 'profile') => set({ isSettingsOpen: true, settingsInitialTab: tab }),
  closeSettings: () => set({ isSettingsOpen: false }),

  fetchUsers: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/users');
      if (res.ok) {
        const users = await res.json();
        const existingUser = get().currentUser;
        
        // If current user is in the database, refresh their latest info
        if (existingUser) {
          const refreshed = users.find((u: User) => u.id === existingUser.id || u.email === existingUser.email);
          if (refreshed) {
            get().setCurrentUser(refreshed);
          }
        }
        
        set({
          users,
          isLoading: false
        });
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      set({ isLoading: false });
    }
  },

  loginWithSsoToken: async (token: string) => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/sso-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          get().setCurrentUser(data.user);
          await get().fetchUsers();
          set({ isLoading: false });
          return true;
        }
      }
      set({ isLoading: false });
      return false;
    } catch (err) {
      console.error('Failed SSO token exchange:', err);
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    try {
      localStorage.removeItem('efl_sso_user');
      localStorage.removeItem('efl_sso_token');
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
    set({ currentUser: null });
  },

  updateProfile: async (data) => {
    const currentUser = get().currentUser;
    if (!currentUser) return false;

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          ...data
        })
      });

      if (res.ok) {
        const updated = await res.json();
        set({
          currentUser: updated,
          users: get().users.map((u) => (u.id === updated.id ? updated : u))
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update profile:', err);
      return false;
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      if (res.ok) {
        const updated = await res.json();
        set({
          users: get().users.map((u) => (u.id === updated.id ? updated : u)),
          currentUser: get().currentUser?.id === updated.id ? updated : get().currentUser
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update user role:', err);
      return false;
    }
  },

  updateUserStatus: async (userId, isActive) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (res.ok) {
        const updated = await res.json();
        set({
          users: get().users.map((u) => (u.id === updated.id ? updated : u)),
          currentUser: get().currentUser?.id === updated.id ? updated : get().currentUser
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update user status:', err);
      return false;
    }
  },

  inviteUser: async (email, name, role, jobTitle) => {
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role, jobTitle })
      });

      if (res.ok) {
        await get().fetchUsers();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to invite user:', err);
      return false;
    }
  }
}));
