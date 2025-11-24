-- Migration: Add additional KYC fields to students table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100),
  ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN DEFAULT false;

COMMENT ON COLUMN students.kyc_completed IS 'Indicates if the student has completed their KYC/profile information.';


