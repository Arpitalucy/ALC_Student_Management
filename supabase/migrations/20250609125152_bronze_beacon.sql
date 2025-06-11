/*
  # Create fee records table for monthly fee tracking

  1. New Tables
    - `fee_records`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `month` (text, format: 'YYYY-MM')
      - `year` (integer)
      - `month_name` (text, e.g., 'January', 'February')
      - `amount` (numeric)
      - `status` (text: 'paid', 'pending', 'overdue', 'not started')
      - `due_date` (date)
      - `paid_date` (date, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `fee_records` table
    - Add policy for authenticated users to manage fee records

  3. Indexes
    - Add index on student_id and month for performance
    - Add unique constraint on student_id + month combination
*/

-- Create fee_records table
CREATE TABLE IF NOT EXISTS fee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month text NOT NULL,
  year integer NOT NULL,
  month_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'not started' CHECK (status IN ('paid', 'pending', 'overdue', 'not started')),
  due_date date NOT NULL,
  paid_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint on student_id + month (one record per student per month)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fee_records_student_month_unique' 
    AND table_name = 'fee_records'
  ) THEN
    ALTER TABLE fee_records ADD CONSTRAINT fee_records_student_month_unique 
    UNIQUE (student_id, month);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fee_records_student_month ON fee_records(student_id, month);
CREATE INDEX IF NOT EXISTS idx_fee_records_status ON fee_records(status);
CREATE INDEX IF NOT EXISTS idx_fee_records_year_month ON fee_records(year, month_name);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_fee_records_updated_at ON fee_records;
CREATE TRIGGER update_fee_records_updated_at
  BEFORE UPDATE ON fee_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage fee records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fee_records' 
    AND policyname = 'Authenticated users can manage fee records'
  ) THEN
    CREATE POLICY "Authenticated users can manage fee records"
      ON fee_records
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;