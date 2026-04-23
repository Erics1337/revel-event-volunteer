ALTER TABLE notifications
ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE;

UPDATE notifications
SET scheduled_for = created_at
WHERE scheduled_for IS NULL;

ALTER TABLE notifications
ALTER COLUMN scheduled_for SET NOT NULL;

CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
