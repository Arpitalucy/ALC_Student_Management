/*
  # Add address field to students table

  1. Changes
    - Add `address` column to students table
    - Update existing records to have empty address by default

  2. Notes
    - Address field is optional (nullable)
    - Existing students will have null address initially
*/

-- Add address column to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'address'
  ) THEN
    ALTER TABLE students ADD COLUMN address text;
  END IF;
END $$;