-- ==========================================
-- FIX CAREGIVER DISPLAY (Profiles JOIN)
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Fix Foreign Key in patient_access
-- Change user_id to reference public.profiles(id) instead of auth.users(id)
-- This allows PostgREST to automatically resolve the relationship for queries like: select('*, profiles(email)')
ALTER TABLE public.patient_access
  DROP CONSTRAINT IF EXISTS patient_access_user_id_fkey;

ALTER TABLE public.patient_access
  ADD CONSTRAINT patient_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Update RLS Policy on profiles
-- Allow patient owners to view the profiles (e.g. emails) of their caregivers
DROP POLICY IF EXISTS "Users can view co-caregiver profiles" ON public.profiles;

CREATE POLICY "Users can view co-caregiver profiles" ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_access pa
    JOIN public.patients p ON p.id = pa.patient_id
    WHERE pa.user_id = profiles.id AND p.user_id = auth.uid()
  )
);
