
-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- 1. Patients Table Policies
CREATE POLICY "Users can manage accessible patients" 
ON patients 
FOR ALL 
USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM patient_access WHERE patient_access.patient_id = patients.id AND patient_access.user_id = auth.uid())
);

CREATE POLICY "Public can view patient if shared" 
ON patients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM share_links 
    WHERE share_links.patient_id = patients.id 
    AND share_links.expires_at > NOW()
  )
);

-- 2. Timeline Events Policies
CREATE POLICY "Users can manage events for accessible patients" 
ON timeline_events 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = timeline_events.patient_id 
    AND (
      patients.user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM patient_access WHERE patient_access.patient_id = patients.id AND patient_access.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Public can view events if shared" 
ON timeline_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM share_links 
    WHERE share_links.patient_id = timeline_events.patient_id 
    AND share_links.expires_at > NOW()
  )
);

-- 3. Attachments Policies
CREATE POLICY "Users can manage attachments for accessible patients" 
ON attachments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM timeline_events 
    JOIN patients ON timeline_events.patient_id = patients.id
    WHERE timeline_events.id = attachments.event_id 
    AND (
      patients.user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM patient_access WHERE patient_access.patient_id = patients.id AND patient_access.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Public can view attachments if shared" 
ON attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM timeline_events
    JOIN share_links ON timeline_events.patient_id = share_links.patient_id
    WHERE timeline_events.id = attachments.event_id 
    AND share_links.expires_at > NOW()
  )
);

-- 4. Share Links Policies
CREATE POLICY "Users can manage their share links" 
ON share_links 
FOR ALL 
USING (created_by = auth.uid());

CREATE POLICY "Public can view share links" 
ON share_links 
FOR SELECT 
USING (true);

-- 5. Co-Caregiver Policies
CREATE OR REPLACE FUNCTION public.is_patient_owner(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = p_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can manage patient_access for their patients"
ON patient_access FOR ALL
USING (
  public.is_patient_owner(patient_id) OR
  user_id = auth.uid()
);

CREATE POLICY "Users can manage invites for their patients"
ON caregiver_invites FOR ALL
USING (created_by = auth.uid());

CREATE POLICY "Public can view caregiver invites"
ON caregiver_invites FOR SELECT
USING (true);

-- 5. Storage Policies (for medical_attachments bucket)
-- Note: You might need to create the bucket 'medical_attachments' manually first if not done.
CREATE POLICY "Users can upload attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medical_attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medical_attachments');
