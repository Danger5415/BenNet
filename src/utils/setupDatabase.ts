import { supabase } from '../lib/supabase';

async function createTableIfNotExists(tableName: string, schema: string) {
  try {
    const { error } = await supabase.query(schema);
    if (error) {
      console.error(`Error creating ${tableName} table:`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Error creating ${tableName} table:`, error);
    return false;
  }
}

export async function setupDatabase() {
  try {
    // Create students table if it doesn't exist
    const studentsTable = await createTableIfNotExists('students', `
      CREATE TABLE IF NOT EXISTS students (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE NOT NULL,
        full_name text NOT NULL,
        roll_number text UNIQUE NOT NULL,
        phone_number text NOT NULL,
        department text NOT NULL,
        year integer NOT NULL CHECK (year BETWEEN 1 AND 4),
        created_at timestamptz DEFAULT now()
      );

      ALTER TABLE students ENABLE ROW LEVEL SECURITY;

      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Admin has full access'
        ) THEN
          CREATE POLICY "Admin has full access" ON students
            FOR ALL USING (true);
        END IF;
      END $$;

      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Students can view their own records'
        ) THEN
          CREATE POLICY "Students can view their own records" ON students
            FOR SELECT USING (true);
        END IF;
      END $$;
    `);

    // Create issues table if it doesn't exist
    const issuesTable = await createTableIfNotExists('issues', `
      CREATE TABLE IF NOT EXISTS issues (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        status text NOT NULL DEFAULT 'open',
        upvotes integer DEFAULT 0,
        downvotes integer DEFAULT 0,
        created_by text NOT NULL,
        created_at timestamptz DEFAULT now()
      );

      ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'issues' AND policyname = 'Everyone can view issues'
        ) THEN
          CREATE POLICY "Everyone can view issues" ON issues FOR SELECT USING (true);
        END IF;
      END $$;
    `);

    // Create events table if it doesn't exist
    const eventsTable = await createTableIfNotExists('events', `
      CREATE TABLE IF NOT EXISTS events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        start_time timestamptz NOT NULL,
        end_time timestamptz NOT NULL,
        location text,
        capacity integer,
        registered integer DEFAULT 0,
        created_by text NOT NULL,
        created_at timestamptz DEFAULT now()
      );

      ALTER TABLE events ENABLE ROW LEVEL SECURITY;

      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Everyone can view events'
        ) THEN
          CREATE POLICY "Everyone can view events" ON events FOR SELECT USING (true);
        END IF;
      END $$;
    `);

    // Create cafeteria_menu table if it doesn't exist
    const cafeteriaTable = await createTableIfNotExists('cafeteria_menu', `
      CREATE TABLE IF NOT EXISTS cafeteria_menu (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        meal_type text NOT NULL,
        rating numeric(3,2) DEFAULT 0,
        total_ratings integer DEFAULT 0,
        day_of_week integer NOT NULL,
        created_at timestamptz DEFAULT now()
      );

      ALTER TABLE cafeteria_menu ENABLE ROW LEVEL SECURITY;

      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'cafeteria_menu' AND policyname = 'Everyone can view menu'
        ) THEN
          CREATE POLICY "Everyone can view menu" ON cafeteria_menu FOR SELECT USING (true);
        END IF;
      END $$;
    `);

    // Create tutoring_sessions table if it doesn't exist
    const tutoringTable = await createTableIfNotExists('tutoring_sessions', `
      CREATE TABLE IF NOT EXISTS tutoring_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        subject text NOT NULL,
        description text,
        tutor text NOT NULL,
        start_time timestamptz NOT NULL,
        end_time timestamptz NOT NULL,
        max_students integer NOT NULL,
        enrolled integer DEFAULT 0,
        status text DEFAULT 'upcoming',
        created_at timestamptz DEFAULT now()
      );

      ALTER TABLE tutoring_sessions ENABLE ROW LEVEL SECURITY;

      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'tutoring_sessions' AND policyname = 'Everyone can view sessions'
        ) THEN
          CREATE POLICY "Everyone can view sessions" ON tutoring_sessions FOR SELECT USING (true);
        END IF;
      END $$;
    `);

    // Insert demo student if not exists
    const { data: existingStudent, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('email', 'student@campus.edu')
      .single();

    if (!existingStudent && !checkError) {
      const { error: insertError } = await supabase
        .from('students')
        .insert([
          {
            email: 'student@campus.edu',
            full_name: 'John Doe',
            roll_number: 'R2024001',
            phone_number: 'student123',
            department: 'Computer Science',
            year: 2
          }
        ]);

      if (insertError) {
        console.error('Error inserting demo student:', insertError);
      }
    }

    console.log('Database setup completed successfully');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
}