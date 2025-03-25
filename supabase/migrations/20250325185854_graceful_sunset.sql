/*
  # Add Students Table

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `roll_number` (text, unique)
      - `department` (text)
      - `year` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on students table
    - Add policies for:
      - Admin can perform all operations
      - Students can only view their own records
*/

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  roll_number text UNIQUE NOT NULL,
  department text NOT NULL,
  year integer NOT NULL CHECK (year BETWEEN 1 AND 4),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin has full access" ON students
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Students can view their own records" ON students
  FOR SELECT USING (auth.jwt() ->> 'email' = email);