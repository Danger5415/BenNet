import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  role: 'student' | 'admin';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// For demo purposes, using mock users
const mockUsers = {
  'admin@campus.edu': { id: '1', email: 'admin@campus.edu', password: 'admin123', role: 'admin' as const },
  'student@campus.edu': { id: '2', email: 'student@campus.edu', password: 'student123', role: 'student' as const },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      // For demo purposes, using mock authentication
      const user = mockUsers[email as keyof typeof mockUsers];
      if (user && user.password === password) {
        set({ user: { id: user.id, email: user.email, role: user.role } });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  signOut: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
}));