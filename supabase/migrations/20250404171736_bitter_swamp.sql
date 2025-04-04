/*
  # Video Chat System Enhancement

  1. New Tables
    - `video_sessions`
      - For managing active video/audio sessions
      - Tracks session type, participants, and status
    
    - `session_participants`
      - For tracking participants in each session
      - Stores connection info and status

  2. Security
    - Enable RLS
    - Add policies for participants
*/

-- Create video_sessions table
CREATE TABLE video_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type text NOT NULL CHECK (session_type IN ('video', 'audio')),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  room_id text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  max_participants integer DEFAULT 50,
  recording_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create session_participants table
CREATE TABLE session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES video_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id text NOT NULL,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  camera_enabled boolean DEFAULT true,
  microphone_enabled boolean DEFAULT true,
  screen_sharing boolean DEFAULT false,
  UNIQUE(session_id, user_id)
);

-- Create indexes
CREATE INDEX idx_video_sessions_status ON video_sessions(status);
CREATE INDEX idx_video_sessions_room ON video_sessions(room_id);
CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_user ON session_participants(user_id);
CREATE INDEX idx_session_participants_connection ON session_participants(connection_id);

-- Enable RLS
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Policies for video_sessions
CREATE POLICY "Anyone can view active sessions" ON video_sessions
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create sessions" ON video_sessions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Session creator can update session" ON video_sessions
  FOR UPDATE USING (auth.uid() = created_by);

-- Policies for session_participants
CREATE POLICY "Participants can view session info" ON session_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM video_sessions
      WHERE id = session_participants.session_id
      AND status = 'active'
    )
  );

CREATE POLICY "Users can join sessions" ON session_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM video_sessions
      WHERE id = session_participants.session_id
      AND status = 'active'
    )
  );

CREATE POLICY "Users can update their own status" ON session_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION create_video_session(
  p_session_type text,
  p_created_by uuid,
  p_room_id text,
  p_max_participants integer DEFAULT 50,
  p_recording_enabled boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id uuid;
BEGIN
  INSERT INTO video_sessions (
    session_type,
    created_by,
    room_id,
    max_participants,
    recording_enabled
  ) VALUES (
    p_session_type,
    p_created_by,
    p_room_id,
    p_max_participants,
    p_recording_enabled
  ) RETURNING id INTO v_session_id;

  -- Add creator as first participant
  INSERT INTO session_participants (
    session_id,
    user_id,
    connection_id
  ) VALUES (
    v_session_id,
    p_created_by,
    gen_random_uuid()::text
  );

  RETURN v_session_id;
END;
$$;