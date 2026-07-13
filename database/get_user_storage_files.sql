-- 2. Create a function to get all storage file URLs for a specific user
-- This bypasses RLS so the admin can get the list of files to delete from Storage.
CREATE OR REPLACE FUNCTION public.get_user_storage_files(target_user_id UUID)
RETURNS text[] AS $$
DECLARE
  profile_paths text[];
  attachment_paths text[];
  all_paths text[];
BEGIN
  -- Security check: Only allow 'admin' users to execute this
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can view user files';
  END IF;

  -- Get profile pictures
  SELECT array_agg(profile_picture_url) INTO profile_paths
  FROM public.patients
  WHERE user_id = target_user_id AND profile_picture_url IS NOT NULL;

  -- Get attachments
  WITH user_events AS (
    SELECT id FROM public.timeline_events 
    WHERE patient_id IN (SELECT id FROM public.patients WHERE user_id = target_user_id)
  )
  SELECT array_agg(file_url) INTO attachment_paths
  FROM public.attachments
  WHERE event_id IN (SELECT id FROM user_events) AND file_url IS NOT NULL;

  -- Combine arrays (handling nulls if no files found)
  all_paths := ARRAY[]::text[];
  IF profile_paths IS NOT NULL THEN
    all_paths := all_paths || profile_paths;
  END IF;
  IF attachment_paths IS NOT NULL THEN
    all_paths := all_paths || attachment_paths;
  END IF;

  RETURN all_paths;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
