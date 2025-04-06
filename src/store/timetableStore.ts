import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Student {
  id: string;
  email: string;
  full_name: string;
  roll_number: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent';
  marked_by?: string;
  marked_via: 'qr' | 'manual';
  qr_code?: string;
  qr_expiry?: string;
  student?: {
    full_name: string;
    roll_number: string;
  };
}

interface TimetableState {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  fetchStudents: () => Promise<void>;
  fetchAttendance: (classId: string, date?: string) => Promise<void>;
  markAttendance: (data: {
    studentId: string;
    classId: string;
    status: 'present' | 'absent';
    markedVia: 'qr' | 'manual';
    qrCode?: string;
  }) => Promise<void>;
  generateQRCode: (classId: string) => Promise<string>;
  clearError: () => void;
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  students: [],
  attendanceRecords: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchStudents: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('students')
        .select('id, email, full_name, roll_number')
        .order('roll_number');

      if (error) throw error;
      set({ students: data || [] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch students';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchAttendance: async (classId: string, date = new Date().toISOString().split('T')[0]) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          student:students(full_name, roll_number)
        `)
        .eq('class_id', classId)
        .eq('date', date);

      if (error) throw error;
      set({ attendanceRecords: data || [] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendance';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  markAttendance: async ({ studentId, classId, status, markedVia, qrCode }) => {
    try {
      set({ loading: true, error: null });

      // Get teacher ID
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .limit(1);

      if (teacherError) throw teacherError;

      const teacherId = teacherData?.[0]?.id;
      if (!teacherId) {
        throw new Error('No teacher found to mark attendance');
      }

      const attendanceData = {
        student_id: studentId,
        class_id: classId,
        date: new Date().toISOString().split('T')[0],
        status,
        marked_by: teacherId,
        marked_via: markedVia,
        qr_code: qrCode,
        qr_expiry: qrCode ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null
      };

      const { error } = await supabase
        .from('attendance_records')
        .upsert(attendanceData, {
          onConflict: 'student_id,class_id,date'
        });

      if (error) throw error;

      // Refresh attendance data
      await get().fetchAttendance(classId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark attendance';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  generateQRCode: async (classId: string) => {
    try {
      set({ loading: true, error: null });
      const qrCode = `${classId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      return qrCode;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));