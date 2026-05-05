CREATE OR REPLACE FUNCTION public.enforce_shift_filled_slots()
RETURNS TRIGGER AS $$
DECLARE
  assigned_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO assigned_count
  FROM public.volunteer_assignments
  WHERE shift_id = NEW.id
    AND status = 'assigned';

  NEW.filled_slots := COALESCE(assigned_count, 0);

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION public.sync_shift_filled_slots()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.volunteer_shifts
    SET filled_slots = filled_slots
    WHERE id = NEW.shift_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.volunteer_shifts
    SET filled_slots = filled_slots
    WHERE id = OLD.shift_id;

    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.volunteer_shifts
    SET filled_slots = filled_slots
    WHERE id = OLD.shift_id;

    IF NEW.shift_id <> OLD.shift_id THEN
      UPDATE public.volunteer_shifts
      SET filled_slots = filled_slots
      WHERE id = NEW.shift_id;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS sync_shift_filled_slots_trigger ON public.volunteer_assignments;

CREATE TRIGGER sync_shift_filled_slots_trigger
  AFTER INSERT OR UPDATE OF status, shift_id OR DELETE ON public.volunteer_assignments
  FOR EACH ROW EXECUTE FUNCTION public.sync_shift_filled_slots();
