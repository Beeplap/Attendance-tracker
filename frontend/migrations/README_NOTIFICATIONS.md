# Notifications Table Migration

## Overview
This migration creates a `notifications` table to store notifications sent by admins to teachers and other users.

## Steps to Run Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** (in the left sidebar)

2. **Run the Migration SQL**
   - Copy and paste the SQL from `create_notifications_table.sql`
   - Or run this SQL directly:

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_role VARCHAR(50) DEFAULT 'teacher',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Users can read notifications for their role"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    recipient_role = 'all' OR
    recipient_role = (
      SELECT role FROM users WHERE id = auth.uid()
    )
  );
```

3. **Verify the Table**
   - Go to **Table Editor** > `notifications` table
   - You should see the table with the following columns:
     - `id` (UUID, Primary Key)
     - `title` (VARCHAR)
     - `message` (TEXT)
     - `sender_id` (UUID, Foreign Key to users)
     - `recipient_role` (VARCHAR) - 'teacher', 'student', or 'all'
     - `created_at` (TIMESTAMP)
     - `updated_at` (TIMESTAMP)

## Table Structure

- **id**: Unique identifier for each notification
- **title**: Notification title (max 255 characters)
- **message**: Notification message content
- **sender_id**: ID of the admin who sent the notification
- **recipient_role**: Target audience ('teacher', 'student', or 'all')
- **created_at**: Timestamp when notification was created
- **updated_at**: Timestamp when notification was last updated

## Security

- Row Level Security (RLS) is enabled
- Only admins can insert notifications
- Users can only read notifications intended for their role

## Usage

After running the migration, admins can:
1. Go to the Admin Dashboard
2. Click "Send Notification" in Quick Actions
3. Fill in the title and message
4. Select the recipient (All Teachers, All Students, or All Users)
5. Send the notification

Teachers and students will be able to view notifications intended for them (this feature can be added to their dashboards).

