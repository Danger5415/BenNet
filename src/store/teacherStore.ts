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
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  teachers: [],
  loading: false,
  error: null,

  fetchTeachers: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ teachers: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error('Error fetching teachers:', error);
    } finally {
      set({ loading: false });
    }
  },

  addTeacher: async (teacher) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('teachers')
        .insert([teacher])
        .select()
        .single();

      if (error) throw error;
      
      const teachers = get().teachers;
      set({ teachers: [data, ...teachers] });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error('Error adding teacher:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTeacher: async (id, teacher) => {
    set({ loading: true, error: null });
    try {
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
      set({ teachers });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error('Error updating teacher:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteTeacher: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const teachers = get().teachers.filter(t => t.id !== id);
      set({ teachers });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error('Error deleting teacher:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  importTeachers: async (teachers) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('teachers')
        .insert(teachers)
        .select();

      if (error) throw error;

      const currentTeachers = get().teachers;
      set({ teachers: [...(data || []), ...currentTeachers] });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error('Error importing teachers:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));