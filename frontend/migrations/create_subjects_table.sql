-- Migration: Create subjects/courses table
-- Run this SQL in your Supabase SQL Editor

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_name VARCHAR(255) NOT NULL,
  course_code VARCHAR(50) UNIQUE NOT NULL,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  description TEXT,
  credits INTEGER DEFAULT 3 CHECK (credits >= 1 AND credits <= 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester);
CREATE INDEX IF NOT EXISTS idx_subjects_course_code ON subjects(course_code);
CREATE INDEX IF NOT EXISTS idx_subjects_created_at ON subjects(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE subjects IS 'Stores subject/course information with semester details';
COMMENT ON COLUMN subjects.semester IS 'Semester number (1-8)';
COMMENT ON COLUMN subjects.credits IS 'Credit hours for the subject (1-6)';

-- Enable Row Level Security (RLS)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to insert subjects
CREATE POLICY "Admins can insert subjects"
  ON subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policy to allow admins to update subjects
CREATE POLICY "Admins can update subjects"
  ON subjects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policy to allow admins to delete subjects
CREATE POLICY "Admins can delete subjects"
  ON subjects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policy to allow all authenticated users to read subjects
CREATE POLICY "Authenticated users can read subjects"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_subjects_updated_at();





