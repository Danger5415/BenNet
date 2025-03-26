import { supabase } from '../lib/supabase';

export async function setupDatabase() {
  try {
    // Create profiles table
    await supabase.rpc('create_profiles_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
          role text NOT NULL CHECK (role IN ('student', 'admin')),
          full_name text,
          avatar_url text,
          created_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Public profiles are viewable by everyone" ON profiles
          FOR SELECT USING (true);
        
        CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);
      `
    });

    // Create students table
    await supabase.rpc('create_students_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS students (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          email text UNIQUE NOT NULL,
          full_name text NOT NULL,
          roll_number text UNIQUE NOT NULL,
          department text NOT NULL,
          year integer NOT NULL CHECK (year BETWEEN 1 AND 4),
          created_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE students ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Admin has full access" ON students
          FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
        
        CREATE POLICY "Students can view their own records" ON students
          FOR SELECT USING (auth.jwt() ->> 'email' = email);
      `
    });

    // Create attendance and class_schedules tables
    await supabase.rpc('create_attendance_tables', {
      sql: `
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

        ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
        ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Admin has full access to attendance" ON attendance
          FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

        CREATE POLICY "Students can view their own attendance" ON attendance
          FOR SELECT USING (student_id IN (
            SELECT id FROM students WHERE email = auth.jwt() ->> 'email'
          ));

        CREATE POLICY "Everyone can view class schedules" ON class_schedules
          FOR SELECT USING (true);

        CREATE POLICY "Only admin can modify class schedules" ON class_schedules
          FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
      `
    });

    // Insert sample data
    await supabase.rpc('insert_sample_data', {
      sql: `
        -- Sample class schedules
        INSERT INTO class_schedules (subject, day, start_time, end_time, room, teacher)
        SELECT * FROM (VALUES
          ('Mathematics', 'Monday', '09:00', '10:00', 'Room 101', 'Dr. Smith'),
          ('Physics', 'Monday', '11:00', '12:00', 'Room 102', 'Dr. Johnson'),
          ('Chemistry', 'Tuesday', '09:00', '10:00', 'Room 103', 'Dr. Williams'),
          ('Computer Science', 'Wednesday', '14:00', '15:00', 'Lab 201', 'Prof. Brown')
        ) AS t
        WHERE NOT EXISTS (
          SELECT 1 FROM class_schedules LIMIT 1
        );

        -- Sample students
        INSERT INTO students (email, full_name, roll_number, department, year)
        SELECT * FROM (VALUES
          ('student@campus.edu', 'John Doe', 'R2024001', 'Computer Science', 2),
          ('student2@campus.edu', 'Jane Smith', 'R2024002', 'Physics', 3),
          ('student3@campus.edu', 'Bob Wilson', 'R2024003', 'Mathematics', 1)
        ) AS t
        WHERE NOT EXISTS (
          SELECT 1 FROM students LIMIT 1
        );
      `
    });

    console.log('Database setup completed successfully');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
}