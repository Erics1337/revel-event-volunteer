-- Allow authenticated users to insert their own profile row on first sign-in
-- Idempotent: the policy is also declared in 001_initial_schema.sql; drop first to
-- keep this migration safe on fresh resets and on older databases that lack it.
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);
