/*
  # Create attendance tracking system

  1. New Tables
    - `attendance`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `date` (date)
      - `status` (text: 'present', 'absent')
      - `class` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `attendance` table
    - Add policy for authenticated users to manage attendance

  3. Indexes
    - Add index on student_id and date for performance
    - Add unique constraint on student_id + date combination
*/

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'absent',
  class text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_status_check' 
    AND table_name = 'attendance'
  ) THEN
    ALTER TABLE attendance ADD CONSTRAINT attendance_status_check 
    CHECK (status IN ('present', 'absent'));
  END IF;
END $$;

-- Add unique constraint on student_id + date (one record per student per day)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_student_date_unique' 
    AND table_name = 'attendance'
  ) THEN
    ALTER TABLE attendance ADD CONSTRAINT attendance_student_date_unique 
    UNIQUE (student_id, date);
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class, date);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage attendance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attendance' 
    AND policyname = 'Authenticated users can manage attendance'
  ) THEN
    CREATE POLICY "Authenticated users can manage attendance"
      ON attendance
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;