-- Add optional phone number to user profiles.
-- Collected at first magic-link sign-in so volunteers can opt in to SMS
-- reminders without a separate onboarding step.
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
