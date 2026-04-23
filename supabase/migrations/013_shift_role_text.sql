ALTER TABLE volunteer_shifts
    ALTER COLUMN role TYPE TEXT USING role::text;

DROP TYPE IF EXISTS shift_role;
