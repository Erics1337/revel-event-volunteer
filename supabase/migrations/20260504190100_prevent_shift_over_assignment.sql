CREATE OR REPLACE FUNCTION public.prevent_shift_over_assignment()
RETURNS TRIGGER AS $$
DECLARE
  shift_capacity INTEGER;
  assigned_count INTEGER;
BEGIN
  IF NEW.status <> 'assigned' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.status = 'assigned'
     AND OLD.shift_id = NEW.shift_id THEN
    RETURN NEW;
  END IF;

  SELECT total_slots
  INTO shift_capacity
  FROM public.volunteer_shifts
  WHERE id = NEW.shift_id
  FOR UPDATE;

  IF shift_capacity IS NULL THEN
    RAISE EXCEPTION 'Shift not found'
      USING ERRCODE = '23503';
  END IF;

  SELECT COUNT(*)
  INTO assigned_count
  FROM public.volunteer_assignments
  WHERE shift_id = NEW.shift_id
    AND status = 'assigned'
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF assigned_count >= shift_capacity THEN
    RAISE EXCEPTION 'Shift is already full'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS prevent_shift_over_assignment_trigger ON public.volunteer_assignments;

CREATE TRIGGER prevent_shift_over_assignment_trigger
  BEFORE INSERT OR UPDATE OF status, shift_id ON public.volunteer_assignments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_shift_over_assignment();
