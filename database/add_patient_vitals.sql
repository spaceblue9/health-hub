-- ==========================================
-- ADD VITALS AND HN TO PATIENTS
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add hn, oxygen_level, and temperature columns to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS hn TEXT,
ADD COLUMN IF NOT EXISTS oxygen_level TEXT,
ADD COLUMN IF NOT EXISTS temperature NUMERIC;
