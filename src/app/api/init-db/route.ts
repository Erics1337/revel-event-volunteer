import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Create tables using raw SQL
    const createTablesSQL = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Venues table
      CREATE TABLE IF NOT EXISTS venues (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        maps_url TEXT,
        capacity INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Sessions table
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('Keynote', 'Panel', 'Workshop', 'Talk', 'Networking', 'Office Hours', 'Demo', 'Social')),
        category TEXT NOT NULL CHECK (category IN ('Fundraising', 'Product', 'Engineering', 'Design', 'Marketing', 'Operations', 'Leadership', 'Community', 'Hiring', 'Legal & Finance', 'Health & Wellness', 'Other')),
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        day TEXT NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
        registration_count INTEGER DEFAULT 0,
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        headline TEXT,
        bio TEXT,
        linkedin_url TEXT,
        email_public BOOLEAN DEFAULT false,
        role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('event_admin', 'volunteer')),
        badges TEXT[] DEFAULT '{}',
        blocked BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Volunteer shifts table
      CREATE TABLE IF NOT EXISTS volunteer_shifts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        role TEXT NOT NULL,
        day TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        location TEXT NOT NULL,
        total_slots INTEGER NOT NULL,
        filled_slots INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable Row Level Security
      ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
      ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE volunteer_shifts ENABLE ROW LEVEL SECURITY;

      -- Basic RLS policies
      CREATE POLICY "Enable read access for all users on venues" ON venues FOR SELECT USING (true);
      CREATE POLICY "Enable read access for published sessions" ON sessions FOR SELECT USING (status = 'published');
      CREATE POLICY "Enable read access for all users on volunteer_shifts" ON volunteer_shifts FOR SELECT USING (true);
    `

    // Execute the SQL using Supabase's SQL function
    const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL })

    if (error) {
      console.error('Error creating tables:', error)
      // Try without the RPC call - the tables might already exist
    }

    return NextResponse.json({ message: 'Database initialization attempted' })

  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
