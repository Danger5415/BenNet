import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Teacher {
  id: string;
  email: string;
  full_name: string;
  department: string;
  phone_number: string;
  subjects: string[];
  created_at?: string;
}

interface TeacherState {
  teachers: Teacher[];
  loading: boolean;
  error: string | null;
  fetchTeachers: () => Promise<void>;
  addTeacher: (teacher: Omit<Teacher, 'id' | 'created_at'>) => Promise<void>;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  importTeachers: (teachers: Array<Omit<Teacher, 'id' | 'created_at'>>) => Promise<void>;
  clearError: () => void;
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  teachers: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchTeachers: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ teachers: data || [], error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch teachers';
      set({ error: errorMessage, teachers: [] });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addTeacher: async (teacher) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('teachers')
        .insert([teacher])
        .select()
        .single();

      if (error) throw error;
      
      const teachers = get().teachers;
      set({ teachers: [data, ...teachers], error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add teacher';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTeacher: async (id, teacher) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('teachers')
        .update(teacher)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const teachers = get().teachers.map(t => 
        t.id === id ? { ...t, ...data } : t
      );
      set({ teachers, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update teacher';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteTeacher: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const teachers = get().teachers.filter(t => t.id !== id);
      set({ teachers, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete teacher';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  importTeachers: async (teachers) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('teachers')
        .insert(teachers)
        .select();

      if (error) throw error;

      const currentTeachers = get().teachers;
      set({ teachers: [...(data || []), ...currentTeachers], error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import teachers';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));