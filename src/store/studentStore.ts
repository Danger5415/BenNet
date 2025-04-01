import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Student {
  id: string;
  email: string;
  full_name: string;
  roll_number: string;
  phone_number: string;
  department: string;
  year: number;
  created_at?: string;
}

interface StudentState {
  students: Student[];
  loading: boolean;
  error: string | null;
  fetchStudents: () => Promise<void>;
  addStudent: (student: Omit<Student, 'id' | 'created_at'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  importStudents: (students: Array<Omit<Student, 'id' | 'created_at'>>) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  loading: false,
  error: null,

  fetchStudents: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ students: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error('Error fetching students:', error);
    } finally {
      set({ loading: false });
    }
  },

  addStudent: async (student) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([student])
        .select()
        .single();

      if (error) throw error;
      
      const students = get().students;
      set({ students: [data, ...students] });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error('Error adding student:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateStudent: async (id, student) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('students')
        .update(student)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const students = get().students.map(s => 
        s.id === id ? { ...s, ...data } : s
      );
      set({ students });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error('Error updating student:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteStudent: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const students = get().students.filter(s => s.id !== id);
      set({ students });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error('Error deleting student:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  importStudents: async (students) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('students')
        .insert(students)
        .select();

      if (error) throw error;

      const currentStudents = get().students;
      set({ students: [...(data || []), ...currentStudents] });
    } catch (error) {
      set({ error: (error as Error).message });
      console.error('Error importing students:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));