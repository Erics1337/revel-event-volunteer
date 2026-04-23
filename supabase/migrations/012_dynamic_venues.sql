ALTER TABLE volunteer_shifts
  ALTER COLUMN location TYPE TEXT USING location::text;

ALTER TABLE venues
  ALTER COLUMN name TYPE TEXT USING name::text;
