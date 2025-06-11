/*
  # Create academics system for exam and marks management

  1. New Tables
    - `exams`
      - `id` (uuid, primary key)
      - `name` (text, exam name)
      - `class` (text, class/grade)
      - `subject` (text, subject name)
      - `total_marks` (numeric, maximum marks)
      - `exam_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `exam_marks`
      - `id` (uuid, primary key)
      - `exam_id` (uuid, foreign key to exams)
      - `student_id` (uuid, foreign key to students)
      - `marks_obtained` (numeric, marks secured by student)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users

  3. Indexes
    - Performance indexes for common queries
*/

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class text NOT NULL,
  subject text NOT NULL,
  total_marks numeric NOT NULL CHECK (total_marks > 0),
  exam_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exam_marks table
CREATE TABLE IF NOT EXISTS exam_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marks_obtained numeric NOT NULL CHECK (marks_obtained >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint on exam_id + student_id (one mark per student per exam)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'exam_marks_exam_student_unique' 
    AND table_name = 'exam_marks'
  ) THEN
    ALTER TABLE exam_marks ADD CONSTRAINT exam_marks_exam_student_unique 
    UNIQUE (exam_id, student_id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exams_class_subject ON exams(class, subject);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_marks_exam_id ON exam_marks(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_marks_student_id ON exam_marks(student_id);

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_exams_updated_at ON exams;
CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_marks_updated_at ON exam_marks;
CREATE TRIGGER update_exam_marks_updated_at
  BEFORE UPDATE ON exam_marks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_marks ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exams' 
    AND policyname = 'Authenticated users can manage exams'
  ) THEN
    CREATE POLICY "Authenticated users can manage exams"
      ON exams
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exam_marks' 
    AND policyname = 'Authenticated users can manage exam marks'
  ) THEN
    CREATE POLICY "Authenticated users can manage exam marks"
      ON exam_marks
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;