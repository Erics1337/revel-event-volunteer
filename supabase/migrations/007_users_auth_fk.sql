-- Tie public.users.id to auth.users.id so the two stay in sync.
-- Without this FK, deleting an auth user (e.g. via db:reset or Studio) leaves
-- an orphaned public.users row whose email then blocks any future sign-in
-- attempt from the same address with a different auth uuid.
--
-- Safe to run on a fresh DB; on an existing DB with drift, delete orphans
-- first (the DELETE below) before adding the constraint.

DELETE FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users a WHERE a.id = u.id
);

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
