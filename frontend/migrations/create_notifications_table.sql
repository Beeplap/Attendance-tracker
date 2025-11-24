-- Migration: Create notifications table
-- Run this SQL in your Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_role VARCHAR(50) DEFAULT 'teacher', -- 'teacher', 'student', 'all'
  recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'Stores notifications sent by admins to teachers and other users';
COMMENT ON COLUMN notifications.recipient_role IS 'Target audience: teacher, student, or all';

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to insert notifications
CREATE POLICY "Admins can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policy to allow users to read notifications for their role
CREATE POLICY "Users can read notifications for their role"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    recipient_role = 'all'
    OR recipient_role = (
      SELECT role FROM users WHERE id = auth.uid()
    )
    OR recipient_user_id = auth.uid()
  );

