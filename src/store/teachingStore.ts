import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface TeachingSession {
  id: string;
  title: string;
  description: string;
  tutor_id: string;
  subject: string;
  start_time: string;
  end_time: string;
  max_students: number;
  session_type: 'video' | 'audio' | 'text';
  status: 'scheduled' | 'active' | 'completed';
  created_at: string;
  tutor?: {
    full_name: string;
    email: string;
  };
  participants?: {
    count: number;
    list: Array<{
      id: string;
      user_id: string;
      role: 'tutor' | 'student';
      user: {
        full_name: string;
        email: string;
      };
    }>;
  };
}

export interface TutorRequest {
  id: string;
  student_id: string;
  subject: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  student?: {
    full_name: string;
    email: string;
  };
}

interface TeachingState {
  sessions: TeachingSession[];
  tutorRequests: TutorRequest[];
  loading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  createSession: (session: Omit<TeachingSession, 'id' | 'created_at' | 'status'>) => Promise<void>;
  joinSession: (sessionId: string) => Promise<void>;
  fetchTutorRequests: () => Promise<void>;
  createTutorRequest: (request: Omit<TutorRequest, 'id' | 'created_at' | 'status' | 'student_id'>) => Promise<void>;
  updateTutorRequest: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  clearError: () => void;
}

export const useTeachingStore = create<TeachingState>((set, get) => ({
  sessions: [],
  tutorRequests: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchSessions: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('teaching_sessions')
        .select(`
          *,
          tutor:profiles!teaching_sessions_tutor_id_fkey(full_name, email),
          participants:session_participants(
            id,
            user_id,
            role,
            user:profiles!session_participants_user_id_fkey(full_name, email)
          )
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const sessionsWithParticipants = data.map(session => ({
        ...session,
        participants: {
          count: session.participants.length,
          list: session.participants
        }
      }));

      set({ sessions: sessionsWithParticipants, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sessions';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createSession: async (session) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('teaching_sessions')
        .insert([{ ...session, status: 'scheduled' }])
        .select(`
          *,
          tutor:profiles!teaching_sessions_tutor_id_fkey(full_name, email),
          participants:session_participants(
            id,
            user_id,
            role,
            user:profiles!session_participants_user_id_fkey(full_name, email)
          )
        `)
        .single();

      if (error) throw error;

      const sessionWithParticipants = {
        ...data,
        participants: {
          count: data.participants.length,
          list: data.participants
        }
      };

      const sessions = get().sessions;
      set({ sessions: [sessionWithParticipants, ...sessions], error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  joinSession: async (sessionId) => {
    try {
      set({ loading: true, error: null });
      const { data: existingParticipant, error: checkError } = await supabase
        .from('session_participants')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', supabase.auth.user()?.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingParticipant) return;

      const { error: joinError } = await supabase
        .from('session_participants')
        .insert([{
          session_id: sessionId,
          user_id: supabase.auth.user()?.id,
          role: 'student'
        }]);

      if (joinError) throw joinError;

      await get().fetchSessions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join session';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchTutorRequests: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('tutor_requests')
        .select(`
          *,
          student:profiles!tutor_requests_student_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tutorRequests: data, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tutor requests';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createTutorRequest: async (request) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('tutor_requests')
        .insert([{
          ...request,
          student_id: supabase.auth.user()?.id,
          status: 'pending'
        }])
        .select(`
          *,
          student:profiles!tutor_requests_student_id_fkey(full_name, email)
        `)
        .single();

      if (error) throw error;

      const tutorRequests = get().tutorRequests;
      set({ tutorRequests: [data, ...tutorRequests], error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create tutor request';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTutorRequest: async (id, status) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('tutor_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      const tutorRequests = get().tutorRequests.map(request =>
        request.id === id ? { ...request, status } : request
      );
      set({ tutorRequests, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tutor request';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));