import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  role: 'student' | 'admin' | 'teacher';
  full_name?: string;
  roll_number?: string;
  phone_number?: string;
  department?: string;
  year?: number;
  subjects?: string[];
  created_at?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  rememberMe: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserDetails: (details: Partial<User>) => void;
  setRememberMe: (value: boolean) => void;
}

// Admin credentials
const ADMIN_EMAIL = 'admin@campus.edu';
const ADMIN_PASSWORD = 'admin123';

// Demo student credentials
const DEMO_STUDENT = {
  email: 'student@campus.edu',
  password: 'student123'
};

// Demo teacher credentials
const DEMO_TEACHER = {
  email: 'teacher@campus.edu',
  password: 'teacher123'
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,
      rememberMe: false,

      setRememberMe: (value: boolean) => set({ rememberMe: value }),

      signIn: async (email: string, password: string, remember: boolean) => {
        set({ loading: true, error: null });
        try {
          // Check for admin login
          if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            const adminUser = {
              id: 'admin',
              email: ADMIN_EMAIL,
              role: 'admin' as const
            };
            set({
              user: adminUser,
              error: null,
              rememberMe: remember
            });
            return;
          }

          // Check for demo student
          if (email === DEMO_STUDENT.email && password === DEMO_STUDENT.password) {
            const studentUser = {
              id: 'demo-student',
              email: DEMO_STUDENT.email,
              role: 'student' as const,
              full_name: 'John Doe',
              roll_number: 'R2024001',
              department: 'Computer Science',
              year: 2
            };
            set({
              user: studentUser,
              error: null,
              rememberMe: remember
            });
            return;
          }

          // Check for demo teacher
          if (email === DEMO_TEACHER.email && password === DEMO_TEACHER.password) {
            const teacherUser = {
              id: 'demo-teacher',
              email: DEMO_TEACHER.email,
              role: 'teacher' as const,
              full_name: 'Dr. Jane Smith',
              department: 'Computer Science',
              subjects: ['Data Structures', 'Algorithms', 'Database Systems']
            };
            set({
              user: teacherUser,
              error: null,
              rememberMe: remember
            });
            return;
          }

          // Check for student in database
          const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('email', email)
            .single();

          if (student && student.phone_number === password) {
            set({
              user: {
                id: student.id,
                email: student.email,
                role: 'student',
                full_name: student.full_name,
                roll_number: student.roll_number,
                phone_number: student.phone_number,
                department: student.department,
                year: student.year,
                created_at: student.created_at
              },
              error: null,
              rememberMe: remember
            });
            return;
          }

          // Check for teacher in database
          const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('*')
            .eq('email', email)
            .single();

          if (teacher && teacher.phone_number === password) {
            set({
              user: {
                id: teacher.id,
                email: teacher.email,
                role: 'teacher',
                full_name: teacher.full_name,
                department: teacher.department,
                phone_number: teacher.phone_number,
                subjects: teacher.subjects,
                created_at: teacher.created_at
              },
              error: null,
              rememberMe: remember
            });
            return;
          }

          throw new Error('Invalid credentials');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign in';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        set({ loading: true });
        try {
          set({ user: null, error: null, rememberMe: false });
        } finally {
          set({ loading: false });
        }
      },

      updateUserDetails: (details) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...details } : null
        }));
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        rememberMe: state.rememberMe
      })
    }
  )
);