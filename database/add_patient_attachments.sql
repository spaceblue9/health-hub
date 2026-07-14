-- SQL Script: Add Patient Attachments Feature

-- 1. Add patient_id to attachments table
ALTER TABLE attachments ADD COLUMN patient_id UUID REFERENCES patients(id) ON DELETE CASCADE;

-- 2. Drop NOT NULL constraint on event_id so an attachment can belong to just a patient
ALTER TABLE attachments ALTER COLUMN event_id DROP NOT NULL;

-- 3. Add constraint to ensure an attachment belongs to either an event or a patient (Optional but recommended)
ALTER TABLE attachments ADD CONSTRAINT check_attachment_owner CHECK (
    (event_id IS NOT NULL AND patient_id IS NULL) OR 
    (patient_id IS NOT NULL AND event_id IS NULL)
);

-- Note: RLS policies on attachments are assumed to be handled at the application level, 
-- or if existing policies exist, they might need review. Since schema.sql didn't define 
-- specific RLS for attachments, we leave it as is or you can add policies if needed.
