/*
  # Initial Data Setup for Campus Connect

  1. Initial Data
    - Insert demo admin and student users
    - Insert sample cafeteria menu items
    - Insert sample events
    - Insert sample tutoring sessions

  2. Additional Tables
    - attendance
      - For tracking student attendance
    - class_schedules
      - For managing class timetables
*/

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by uuid REFERENCES profiles(id),
  marked_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Create class schedules table
CREATE TABLE IF NOT EXISTS class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  day text NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text NOT NULL,
  teacher text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance
CREATE POLICY "Admin has full access to attendance" ON attendance
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Students can view their own attendance" ON attendance
  FOR SELECT USING (student_id IN (
    SELECT id FROM students WHERE email = auth.jwt() ->> 'email'
  ));

-- RLS Policies for class schedules
CREATE POLICY "Everyone can view class schedules" ON class_schedules
  FOR SELECT USING (true);

CREATE POLICY "Only admin can modify class schedules" ON class_schedules
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert sample class schedules
INSERT INTO class_schedules (subject, day, start_time, end_time, room, teacher) VALUES
  ('Mathematics', 'Monday', '09:00', '10:00', 'Room 101', 'Dr. Smith'),
  ('Physics', 'Monday', '11:00', '12:00', 'Room 102', 'Dr. Johnson'),
  ('Chemistry', 'Tuesday', '09:00', '10:00', 'Room 103', 'Dr. Williams'),
  ('Computer Science', 'Wednesday', '14:00', '15:00', 'Lab 201', 'Prof. Brown');

-- Insert sample cafeteria items
INSERT INTO cafeteria_items (name, description, price, rating) VALUES
  ('Besan Chilla', 'With sweet and green chutney, Boiled egg, Banana, Cornflakes', 5.99, 4.5),
  ('Shahi Paneer', 'With Jeera Rice, Sambhar, Roti, Onion-Cucumber Salad', 7.99, 4.2),
  ('Bhelpuri', 'With Sweet and Green chutney, Tea/Nimbu Paani', 3.99, 4.8),
  ('Kadai Vegetable', 'With Onion Rice, Roti, Fruit Custard, Hot n Sour soup', 6.99, 4.6);

-- Insert sample events
INSERT INTO events (title, description, start_time, end_time, location, created_by) VALUES
  (
    'Tech Symposium 2024',
    'Annual technology conference featuring industry experts',
    '2024-03-15 09:00:00+00',
    '2024-03-15 17:00:00+00',
    'Main Auditorium',
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
  ),
  (
    'Campus Music Festival',
    'Live performances by student bands and artists',
    '2024-03-20 18:00:00+00',
    '2024-03-20 22:00:00+00',
    'Student Center Plaza',
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
  );

-- Insert sample tutoring sessions
INSERT INTO tutoring_sessions (tutor_id, subject, description, start_time, end_time, max_students) VALUES
  (
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
    'Advanced Mathematics',
    'Calculus and Linear Algebra tutoring session',
    '2024-03-15 14:00:00+00',
    '2024-03-15 16:00:00+00',
    5
  ),
  (
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
    'Computer Science',
    'Data Structures and Algorithms',
    '2024-03-16 10:00:00+00',
    '2024-03-16 12:00:00+00',
    8
  );