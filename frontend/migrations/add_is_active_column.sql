-- Migration: Add is_active column to users table
-- Run this SQL in your Supabase SQL Editor

-- Add the is_active column with default value of true
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active by default (optional, but recommended)
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Add a comment to the column for documentation
COMMENT ON COLUMN users.is_active IS 'Indicates whether the user account is active (true) or deactivated (false). Defaults to true.';

