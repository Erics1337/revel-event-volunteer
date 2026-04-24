-- Allow admins to schedule volunteers who do not yet have an app account.
-- Linked volunteers continue to use users.name/users.email; these fields are
-- only used as contact fallbacks when volunteers.user_id is null.
ALTER TABLE volunteers
  ADD COLUMN fallback_name TEXT,
  ADD COLUMN fallback_email TEXT;

CREATE INDEX idx_volunteers_fallback_email
  ON volunteers (lower(fallback_email))
  WHERE fallback_email IS NOT NULL;

