/*
  # Create syllabus tracking system

  1. New Tables
    - `syllabus_tracking`
      - `id` (uuid, primary key)
      - `class` (text, required)
      - `subject` (text, required)
      - `chapter_name` (text, required)
      - `physical_class_conducted` (boolean, default false)
      - `chapter_end_test_status` (boolean, default false)
      - `notes_distribution_status` (text, default 'Undistributed')
      - `revision_status` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `syllabus_tracking` table
    - Add policy for authenticated users to manage syllabus tracking

  3. Constraints
    - Unique constraint on class + subject + chapter_name
    - Check constraint for notes_distribution_status enum values
*/

-- Create syllabus_tracking table
CREATE TABLE IF NOT EXISTS syllabus_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class text NOT NULL,
  subject text NOT NULL,
  chapter_name text NOT NULL,
  physical_class_conducted boolean DEFAULT false,
  chapter_end_test_status boolean DEFAULT false,
  notes_distribution_status text NOT NULL DEFAULT 'Undistributed' CHECK (notes_distribution_status IN ('Distributed', 'Undistributed')),
  revision_status boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint on class + subject + chapter_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'syllabus_tracking_class_subject_chapter_unique' 
    AND table_name = 'syllabus_tracking'
  ) THEN
    ALTER TABLE syllabus_tracking ADD CONSTRAINT syllabus_tracking_class_subject_chapter_unique 
    UNIQUE (class, subject, chapter_name);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_syllabus_tracking_class_subject ON syllabus_tracking(class, subject);
CREATE INDEX IF NOT EXISTS idx_syllabus_tracking_class ON syllabus_tracking(class);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_syllabus_tracking_updated_at ON syllabus_tracking;
CREATE TRIGGER update_syllabus_tracking_updated_at
  BEFORE UPDATE ON syllabus_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE syllabus_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage syllabus tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'syllabus_tracking' 
    AND policyname = 'Authenticated users can manage syllabus tracking'
  ) THEN
    CREATE POLICY "Authenticated users can manage syllabus tracking"
      ON syllabus_tracking
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;