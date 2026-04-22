-- Drop legacy `sessions` and `registrations` tables.
--
-- This platform is volunteer-only: the first-class scheduling entity is
-- `volunteer_shifts`. `sessions`/`registrations` were carried over from an
-- earlier generic-event scaffold and are not populated anywhere in this repo
-- (no ingestion, no admin UI, no seed). Dropping them removes dead code and
-- lets RLS/policies shrink accordingly.
--
-- CASCADE takes care of:
--   - Policies attached to each table
--   - The `registration_count_trigger` on `registrations`
--   - The `update_sessions_updated_at` trigger on `sessions`
--   - The FK from `registrations.session_id` → `sessions.id`
--   - Indexes `idx_sessions_*`, `idx_registrations_*`

DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- The trigger function was only referenced by the dropped trigger above.
DROP FUNCTION IF EXISTS update_registration_count() CASCADE;
