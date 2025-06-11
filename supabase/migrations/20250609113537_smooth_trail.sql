/*
  # Create students table

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, unique, required)
      - `phone` (text, required)
      - `class` (text, required)
      - `attendance` (numeric, 0-100%, default 0)
      - `fee_status` (text, enum values, default 'not started')
      - `fee_amount` (numeric, non-negative, required)
      - `enrollment_date` (date, required)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `students` table
    - Add policy for authenticated users to manage all student data

  3. Constraints
    - Unique constraint on email
    - Check constraints for attendance (0-100%), fee_amount (>=0), and fee_status enum
    - Automatic updated_at timestamp trigger
*/

-- Create the students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  class text NOT NULL,
  attendance numeric DEFAULT 0,
  fee_status text DEFAULT 'not started',
  fee_amount numeric NOT NULL,
  enrollment_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint on email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'students_email_key' 
    AND table_name = 'students'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_email_key UNIQUE (email);
  END IF;
END $$;

-- Add check constraint for attendance (0-100%)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'students_attendance_check' 
    AND table_name = 'students'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_attendance_check 
    CHECK (attendance >= 0 AND attendance <= 100);
  END IF;
END $$;

-- Add check constraint for fee_amount (non-negative)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'students_fee_amount_check' 
    AND table_name = 'students'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_fee_amount_check 
    CHECK (fee_amount >= 0);
  END IF;
END $$;

-- Add check constraint for fee_status (enum values)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'students_fee_status_check' 
    AND table_name = 'students'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_fee_status_check 
    CHECK (fee_status IN ('paid', 'pending', 'overdue', 'not started'));
  END IF;
END $$;

-- Create function to update updated_at timestamp (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ language 'plpgsql';
  END IF;
END $$;

-- Create trigger to automatically update updated_at (drop and recreate to ensure it's correct)
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage students (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' 
    AND policyname = 'Authenticated users can manage students'
  ) THEN
    CREATE POLICY "Authenticated users can manage students"
      ON students
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;