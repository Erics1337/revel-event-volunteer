-- Resync volunteer_shifts.filled_slots with the authoritative count from
-- volunteer_assignments. The trigger added in 010_volunteer_assignment_statuses
-- keeps this column current on INSERT/UPDATE/DELETE, but rows that existed
-- before that migration (or were written via paths that bypassed the trigger)
-- can drift. Recomputing from the source of truth is idempotent and safe to
-- re-run.

UPDATE volunteer_shifts s
SET filled_slots = COALESCE(c.cnt, 0)
FROM (
  SELECT vs.id,
         COUNT(va.id) FILTER (WHERE va.status = 'assigned') AS cnt
  FROM volunteer_shifts vs
  LEFT JOIN volunteer_assignments va ON va.shift_id = vs.id
  GROUP BY vs.id
) AS c
WHERE s.id = c.id
  AND s.filled_slots IS DISTINCT FROM COALESCE(c.cnt, 0);

-- Tighten the column so future drift can't hide as NULL.
ALTER TABLE volunteer_shifts
  ALTER COLUMN filled_slots SET NOT NULL,
  ALTER COLUMN filled_slots SET DEFAULT 0;
