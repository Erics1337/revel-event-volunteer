-- Initial schema for Revel Event Platform
-- Based on the original Cloudflare Workers schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  headline TEXT,
  bio TEXT,
  linkedin_url TEXT,
  email_public BOOLEAN DEFAULT false,
  role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('admin', 'volunteer')),
  badges TEXT[] DEFAULT '{}',
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  maps_url TEXT,
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('Keynote', 'Panel', 'Workshop', 'Talk', 'Networking', 'Office Hours', 'Demo', 'Social')),
  category TEXT NOT NULL CHECK (category IN ('Fundraising', 'Product', 'Engineering', 'Design', 'Marketing', 'Operations', 'Leadership', 'Community', 'Hiring', 'Legal & Finance', 'Health & Wellness', 'Other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  day TEXT NOT NULL, -- '2026-05-04' format
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  registration_count INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registrations table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- Volunteers table
CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  availability TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending')),
  shift_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Volunteer shifts table
CREATE TABLE volunteer_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL, -- HH:MM format
  end_time TEXT NOT NULL, -- HH:MM format
  location TEXT NOT NULL,
  total_slots INTEGER NOT NULL,
  filled_slots INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer assignments table
CREATE TABLE volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES volunteer_shifts(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(volunteer_id, shift_id)
);

-- Indexes for performance
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_day ON sessions(day);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_session_id ON registrations(session_id);
CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX idx_volunteer_shifts_day ON volunteer_shifts(day);
CREATE INDEX idx_volunteer_assignments_volunteer_id ON volunteer_assignments(volunteer_id);
CREATE INDEX idx_volunteer_assignments_shift_id ON volunteer_assignments(shift_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update registration count
CREATE OR REPLACE FUNCTION update_registration_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE sessions SET registration_count = registration_count + 1 WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE sessions SET registration_count = registration_count - 1 WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER registration_count_trigger
    AFTER INSERT OR DELETE ON registrations
    FOR EACH ROW EXECUTE FUNCTION update_registration_count();

-- Trigger to update volunteer shift count
CREATE OR REPLACE FUNCTION update_shift_filled_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE volunteer_shifts SET filled_slots = filled_slots + 1 WHERE id = NEW.shift_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE volunteer_shifts SET filled_slots = filled_slots - 1 WHERE id = OLD.shift_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER shift_filled_count_trigger
    AFTER INSERT OR DELETE ON volunteer_assignments
    FOR EACH ROW EXECUTE FUNCTION update_shift_filled_count();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Users can view their own profile and public profiles
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id OR email_public = true);

-- Users can update their own profile (except role, badges, blocked)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Admins can do everything with users
CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Everyone can view published sessions
CREATE POLICY "Everyone can view published sessions" ON sessions
    FOR SELECT USING (status = 'published');

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON sessions
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND public.is_admin()
    );

-- Admins can create sessions
CREATE POLICY "Admins can create sessions" ON sessions
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND public.is_admin()
    );

-- Admins can update sessions
CREATE POLICY "Admins can update sessions" ON sessions
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND public.is_admin()
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND public.is_admin()
    );

-- Only admins can delete sessions
CREATE POLICY "Admins can delete sessions" ON sessions
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND public.is_admin()
    );

-- Everyone can view venues
CREATE POLICY "Everyone can view venues" ON venues
    FOR SELECT USING (true);

-- Admins can manage venues
CREATE POLICY "Admins can manage venues" ON venues
    FOR ALL USING (
        auth.uid() IS NOT NULL AND public.is_admin()
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND public.is_admin()
    );

-- Users can manage their own registrations
CREATE POLICY "Users can manage own registrations" ON registrations
    FOR ALL USING (auth.uid() = user_id);

-- Users can view their own volunteer info
CREATE POLICY "Users can view own volunteer info" ON volunteers
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all volunteers
CREATE POLICY "Admins can manage volunteers" ON volunteers
    FOR ALL USING (
        auth.uid() IS NOT NULL AND public.is_admin()
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND public.is_admin()
    );

-- Everyone can view volunteer shifts
CREATE POLICY "Everyone can view volunteer shifts" ON volunteer_shifts
    FOR SELECT USING (true);

-- Admins can manage volunteer shifts
CREATE POLICY "Admins can manage volunteer shifts" ON volunteer_shifts
    FOR ALL USING (
        auth.uid() IS NOT NULL AND public.is_admin()
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND public.is_admin()
    );

-- Users can view their own assignments
CREATE POLICY "Users can view own assignments" ON volunteer_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM volunteers 
            WHERE id = volunteer_id AND user_id = auth.uid()
        )
    );

-- Admins can manage all assignments
CREATE POLICY "Admins can manage assignments" ON volunteer_assignments
    FOR ALL USING (
        auth.uid() IS NOT NULL AND public.is_admin()
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND public.is_admin()
    );
