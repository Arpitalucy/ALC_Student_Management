/*
  # Create events table for event management

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `event_type` (text, required)
      - `event_date` (date, required)
      - `event_time` (time)
      - `reminder` (text, default 'On time')
      - `created_by` (uuid, foreign key to app_users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `events` table
    - Add policy for authenticated users to manage events

  3. Indexes
    - Add index on event_date for performance
    - Add index on event_type for filtering
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL CHECK (event_type IN ('PTM', 'Exam', 'Holiday', 'Meeting', 'Workshop', 'Sports', 'Cultural', 'Other')),
  event_date date NOT NULL,
  event_time time DEFAULT '10:00:00',
  reminder text DEFAULT 'On time' CHECK (reminder IN ('On time', '15 minutes before', '30 minutes before', '1 hour before', '1 day before')),
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Authenticated users can manage events'
  ) THEN
    CREATE POLICY "Authenticated users can manage events"
      ON events
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;