import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

export interface ReminderSettings {
  id: string
  reminders_enabled: boolean
  reminder_24h_enabled: boolean
  reminder_24h_hours_before: number
  reminder_1h_enabled: boolean
  reminder_1h_hours_before: number
  send_window_minutes: number
  time_zone: string
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  id: 'default',
  reminders_enabled: true,
  reminder_24h_enabled: true,
  reminder_24h_hours_before: 24,
  reminder_1h_enabled: true,
  reminder_1h_hours_before: 1,
  send_window_minutes: 60,
  time_zone: 'America/Denver',
}
export type ReminderSettingsRow = Tables<'notification_settings'>

export interface ReminderRule {
  type: 'reminder_24h' | 'reminder_1h'
  label: string
  enabled: boolean
  hoursBefore: number
}

export function normalizeReminderSettings(
  row?: Partial<ReminderSettingsRow> | null
): ReminderSettings {
  return {
    ...DEFAULT_REMINDER_SETTINGS,
    ...row,
    id: 'default',
  }
}

export function sanitizeReminderSettings(input: unknown): ReminderSettings {
  const source = typeof input === 'object' && input !== null ? input : {}
  const settings = source as Record<string, unknown>

  const readBoolean = (key: keyof ReminderSettings, fallback: boolean) =>
    typeof settings[key] === 'boolean'
      ? settings[key]
      : fallback

  const readInt = (key: keyof ReminderSettings, min: number, max: number, fallback: number) => {
    const raw = Number(settings[key])
    if (!Number.isFinite(raw)) return fallback
    const value = Math.trunc(raw)
    return Math.min(max, Math.max(min, value))
  }

  const timeZone =
    typeof settings.time_zone === 'string' && settings.time_zone.trim()
      ? settings.time_zone.trim()
      : DEFAULT_REMINDER_SETTINGS.time_zone

  return {
    id: 'default',
    reminders_enabled: readBoolean(
      'reminders_enabled',
      DEFAULT_REMINDER_SETTINGS.reminders_enabled
    ),
    reminder_24h_enabled: readBoolean(
      'reminder_24h_enabled',
      DEFAULT_REMINDER_SETTINGS.reminder_24h_enabled
    ),
    reminder_24h_hours_before: readInt(
      'reminder_24h_hours_before',
      1,
      336,
      DEFAULT_REMINDER_SETTINGS.reminder_24h_hours_before
    ),
    reminder_1h_enabled: readBoolean(
      'reminder_1h_enabled',
      DEFAULT_REMINDER_SETTINGS.reminder_1h_enabled
    ),
    reminder_1h_hours_before: readInt(
      'reminder_1h_hours_before',
      1,
      336,
      DEFAULT_REMINDER_SETTINGS.reminder_1h_hours_before
    ),
    send_window_minutes: readInt(
      'send_window_minutes',
      5,
      240,
      DEFAULT_REMINDER_SETTINGS.send_window_minutes
    ),
    time_zone: timeZone,
  }
}

export async function getReminderSettings(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (data) {
    return normalizeReminderSettings(data)
  }

  const defaults = normalizeReminderSettings()
  const { data: inserted, error: insertError } = await supabase
    .from('notification_settings')
    .upsert(defaults, { onConflict: 'id' })
    .select()
    .single()

  if (insertError) {
    throw new Error(insertError.message)
  }

  return normalizeReminderSettings(inserted)
}

export async function updateReminderSettings(
  supabase: SupabaseClient<Database>,
  input: unknown
) {
  const nextSettings = sanitizeReminderSettings(input)

  const { data, error } = await supabase
    .from('notification_settings')
    .upsert(
      {
        ...nextSettings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeReminderSettings(data)
}

export function getReminderRules(settings: ReminderSettings): ReminderRule[] {
  return [
    {
      type: 'reminder_24h',
      label: 'First reminder',
      enabled: settings.reminders_enabled && settings.reminder_24h_enabled,
      hoursBefore: settings.reminder_24h_hours_before,
    },
    {
      type: 'reminder_1h',
      label: 'Second reminder',
      enabled: settings.reminders_enabled && settings.reminder_1h_enabled,
      hoursBefore: settings.reminder_1h_hours_before,
    },
  ]
}
