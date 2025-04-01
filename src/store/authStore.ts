import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  role: 'student' | 'admin';
  full_name?: string;
  roll_number?: string;
  department?: string;
  year?: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Admin credentials
const ADMIN_EMAIL = 'admin@campus.edu';
const ADMIN_PASSWORD = 'admin123';

// Demo student credentials
const DEMO_STUDENT = {
  email: 'student@campus.edu',
  password: 'student123'
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      // Check for admin login
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        set({
          user: {
            id: 'admin',
            email: ADMIN_EMAIL,
            role: 'admin'
          }
        });
        return;
      }

      // Check for demo student
      if (email === DEMO_STUDENT.email && password === DEMO_STUDENT.password) {
        set({
          user: {
            id: 'demo-student',
            email: DEMO_STUDENT.email,
            role: 'student',
            full_name: 'John Doe',
            roll_number: 'R2024001',
            department: 'Computer Science',
            year: 2
          }
        });
        return;
      }

      // For other students, check the database
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        throw new Error('Student not found. Please contact administrator.');
      }

      // Verify password (phone number)
      if (password !== student.phone_number) {
        throw new Error('Invalid password');
      }

      // Set user with student details
      set({
        user: {
          id: student.id,
          email: student.email,
          role: 'student',
          full_name: student.full_name,
          roll_number: student.roll_number,
          department: student.department,
          year: student.year
        }
      });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
}));