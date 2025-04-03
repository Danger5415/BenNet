/*
  # Enhanced Attendance System

  1. New Tables
    - `attendance_records`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `class_id` (uuid, references class_schedules)
      - `date` (date)
      - `status` (text - present/absent)
      - `marked_by` (uuid, references teachers)
      - `marked_via` (text - qr/manual)
      - `qr_code` (text, for temporary QR codes)
      - `qr_expiry` (timestamptz)
      - `created_at` (timestamptz)

  2. Functions
    - `get_student_attendance_report`
      - Get detailed attendance report for a student
    - `get_class_attendance_report`
      - Get attendance report for a class
    - `mark_attendance`
      - Mark attendance with validation

  3. Security
    - Enable RLS
    - Add policies for teachers and students
*/

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES class_schedules(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by uuid REFERENCES teachers(id),
  marked_via text NOT NULL CHECK (marked_via IN ('qr', 'manual')),
  qr_code text,
  qr_expiry timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_qr ON attendance_records(qr_code) WHERE qr_code IS NOT NULL;

-- Enable RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Teachers can manage attendance for their classes" ON attendance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM class_schedules cs
      WHERE cs.id = attendance_records.class_id
      AND cs.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own attendance" ON attendance_records
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE email = auth.email()
    )
  );

-- Create function to get student attendance report
CREATE OR REPLACE FUNCTION get_student_attendance_report(
  p_student_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  subject text,
  total_classes bigint,
  classes_attended bigint,
  attendance_percentage numeric,
  last_attendance_date date,
  last_attendance_status text
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH attendance_stats AS (
    SELECT
      cs.subject,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE ar.status = 'present') as attended,
      MAX(ar.date) as last_date,
      (array_agg(ar.status ORDER BY ar.date DESC))[1] as last_status
    FROM class_schedules cs
    LEFT JOIN attendance_records ar ON cs.id = ar.class_id
      AND ar.student_id = p_student_id
      AND (p_start_date IS NULL OR ar.date >= p_start_date)
      AND (p_end_date IS NULL OR ar.date <= p_end_date)
    GROUP BY cs.subject
  )
  SELECT
    subject,
    total as total_classes,
    attended as classes_attended,
    ROUND((attended::numeric / NULLIF(total, 0) * 100)::numeric, 2) as attendance_percentage,
    last_date as last_attendance_date,
    last_status as last_attendance_status
  FROM attendance_stats;
END;
$$;

-- Create function to get class attendance report
CREATE OR REPLACE FUNCTION get_class_attendance_report(
  p_class_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  student_name text,
  student_roll text,
  status text,
  marked_at timestamptz,
  marked_by_name text
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.full_name as student_name,
    s.roll_number as student_roll,
    COALESCE(ar.status, 'not_marked') as status,
    ar.created_at as marked_at,
    t.full_name as marked_by_name
  FROM students s
  LEFT JOIN attendance_records ar ON s.id = ar.student_id
    AND ar.class_id = p_class_id
    AND ar.date = p_date
  LEFT JOIN teachers t ON ar.marked_by = t.id
  ORDER BY s.roll_number;
END;
$$;

-- Create function to mark attendance with validation
CREATE OR REPLACE FUNCTION mark_attendance(
  p_student_id uuid,
  p_class_id uuid,
  p_status text,
  p_marked_by uuid,
  p_marked_via text DEFAULT 'manual',
  p_qr_code text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  v_class_exists boolean;
  v_student_exists boolean;
  v_is_duplicate boolean;
  v_qr_valid boolean;
BEGIN
  -- Validate inputs
  IF p_status NOT IN ('present', 'absent') THEN
    RAISE EXCEPTION 'Invalid status. Must be present or absent.';
  END IF;

  IF p_marked_via NOT IN ('qr', 'manual') THEN
    RAISE EXCEPTION 'Invalid marking method. Must be qr or manual.';
  END IF;

  -- Check if class exists
  SELECT EXISTS (
    SELECT 1 FROM class_schedules WHERE id = p_class_id
  ) INTO v_class_exists;

  IF NOT v_class_exists THEN
    RAISE EXCEPTION 'Invalid class ID.';
  END IF;

  -- Check if student exists
  SELECT EXISTS (
    SELECT 1 FROM students WHERE id = p_student_id
  ) INTO v_student_exists;

  IF NOT v_student_exists THEN
    RAISE EXCEPTION 'Invalid student ID.';
  END IF;

  -- Check for duplicate attendance
  SELECT EXISTS (
    SELECT 1 FROM attendance_records
    WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND date = CURRENT_DATE
  ) INTO v_is_duplicate;

  -- If QR code is provided, validate it
  IF p_marked_via = 'qr' AND p_qr_code IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM attendance_records
      WHERE qr_code = p_qr_code
      AND qr_expiry > now()
    ) INTO v_qr_valid;

    IF NOT v_qr_valid THEN
      RAISE EXCEPTION 'Invalid or expired QR code.';
    END IF;
  END IF;

  -- Insert or update attendance record
  IF v_is_duplicate THEN
    UPDATE attendance_records
    SET status = p_status,
        marked_by = p_marked_by,
        marked_via = p_marked_via,
        qr_code = p_qr_code,
        qr_expiry = CASE 
          WHEN p_marked_via = 'qr' 
          THEN now() + interval '5 minutes'
          ELSE NULL
        END
    WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND date = CURRENT_DATE;
  ELSE
    INSERT INTO attendance_records (
      student_id,
      class_id,
      status,
      marked_by,
      marked_via,
      qr_code,
      qr_expiry
    ) VALUES (
      p_student_id,
      p_class_id,
      p_status,
      p_marked_by,
      p_marked_via,
      p_qr_code,
      CASE 
        WHEN p_marked_via = 'qr' 
        THEN now() + interval '5 minutes'
        ELSE NULL
      END
    );
  END IF;

  RETURN true;
END;
$$;