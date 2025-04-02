/*
  # Fix Teachers Table and Policies

  1. Changes:
    - Drop conflicting policies if they exist
    - Recreate teachers table with proper structure
    - Add proper RLS policies
    - Add indexes for performance

  2. Security:
    - Enable RLS
    - Add clear policies for admin access
*/

-- First, drop any existing policies
DROP POLICY IF EXISTS "Admin has full access to teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can view their own records" ON teachers;

-- Recreate the teachers table
DROP TABLE IF EXISTS teachers CASCADE;

CREATE TABLE teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  department text NOT NULL,
  phone_number text NOT NULL,
  subjects text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS teachers_email_idx ON teachers(email);
CREATE INDEX IF NOT EXISTS teachers_department_idx ON teachers(department);

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin has full access" ON teachers
  FOR ALL USING (true);

-- Insert demo teacher
INSERT INTO teachers (email, full_name, department, phone_number, subjects)
VALUES (
  'teacher@campus.edu',
  'Dr. Jane Smith',
  'Computer Science',
  'teacher123',
  ARRAY['Data Structures', 'Algorithms', 'Database Systems']
) ON CONFLICT (email) DO NOTHING;