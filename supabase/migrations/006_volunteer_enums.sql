-- Enumerate the known volunteer shift roles and venue names so that the
-- database rejects typos and keeps seed/UI values in lock-step.
--
-- Values are derived directly from supabase/seed.sql — add new values here
-- BEFORE seeding or inserting rows that use them, because Postgres enums
-- cannot be silently extended by data.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE shift_role AS ENUM (
    'ALL DAY - LOCATION CAPTAIN',
    'Building Runner',
    'Room Runner',
    'Volunteer Hub / Door Monitor'
);

CREATE TYPE venue_name AS ENUM (
    'Boulder Associates',
    'Boulder Public Library',
    'Brand Studios',
    'Canyon Center',
    'Rosetta Hall',
    'SOVRN'
);

-- ---------------------------------------------------------------------------
-- Convert existing TEXT columns to the new enum types.
-- USING clauses cast the existing values; anything not in the enum will
-- raise an error here, flagging data drift immediately instead of at runtime.
-- ---------------------------------------------------------------------------

ALTER TABLE volunteer_shifts
    ALTER COLUMN role TYPE shift_role USING role::shift_role;

ALTER TABLE volunteer_shifts
    ALTER COLUMN location TYPE venue_name USING location::venue_name;

ALTER TABLE venues
    ALTER COLUMN name TYPE venue_name USING name::venue_name;
