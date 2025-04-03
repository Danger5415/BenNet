/*
  # Teaching System Enhancement

  1. New Tables
    - `teaching_sessions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `tutor_id` (uuid, references profiles)
      - `subject` (text)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `max_students` (integer)
      - `session_type` (text - video/audio/text)
      - `status` (text - scheduled/active/completed)
      - `created_at` (timestamptz)

    - `session_participants`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references teaching_sessions)
      - `user_id` (uuid, references profiles)
      - `role` (text - tutor/student)
      - `joined_at` (timestamptz)

    - `session_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references teaching_sessions)
      - `user_id` (uuid, references profiles)
      - `content` (text)
      - `type` (text - text/system)
      - `created_at` (timestamptz)

    - `tutor_requests`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references profiles)
      - `subject` (text)
      - `description` (text)
      - `status` (text - pending/approved/rejected)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for tutors and students
*/

-- Create teaching_sessions table
CREATE TABLE IF NOT EXISTS teaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  tutor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  max_students integer NOT NULL DEFAULT 10,
  session_type text NOT NULL CHECK (session_type IN ('video', 'audio', 'text')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- Create session_participants table
CREATE TABLE IF NOT EXISTS session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES teaching_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('tutor', 'student')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Create session_messages table
CREATE TABLE IF NOT EXISTS session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES teaching_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'system')),
  created_at timestamptz DEFAULT now()
);

-- Create tutor_requests table
CREATE TABLE IF NOT EXISTS tutor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE teaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_requests ENABLE ROW LEVEL SECURITY;

-- Policies for teaching_sessions
CREATE POLICY "Anyone can view teaching sessions" ON teaching_sessions
  FOR SELECT USING (true);

CREATE POLICY "Tutors and admins can create sessions" ON teaching_sessions
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND (role = 'admin' OR role = 'teacher')
      )
    )
  );

CREATE POLICY "Tutors can update own sessions" ON teaching_sessions
  FOR UPDATE USING (
    auth.uid() = tutor_id
  );

-- Policies for session_participants
CREATE POLICY "Participants can view their sessions" ON session_participants
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM teaching_sessions
        WHERE id = session_id AND tutor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can join sessions" ON session_participants
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM teaching_sessions
      WHERE id = session_id AND status = 'scheduled'
    )
  );

-- Policies for session_messages
CREATE POLICY "Participants can view session messages" ON session_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = session_messages.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages" ON session_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = session_messages.session_id
      AND user_id = auth.uid()
    )
  );

-- Policies for tutor_requests
CREATE POLICY "Students can create tutor requests" ON tutor_requests
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    student_id = auth.uid()
  );

CREATE POLICY "Students can view own requests" ON tutor_requests
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update tutor requests" ON tutor_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_tutor ON teaching_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_status ON teaching_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_session ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_tutor_requests_student ON tutor_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_requests_status ON tutor_requests(status);