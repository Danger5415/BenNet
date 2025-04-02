/*
  # Add Teachers Management System

  1. New Tables
    - `teachers`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `department` (text)
      - `phone_number` (text)
      - `subjects` (text[])
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for admin and teachers
*/

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  department text NOT NULL,
  phone_number text NOT NULL,
  subjects text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin has full access to teachers" ON teachers
  FOR ALL USING (true);

CREATE POLICY "Teachers can view their own records" ON teachers
  FOR SELECT USING (email = current_user);

-- Update class_schedules to reference teacher
ALTER TABLE class_schedules 
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL;

-- Update class_attendance to allow teachers to mark attendance
ALTER TABLE class_attendance 
  ADD COLUMN IF NOT EXISTS marked_by_teacher uuid REFERENCES teachers(id);

-- Add demo teacher
INSERT INTO teachers (email, full_name, department, phone_number, subjects)
VALUES (
  'teacher@campus.edu',
  'Dr. Jane Smith',
  'Computer Science',
  'teacher123',
  ARRAY['Data Structures', 'Algorithms', 'Database Systems']
) ON CONFLICT (email) DO NOTHING;

-- Update RLS policies for class_schedules
DROP POLICY IF EXISTS "Everyone can view class schedules" ON class_schedules;
DROP POLICY IF EXISTS "Only admin can modify class schedules" ON class_schedules;

CREATE POLICY "Everyone can view class schedules" ON class_schedules
  FOR SELECT USING (true);

CREATE POLICY "Admin and assigned teacher can modify class schedules" ON class_schedules
  FOR ALL USING (
    (SELECT role FROM auth.users WHERE email = current_user) = 'admin'
    OR
    teacher_id = (SELECT id FROM teachers WHERE email = current_user)
  );

-- Update RLS policies for class_attendance
DROP POLICY IF EXISTS "Admin has full access to attendance" ON class_attendance;
DROP POLICY IF EXISTS "Students can view their own attendance" ON class_attendance;

CREATE POLICY "Admin and teachers can manage attendance" ON class_attendance
  FOR ALL USING (
    (SELECT role FROM auth.users WHERE email = current_user) = 'admin'
    OR
    class_id IN (
      SELECT id FROM class_schedules 
      WHERE teacher_id = (SELECT id FROM teachers WHERE email = current_user)
    )
  );

CREATE POLICY "Students can view their own attendance" ON class_attendance
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE email = current_user)
  );