-- Migration: Add leave_type column to leave_requests
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50) DEFAULT 'personal';

COMMENT ON COLUMN leave_requests.leave_type IS 'Type of leave (personal, medical, academic, etc.)';

