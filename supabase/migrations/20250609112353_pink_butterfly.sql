/*
  # Create students table

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, unique, not null)
      - `phone` (text, not null)
      - `class` (text, not null)
      - `attendance` (numeric, default 0)
      - `fee_status` (text, default 'not started')
      - `fee_amount` (numeric, not null)
      - `enrollment_date` (date, not null)
      - `created_at` (timestamp, default now())
      - `updated_at` (timestamp, default now())

  2. Security
    - Enable RLS on `students` table
    - Add policy for authenticated users to manage students
*/

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  class text NOT NULL,
  attendance numeric DEFAULT 0 CHECK (attendance >= 0 AND attendance <= 100),
  fee_status text DEFAULT 'not started' CHECK (fee_status IN ('paid', 'pending', 'overdue', 'not started')),
  fee_amount numeric NOT NULL CHECK (fee_amount >= 0),
  enrollment_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage students"
  ON students
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();