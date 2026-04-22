-- Track volunteer self-service requests separately from assigned shifts.
-- Only `assigned` rows should consume shift capacity.

ALTER TABLE volunteer_assignments
  ADD COLUMN status TEXT NOT NULL DEFAULT 'assigned'
  CHECK (status IN ('requested', 'assigned', 'cancelled'));

CREATE INDEX idx_volunteer_assignments_status
  ON volunteer_assignments(status);

CREATE OR REPLACE FUNCTION update_shift_filled_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'assigned' THEN
            UPDATE volunteer_shifts
            SET filled_slots = filled_slots + 1
            WHERE id = NEW.shift_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'assigned' THEN
            UPDATE volunteer_shifts
            SET filled_slots = GREATEST(filled_slots - 1, 0)
            WHERE id = OLD.shift_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.shift_id = NEW.shift_id THEN
            IF OLD.status <> 'assigned' AND NEW.status = 'assigned' THEN
                UPDATE volunteer_shifts
                SET filled_slots = filled_slots + 1
                WHERE id = NEW.shift_id;
            ELSIF OLD.status = 'assigned' AND NEW.status <> 'assigned' THEN
                UPDATE volunteer_shifts
                SET filled_slots = GREATEST(filled_slots - 1, 0)
                WHERE id = OLD.shift_id;
            END IF;
        ELSE
            IF OLD.status = 'assigned' THEN
                UPDATE volunteer_shifts
                SET filled_slots = GREATEST(filled_slots - 1, 0)
                WHERE id = OLD.shift_id;
            END IF;

            IF NEW.status = 'assigned' THEN
                UPDATE volunteer_shifts
                SET filled_slots = filled_slots + 1
                WHERE id = NEW.shift_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS shift_filled_count_trigger ON volunteer_assignments;

CREATE TRIGGER shift_filled_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON volunteer_assignments
    FOR EACH ROW EXECUTE FUNCTION update_shift_filled_count();

CREATE POLICY "Users can insert own volunteer info" ON volunteers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own volunteer info" ON volunteers
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignments" ON volunteer_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM volunteers
            WHERE id = volunteer_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own assignments" ON volunteer_assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM volunteers
            WHERE id = volunteer_id AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM volunteers
            WHERE id = volunteer_id AND user_id = auth.uid()
        )
    );
