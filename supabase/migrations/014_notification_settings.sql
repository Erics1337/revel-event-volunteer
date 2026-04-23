CREATE TABLE notification_settings (
  id TEXT PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_24h_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_24h_hours_before INTEGER NOT NULL DEFAULT 24 CHECK (reminder_24h_hours_before BETWEEN 1 AND 336),
  reminder_1h_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_1h_hours_before INTEGER NOT NULL DEFAULT 1 CHECK (reminder_1h_hours_before BETWEEN 1 AND 336),
  send_window_minutes INTEGER NOT NULL DEFAULT 60 CHECK (send_window_minutes BETWEEN 5 AND 240),
  time_zone TEXT NOT NULL DEFAULT 'America/Denver',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification settings" ON notification_settings
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT ALL ON notification_settings TO authenticated;
GRANT ALL ON notification_settings TO service_role;

INSERT INTO notification_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;
