CREATE OR REPLACE FUNCTION public.enforce_shift_filled_slots()
RETURNS TRIGGER AS $$
DECLARE
  assigned_count INTEGER;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO assigned_count
  FROM public.volunteer_assignments
  WHERE shift_id = NEW.id
    AND status = 'assigned';

  NEW.filled_slots := COALESCE(assigned_count, 0);

  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS enforce_shift_filled_slots_trigger ON public.volunteer_shifts;

CREATE TRIGGER enforce_shift_filled_slots_trigger
  BEFORE INSERT OR UPDATE OF filled_slots ON public.volunteer_shifts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_shift_filled_slots();
