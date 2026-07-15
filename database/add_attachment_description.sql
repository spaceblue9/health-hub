-- ==========================================
-- ADD DESCRIPTION TO ATTACHMENTS
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add description column to attachments table
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS description TEXT;
