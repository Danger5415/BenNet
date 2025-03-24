/*
  # Initial Schema Setup for Campus Connect

  1. Tables
    - profiles
      - id (uuid, references auth.users)
      - role (text)
      - full_name (text)
      - avatar_url (text)
      - created_at (timestamp)
    
    - issues
      - id (uuid)
      - title (text)
      - description (text)
      - status (text)
      - votes (integer)
      - created_by (uuid, references profiles)
      - created_at (timestamp)
    
    - comments
      - id (uuid)
      - issue_id (uuid, references issues)
      - content (text)
      - created_by (uuid, references profiles)
      - created_at (timestamp)
    
    - lost_found
      - id (uuid)
      - title (text)
      - description (text)
      - status (text)
      - image_url (text)
      - created_by (uuid, references profiles)
      - created_at (timestamp)
    
    - cafeteria_items
      - id (uuid)
      - name (text)
      - description (text)
      - price (decimal)
      - available (boolean)
      - rating (decimal)
      - created_at (timestamp)
    
    - events
      - id (uuid)
      - title (text)
      - description (text)
      - start_time (timestamp)
      - end_time (timestamp)
      - location (text)
      - created_by (uuid, references profiles)
      - created_at (timestamp)
    
    - tutoring_sessions
      - id (uuid)
      - tutor_id (uuid, references profiles)
      - subject (text)
      - description (text)
      - start_time (timestamp)
      - end_time (timestamp)
      - max_students (integer)
      - created_at (timestamp)
    
    - bookings
      - id (uuid)
      - session_id (uuid, references tutoring_sessions)
      - student_id (uuid, references profiles)
      - status (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create tables
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('student', 'admin')),
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  votes integer DEFAULT 0,
  created_by uuid REFERENCES profiles NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES issues ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_by uuid REFERENCES profiles NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE lost_found (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'lost' CHECK (status IN ('lost', 'found', 'claimed')),
  image_url text,
  created_by uuid REFERENCES profiles NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE cafeteria_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  available boolean DEFAULT true,
  rating decimal(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  created_by uuid REFERENCES profiles NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE tutoring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES profiles NOT NULL,
  subject text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  max_students integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES tutoring_sessions ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES profiles NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafeteria_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Issues are viewable by everyone" ON issues
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create issues" ON issues
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own issues" ON issues
  FOR UPDATE USING (auth.uid() = created_by);

-- Similar policies for other tables...