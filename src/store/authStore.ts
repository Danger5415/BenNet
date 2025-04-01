import { create } from 'zustand';
import { supabase, checkStudentExists, getStudentDetails } from '../lib/supabase';

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

      // Check if student exists in the database
      const studentExists = await checkStudentExists(email);
      if (!studentExists) {
        throw new Error('Student not found. Please contact administrator.');
      }

      // Get student details
      const studentDetails = await getStudentDetails(email);
      
      // Verify password (phone number)
      if (password !== studentDetails.phone_number) {
        throw new Error('Invalid password');
      }

      // Set user with student details
      set({
        user: {
          id: studentDetails.id,
          email: studentDetails.email,
          role: 'student',
          full_name: studentDetails.full_name,
          roll_number: studentDetails.roll_number,
          department: studentDetails.department,
          year: studentDetails.year
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