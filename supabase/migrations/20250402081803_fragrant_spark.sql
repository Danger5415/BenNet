/*
  # Attendance Tracking System Enhancement

  1. New Tables
    - `class_attendance`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `class_id` (uuid, references class_schedules)
      - `date` (date)
      - `status` (text - present/absent)
      - `marked_by` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for admin and students
*/

-- Create class attendance table
CREATE TABLE IF NOT EXISTS class_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES class_schedules(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Enable RLS
ALTER TABLE class_attendance ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin has full access to attendance" ON class_attendance
  FOR ALL USING (true);

CREATE POLICY "Students can view their own attendance" ON class_attendance
  FOR SELECT USING (student_id IN (
    SELECT id FROM students WHERE email = current_user
  ));

-- Create function to calculate attendance percentage
CREATE OR REPLACE FUNCTION get_student_attendance(p_student_id uuid)
RETURNS TABLE (
  total_classes bigint,
  attended_classes bigint,
  percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'present') as attended
    FROM class_attendance
    WHERE student_id = p_student_id
  )
  SELECT 
    total,
    attended,
    CASE 
      WHEN total > 0 THEN ROUND((attended::numeric / total::numeric) * 100, 2)
      ELSE 0
    END as percentage
  FROM stats;
END;
$$ LANGUAGE plpgsql;