import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Class {
  id: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  teacherId: string;
  teacher?: {
    full_name: string;
  };
}

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  email: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent';
  markedBy?: string;
  markedVia: 'qr' | 'manual';
  qrCode?: string;
  qrExpiry?: string;
}

interface TimetableState {
  classes: Class[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  fetchClasses: () => Promise<void>;
  fetchStudents: () => Promise<void>;
  fetchAttendance: (classId: string, date?: string) => Promise<void>;
  markAttendance: (data: {
    studentId: string;
    classId: string;
    status:  'present' | 'absent';
    markedVia: 'qr' | 'manual';
    qrCode?: string;
  }) => Promise<void>;
  generateQRCode: (classId: string) => Promise<string>;
  clearError: () => void;
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  classes: [],
  students: [],
  attendanceRecords: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchClasses: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          *,
          teacher:teachers(full_name)
        `)
        .order('start_time');

      if (error) throw error;
      set({ classes: data || [] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch classes';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchStudents: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, roll_number, email')
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
        .rpc('get_class_attendance_report', {
          p_class_id: classId,
          p_date: date
        });

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
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .single();

      const { error } = await supabase
        .rpc('mark_attendance', {
          p_student_id: studentId,
          p_class_id: classId,
          p_status: status,
          p_marked_by: teacher?.id,
          p_marked_via: markedVia,
          p_qr_code: qrCode
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
      
      const { error } = await supabase
        .from('attendance_records')
        .update({
          qr_code: qrCode,
          qr_expiry: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes expiry
        })
        .eq('class_id', classId);

      if (error) throw error;
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