-- Migration: Create class_switches table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS class_switches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  target_teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  switch_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'completed'
  target_teacher_accepted BOOLEAN DEFAULT false,
  admin_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_class_switches_requester ON class_switches(requester_teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_switches_target ON class_switches(target_teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_switches_status ON class_switches(status);
CREATE INDEX IF NOT EXISTS idx_class_switches_created_at ON class_switches(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE class_switches ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view switches they're involved in
CREATE POLICY "Teachers can view own switches"
  ON class_switches
  FOR SELECT
  TO authenticated
  USING (
    requester_teacher_id = auth.uid() OR
    target_teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Teachers can create switch requests
CREATE POLICY "Teachers can create switch requests"
  ON class_switches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_teacher_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
  );

-- Policy: Target teachers can update their acceptance
CREATE POLICY "Target teachers can accept switches"
  ON class_switches
  FOR UPDATE
  TO authenticated
  USING (
    target_teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

