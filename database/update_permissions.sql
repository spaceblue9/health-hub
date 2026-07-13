-- ==========================================
-- ADD PERMISSIONS TO PROFILES TABLE
-- ==========================================

-- Add can_share column (default false)
ALTER TABLE profiles
ADD COLUMN can_share BOOLEAN DEFAULT FALSE;

-- Add can_report column (default false)
ALTER TABLE profiles
ADD COLUMN can_report BOOLEAN DEFAULT FALSE;
