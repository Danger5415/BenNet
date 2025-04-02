/*
  # Setup Student Authentication

  1. Ensure Students Table Structure
    - Add phone_number column if not exists
    - Add necessary indexes
    - Update RLS policies

  2. Security
    - Enable RLS
    - Add policies for authentication
*/

-- Add phone_number column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE students ADD COLUMN phone_number text NOT NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS students_email_idx ON students(email);
CREATE INDEX IF NOT EXISTS students_roll_number_idx ON students(roll_number);

-- Ensure RLS is enabled
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin has full access" ON students;
DROP POLICY IF EXISTS "Students can view their own records" ON students;

-- Create new policies
CREATE POLICY "Admin has full access" ON students
  FOR ALL USING (true);

CREATE POLICY "Students can view their own records" ON students
  FOR SELECT USING (email = current_user);

-- Insert demo student if not exists
INSERT INTO students (id, email, full_name, roll_number, phone_number, department, year)
SELECT 
  gen_random_uuid(),
  'student@campus.edu',
  'John Doe',
  'R2024001',
  'student123',
  'Computer Science',
  2
WHERE NOT EXISTS (
  SELECT 1 FROM students WHERE email = 'student@campus.edu'
);