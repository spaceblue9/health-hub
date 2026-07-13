-- 1. Create a function to delete a user from auth.users
-- This function uses SECURITY DEFINER so it runs with the privileges of the creator
-- allowing it to bypass RLS and delete from the protected auth.users table.
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Security check: Only allow 'admin' users to execute this
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can delete users';
  END IF;

  -- Delete from auth.users.
  -- This will automatically cascade to public.profiles, patients, timeline_events, attachments, etc.
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
