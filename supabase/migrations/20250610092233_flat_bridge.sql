/*
  # Create app_users table and authentication system

  1. New Tables
    - `app_users`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `email` (text, unique, required)
      - `contact_number` (text, required)
      - `role` (text, default 'teacher')
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_users` table
    - Add policy for authenticated users

  3. Authentication Integration
    - Create function to link Supabase auth users to app_users
    - Create trigger to automatically create app_user record on auth signup
*/

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  contact_number text NOT NULL,
  role text NOT NULL DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint on email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'app_users_email_key' 
    AND table_name = 'app_users'
  ) THEN
    ALTER TABLE app_users ADD CONSTRAINT app_users_email_key UNIQUE (email);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_active ON app_users(is_active);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'app_users' 
    AND policyname = 'Allow all operations for authenticated users'
  ) THEN
    CREATE POLICY "Allow all operations for authenticated users"
      ON app_users
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Function to automatically create app_user when auth user is created
CREATE OR REPLACE FUNCTION link_auth_user_to_app_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (id, full_name, email, contact_number, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'contact_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to link auth users to app_users (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION link_auth_user_to_app_user();
  END IF;
END $$;

-- Insert a default admin user for testing (you can remove this later)
INSERT INTO app_users (full_name, email, contact_number, role) 
VALUES ('Admin User', 'admin@school.edu', '+1234567890', 'admin')
ON CONFLICT (email) DO NOTHING;