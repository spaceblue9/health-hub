-- SQL Script: Add is_hidden_from_share to timeline_events

ALTER TABLE timeline_events ADD COLUMN is_hidden_from_share BOOLEAN DEFAULT false;
