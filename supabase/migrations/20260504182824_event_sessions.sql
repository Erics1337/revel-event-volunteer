CREATE TABLE IF NOT EXISTS event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (title, day, start_time, end_time)
);

ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.event_sessions TO anon, authenticated;
GRANT ALL ON public.event_sessions TO service_role;

DROP POLICY IF EXISTS "Everyone can view event sessions" ON event_sessions;
CREATE POLICY "Everyone can view event sessions" ON event_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage event sessions" ON event_sessions;
CREATE POLICY "Admins can manage event sessions" ON event_sessions
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS update_event_sessions_updated_at ON event_sessions;
CREATE TRIGGER update_event_sessions_updated_at BEFORE UPDATE ON event_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_event_sessions_day_time ON event_sessions(day, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_event_sessions_location ON event_sessions(location);

ALTER TABLE volunteer_shifts
  ADD COLUMN IF NOT EXISTS event_session_id UUID REFERENCES event_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_event_session_id ON volunteer_shifts(event_session_id);
