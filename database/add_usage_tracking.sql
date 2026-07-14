-- SQL Script: Add Usage Tracking

-- 1. Add file_size_bytes column to attachments table
ALTER TABLE attachments ADD COLUMN file_size_bytes BIGINT DEFAULT 0;

-- 2. Create RPC Function to get usage stats per user
DROP FUNCTION IF EXISTS get_admin_usage_stats();

CREATE OR REPLACE FUNCTION get_admin_usage_stats()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    total_patients BIGINT,
    total_events BIGINT,
    total_attachments BIGINT,
    total_storage_bytes BIGINT
) AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin only.';
    END IF;

    RETURN QUERY
    SELECT 
        p.id AS user_id,
        p.email,
        (SELECT COUNT(id) FROM patients pat WHERE pat.user_id = p.id) AS total_patients,
        (SELECT COUNT(e.id) FROM timeline_events e JOIN patients pat ON e.patient_id = pat.id WHERE pat.user_id = p.id) AS total_events,
        (SELECT COUNT(a.id) FROM attachments a JOIN patients pat ON (a.patient_id = pat.id OR a.event_id IN (SELECT id FROM timeline_events WHERE patient_id = pat.id)) WHERE pat.user_id = p.id) AS total_attachments,
        COALESCE((SELECT SUM(a.file_size_bytes) FROM attachments a JOIN patients pat ON (a.patient_id = pat.id OR a.event_id IN (SELECT id FROM timeline_events WHERE patient_id = pat.id)) WHERE pat.user_id = p.id), 0)::BIGINT AS total_storage_bytes
    FROM 
        profiles p
    ORDER BY 
        p.email ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
