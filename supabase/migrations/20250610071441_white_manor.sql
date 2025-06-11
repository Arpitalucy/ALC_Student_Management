/*
  # Add absent status for exam marks

  1. Changes
    - Add is_absent column to exam_marks table
    - Update check constraint to allow -1 for absent students
    - Modify existing records to set proper absent status

  2. Notes
    - When is_absent is true, marks_obtained should be -1 (indicator value)
    - Absent students will be excluded from average calculations
*/

-- Add is_absent column to exam_marks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_marks' AND column_name = 'is_absent'
  ) THEN
    ALTER TABLE exam_marks ADD COLUMN is_absent boolean DEFAULT false;
  END IF;
END $$;

-- Update the check constraint to allow -1 for absent students
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'exam_marks_marks_obtained_check' 
    AND table_name = 'exam_marks'
  ) THEN
    ALTER TABLE exam_marks DROP CONSTRAINT exam_marks_marks_obtained_check;
  END IF;
  
  -- Add new constraint that allows -1 for absent students
  ALTER TABLE exam_marks ADD CONSTRAINT exam_marks_marks_obtained_check 
  CHECK (
    (is_absent = true AND marks_obtained = -1) OR 
    (is_absent = false AND marks_obtained >= 0)
  );
END $$;