import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  teacher_id: string;
  subject: string;
  due_date: string;
  total_points: number;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  last_updated: string;
  is_published: boolean;
  teacher?: {
    full_name: string;
    email: string;
  };
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_date: string;
  file_url: string;
  file_name: string;
  file_size: number;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  status: 'draft' | 'submitted' | 'graded' | 'late';
  student?: {
    full_name: string;
    email: string;
  };
}

interface AssignmentState {
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  loading: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  fetchSubmissions: (assignmentId?: string) => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id' | 'created_at' | 'last_updated'>) => Promise<void>;
  updateAssignment: (id: string, assignment: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  submitAssignment: (submission: Omit<AssignmentSubmission, 'id' | 'submission_date' | 'status'>) => Promise<void>;
  gradeSubmission: (submissionId: string, grade: number, feedback: string) => Promise<void>;
  clearError: () => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  submissions: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchAssignments: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          teacher:teachers(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ assignments: data || [] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchSubmissions: async (assignmentId?: string) => {
    try {
      set({ loading: true, error: null });
      let query = supabase
        .from('assignment_submissions')
        .select(`
          *,
          student:students(full_name, email)
        `)
        .order('submission_date', { ascending: false });

      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      set({ submissions: data || [] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch submissions';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addAssignment: async (assignment) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('assignments')
        .insert([assignment])
        .select(`
          *,
          teacher:teachers(full_name, email)
        `)
        .single();

      if (error) throw error;
      
      const assignments = get().assignments;
      set({ assignments: [data, ...assignments] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add assignment';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateAssignment: async (id, assignment) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('assignments')
        .update(assignment)
        .eq('id', id)
        .select(`
          *,
          teacher:teachers(full_name, email)
        `)
        .single();

      if (error) throw error;

      const assignments = get().assignments.map(a => 
        a.id === id ? { ...a, ...data } : a
      );
      set({ assignments });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update assignment';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteAssignment: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const assignments = get().assignments.filter(a => a.id !== id);
      set({ assignments });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete assignment';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  submitAssignment: async (submission) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('assignment_submissions')
        .insert([{
          ...submission,
          status: 'submitted'
        }])
        .select(`
          *,
          student:students(full_name, email)
        `)
        .single();

      if (error) throw error;
      
      const submissions = get().submissions;
      set({ submissions: [data, ...submissions] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit assignment';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  gradeSubmission: async (submissionId, grade, feedback) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          grade,
          feedback,
          status: 'graded',
          graded_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select(`
          *,
          student:students(full_name, email)
        `)
        .single();

      if (error) throw error;

      const submissions = get().submissions.map(s => 
        s.id === submissionId ? { ...s, ...data } : s
      );
      set({ submissions });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to grade submission';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));