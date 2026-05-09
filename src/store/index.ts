import { create } from 'zustand';

interface AuthState {
  user: { uid: string; email: string; name: string; role?: string; team?: string } | null;
  setUser: (user: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  loading: true,
  setLoading: (loading) => set({ loading }),
}));
