-- ==========================================
-- CO-CAREGIVER MIGRATION
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add email to profiles (for displaying caregivers)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill existing emails
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Update trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (new.id, new.email, 'user', 'pending');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create patient_access table
CREATE TABLE IF NOT EXISTS public.patient_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    role TEXT DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(patient_id, user_id)
);

ALTER TABLE public.patient_access ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_patient_owner(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = p_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can manage patient_access for their patients" ON public.patient_access;

CREATE POLICY "Users can manage patient_access for their patients"
ON public.patient_access FOR ALL
USING (
  public.is_patient_owner(patient_id) OR
  user_id = auth.uid()
);

-- 2. Create caregiver_invites table
CREATE TABLE IF NOT EXISTS public.caregiver_invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.caregiver_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage invites for their patients" ON public.caregiver_invites;

CREATE POLICY "Users can manage invites for their patients"
ON public.caregiver_invites FOR ALL
USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Public can view invites" ON public.caregiver_invites;

CREATE POLICY "Public can view invites"
ON public.caregiver_invites FOR SELECT
USING (true);

-- 3. Update RLS on patients table
DROP POLICY IF EXISTS "Users can manage their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can manage accessible patients" ON public.patients;

CREATE POLICY "Users can manage accessible patients"
ON public.patients FOR ALL
USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.patient_access WHERE patient_access.patient_id = patients.id AND patient_access.user_id = auth.uid())
);

-- 4. Update RLS on timeline_events
DROP POLICY IF EXISTS "Users can manage their patients' events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can manage events for accessible patients" ON public.timeline_events;

CREATE POLICY "Users can manage events for accessible patients"
ON public.timeline_events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = timeline_events.patient_id 
    AND (
      patients.user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.patient_access WHERE patient_access.patient_id = patients.id AND patient_access.user_id = auth.uid())
    )
  )
);

-- 5. Update RLS on attachments
DROP POLICY IF EXISTS "Users can manage attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can manage attachments for accessible patients" ON public.attachments;

CREATE POLICY "Users can manage attachments for accessible patients"
ON public.attachments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.timeline_events 
    JOIN public.patients ON timeline_events.patient_id = patients.id
    WHERE timeline_events.id = attachments.event_id 
    AND (
      patients.user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.patient_access WHERE patient_access.patient_id = patients.id AND patient_access.user_id = auth.uid())
    )
  )
);
