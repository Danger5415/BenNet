/*
  # Study Material and Assignment Management System

  1. New Tables
    - `study_materials`
      - For storing course materials, notes, and resources
      - Includes metadata like title, description, file URL
      - Tracks upload date and teacher who uploaded
    
    - `assignments`
      - For managing assignments given by teachers
      - Includes title, description, due date
      - Tracks creation and last update
    
    - `assignment_submissions`
      - For storing student assignment submissions
      - Links to assignments and includes submission files
      - Tracks submission date and grades
    
    - `material_categories`
      - For organizing study materials into categories
      - Helps in better content organization

  2. Security
    - Enable RLS on all tables
    - Add policies for teachers and students
*/

-- Create material_categories table
CREATE TABLE material_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES teachers(id) ON DELETE SET NULL
);

-- Create study_materials table
CREATE TABLE study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  category_id uuid REFERENCES material_categories(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now(),
  downloads integer DEFAULT 0,
  is_published boolean DEFAULT true
);

-- Create assignments table
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  due_date timestamptz NOT NULL,
  total_points integer NOT NULL DEFAULT 100,
  file_url text,
  file_name text,
  created_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now(),
  is_published boolean DEFAULT true
);

-- Create assignment_submissions table
CREATE TABLE assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  submission_date timestamptz DEFAULT now(),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  grade integer,
  feedback text,
  graded_by uuid REFERENCES teachers(id) ON DELETE SET NULL,
  graded_at timestamptz,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'late')),
  UNIQUE(assignment_id, student_id)
);

-- Enable RLS
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for material_categories
CREATE POLICY "Everyone can view categories" ON material_categories
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage categories" ON material_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teachers WHERE id = auth.uid()
    )
  );

-- Policies for study_materials
CREATE POLICY "Everyone can view published materials" ON study_materials
  FOR SELECT USING (is_published = true);

CREATE POLICY "Teachers can manage their materials" ON study_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teachers WHERE id = auth.uid()
    )
  );

-- Policies for assignments
CREATE POLICY "Everyone can view published assignments" ON assignments
  FOR SELECT USING (is_published = true);

CREATE POLICY "Teachers can manage their assignments" ON assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teachers WHERE id = auth.uid()
    )
  );

-- Policies for assignment_submissions
CREATE POLICY "Students can view and submit their assignments" ON assignment_submissions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE email = auth.email()
    )
  );

CREATE POLICY "Students can create their submissions" ON assignment_submissions
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE email = auth.email()
    )
  );

CREATE POLICY "Teachers can view and grade submissions" ON assignment_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = assignment_submissions.assignment_id
      AND a.teacher_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_study_materials_teacher ON study_materials(teacher_id);
CREATE INDEX idx_study_materials_category ON study_materials(category_id);
CREATE INDEX idx_study_materials_subject ON study_materials(subject);
CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_subject ON assignments(subject);
CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);

-- Functions for analytics
CREATE OR REPLACE FUNCTION get_student_assignment_stats(student_id uuid)
RETURNS TABLE (
  total_assignments bigint,
  submitted_assignments bigint,
  late_submissions bigint,
  average_grade numeric,
  completion_rate numeric
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(DISTINCT a.id) as total,
      COUNT(DISTINCT s.id) as submitted,
      COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'late') as late,
      AVG(s.grade) as avg_grade
    FROM assignments a
    LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = $1
    WHERE a.is_published = true
  )
  SELECT
    total as total_assignments,
    submitted as submitted_assignments,
    late as late_submissions,
    ROUND(avg_grade::numeric, 2) as average_grade,
    CASE
      WHEN total > 0 THEN ROUND((submitted::numeric / total::numeric) * 100, 2)
      ELSE 0
    END as completion_rate
  FROM stats;
END;
$$;

-- Function to get teacher's class performance
CREATE OR REPLACE FUNCTION get_teacher_class_performance(teacher_id uuid)
RETURNS TABLE (
  subject text,
  total_students bigint,
  submission_rate numeric,
  average_grade numeric
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.subject,
    COUNT(DISTINCT s.student_id) as total_students,
    ROUND((COUNT(s.id)::numeric / COUNT(DISTINCT a.id)::numeric) * 100, 2) as submission_rate,
    ROUND(AVG(s.grade)::numeric, 2) as average_grade
  FROM assignments a
  LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
  WHERE a.teacher_id = $1
  GROUP BY a.subject;
END;
$$;

-- Insert some default categories
INSERT INTO material_categories (name, description) VALUES
  ('Lecture Notes', 'Class lecture notes and presentations'),
  ('Practice Problems', 'Exercise sheets and practice problems'),
  ('Reference Material', 'Additional reading and reference materials'),
  ('Study Guides', 'Exam preparation and study guides')
ON CONFLICT DO NOTHING;