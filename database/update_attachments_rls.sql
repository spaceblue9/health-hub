-- Update RLS Policy for attachments to support both event_id and patient_id

DROP POLICY IF EXISTS "Users can manage attachments for accessible patients" ON public.attachments;

CREATE POLICY "Users can manage attachments for accessible patients"
ON public.attachments FOR ALL
USING (
  -- Case 1: Attachment is linked to a timeline event
  (
    attachments.event_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.timeline_events 
      JOIN public.patients ON timeline_events.patient_id = patients.id
      WHERE timeline_events.id = attachments.event_id 
      AND (
        patients.user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.patient_access WHERE patient_access.patient_id = patients.id AND patient_access.user_id = auth.uid())
      )
    )
  )
  OR
  -- Case 2: Attachment is linked directly to a patient (Common Documents)
  (
    attachments.patient_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = attachments.patient_id
      AND (
        patients.user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.patient_access WHERE patient_access.patient_id = patients.id AND patient_access.user_id = auth.uid())
      )
    )
  )
);
