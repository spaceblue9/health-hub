-- Admin functions for syncing old file sizes

-- 1. Function to get all attachments with 0 or NULL file size
CREATE OR REPLACE FUNCTION admin_get_attachments_missing_size()
RETURNS TABLE (
    id UUID,
    file_url TEXT
) AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin only.';
    END IF;

    RETURN QUERY
    SELECT attachments.id, attachments.file_url
    FROM attachments
    WHERE file_size_bytes = 0 OR file_size_bytes IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Function to update file size for a specific attachment
CREATE OR REPLACE FUNCTION admin_update_attachment_size(attachment_id UUID, new_size BIGINT)
RETURNS void AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin only.';
    END IF;

    UPDATE attachments
    SET file_size_bytes = new_size
    WHERE attachments.id = attachment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
