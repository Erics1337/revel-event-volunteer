-- Admin allowlist: emails that should automatically receive the 'admin' role
-- the first time they sign in via magic link.
--
-- Previously, admin accounts were seeded directly into public.users with
-- freshly generated UUIDs. That drifted from auth.users (which is only
-- populated on real sign-in) and broke the users_id_fkey added in 007.
--
-- With this trigger, the admin role is applied reactively at insert time
-- based on auth.users.email, so the FK invariant holds and seeds stay clean.

CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  email TEXT PRIMARY KEY
);

-- Only admins can manage the allowlist. Readable by admins only.
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage allowlist" ON public.admin_allowlist;
CREATE POLICY "Admins can manage allowlist" ON public.admin_allowlist
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed the BSW organizer allowlist. Case-insensitive matching below, so the
-- exact casing here does not matter for lookup purposes.
INSERT INTO public.admin_allowlist (email) VALUES
  ('erics1337@gmail.com'),
  ('hmeibling@gmail.com'),
  ('ryan@thresholdlabs.io'),
  ('elvin.webb@gmail.com'),
  ('jana.r.montgomery@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Trigger: promote matching emails to admin on insert into public.users.
CREATE OR REPLACE FUNCTION public.apply_admin_allowlist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.admin_allowlist
    WHERE lower(email) = lower(NEW.email)
  ) THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_admin_allowlist_trigger ON public.users;
CREATE TRIGGER apply_admin_allowlist_trigger
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.apply_admin_allowlist();
