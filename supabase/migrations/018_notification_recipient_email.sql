ALTER TABLE notifications
ADD COLUMN recipient_email TEXT;

UPDATE notifications
SET recipient_email = users.email
FROM users
WHERE notifications.user_id = users.id
  AND notifications.recipient_email IS NULL;

CREATE INDEX idx_notifications_pending_scheduled_for
  ON notifications (scheduled_for)
  WHERE status = 'pending';
