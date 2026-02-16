import { create } from 'zustand';
import type { UserInfo } from '../lib/api';
import { fetchCurrentUser, loginWithGoogle, logout as apiLogout } from '../lib/api';

interface AuthStore {
  user: UserInfo | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  login: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    set({ loading: true });
    const user = await fetchCurrentUser();
    set({ user, loading: false, initialized: true });
  },

  login: async (idToken: string) => {
    set({ loading: true });
    const user = await loginWithGoogle(idToken);
    set({ user, loading: false });
    return user !== null;
  },

  logout: async () => {
    await apiLogout();
    set({ user: null });
  },
}));
