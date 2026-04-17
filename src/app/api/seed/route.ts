import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Venue {
  id: string
  name: string
  address: string
  maps_url: string
  capacity: number
}

export async function POST() {
  const supabase = createAdminClient()

  try {
    // Insert venues
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .insert([
        { name: 'Boulder Theater — Main Entrance', address: '2032 14th St, Boulder, CO 80302', maps_url: 'https://maps.google.com/?q=Boulder+Theater', capacity: 500 },
        { name: 'Boulder Theater — Main Stage', address: '2032 14th St, Boulder, CO 80302', maps_url: 'https://maps.google.com/?q=Boulder+Theater', capacity: 400 },
        { name: 'Boulder Theater — Green Room', address: '2032 14th St, Boulder, CO 80302', maps_url: 'https://maps.google.com/?q=Boulder+Theater', capacity: 50 },
        { name: 'Boulder Theater', address: '2032 14th St, Boulder, CO 80302', maps_url: 'https://maps.google.com/?q=Boulder+Theater', capacity: 500 },
        { name: 'Rembrandt Yard', address: '1301 Spruce St, Boulder, CO 80302', maps_url: 'https://maps.google.com/?q=Rembrandt+Yard', capacity: 200 },
        { name: 'Rembrandt Yard — Entrance', address: '1301 Spruce St, Boulder, CO 80302', maps_url: 'https://maps.google.com/?q=Rembrandt+Yard', capacity: 200 },
        { name: 'Rembrandt Yard — Summit Stage', address: '1301 Spruce St, Boulder, CO 80302', maps_url: 'https://maps.google.com/?q=Rembrandt+Yard', capacity: 150 },
        { name: 'Galvanize Boulder', address: '1023 Walnut St, Boulder, CO 80302', maps_url: 'https://maps.google.com/?q=Galvanize+Boulder', capacity: 300 },
        { name: 'CU Boulder Campus', address: 'Boulder, CO 80309', maps_url: 'https://maps.google.com/?q=CU+Boulder', capacity: 1000 },
        { name: 'Boulder Public Library', address: '1001 Arapahoe Ave, Boulder, CO 80302', maps_url: 'https://maps.google.com/?q=Boulder+Public+Library', capacity: 200 },
        { name: 'Central Boulder', address: 'Downtown Boulder, CO 80302', maps_url: 'https://maps.google.com/?q=Downtown+Boulder', capacity: 100 }
      ])
      .select()

    if (venuesError) {
      console.error('Error inserting venues:', venuesError)
      return NextResponse.json({ error: venuesError.message }, { status: 500 })
    }

    // Insert sample sessions
    const venuesMap = (venues as Venue[]).reduce((acc: Record<string, string>, venue: Venue) => {
      acc[venue.name] = venue.id
      return acc
    }, {})

    const sessions = [
      {
        title: 'Opening Keynote: The Future of Boulder Startups',
        description: 'Join us for the opening keynote featuring Boulder\'s most successful founders sharing their vision for the future of our startup ecosystem.',
        type: 'Keynote',
        category: 'Leadership',
        status: 'published',
        day: '2026-05-04',
        start_time: '2026-05-04T09:00:00-06:00',
        end_time: '2026-05-04T10:00:00-06:00',
        venue_id: venuesMap['Boulder Theater — Main Stage'],
        registration_count: 45,
        attachments: []
      },
      {
        title: 'Founder Stories: From Idea to Exit',
        description: 'Hear from founders who have successfully built and exited companies in Boulder. Learn from their triumphs and mistakes.',
        type: 'Panel',
        category: 'Leadership',
        status: 'published',
        day: '2026-05-04',
        start_time: '2026-05-04T10:30:00-06:00',
        end_time: '2026-05-04T11:30:00-06:00',
        venue_id: venuesMap['Boulder Theater — Main Stage'],
        registration_count: 38,
        attachments: []
      },
      {
        title: 'Product-Market Fit Workshop',
        description: 'A hands-on workshop for early-stage founders to identify and validate product-market fit. Bring your startup ideas!',
        type: 'Workshop',
        category: 'Product',
        status: 'published',
        day: '2026-05-04',
        start_time: '2026-05-04T09:00:00-06:00',
        end_time: '2026-05-04T11:00:00-06:00',
        venue_id: venuesMap['Rembrandt Yard — Summit Stage'],
        registration_count: 25,
        attachments: [{ label: 'Workshop Materials', url: 'https://example.com/workshop' }]
      },
      {
        title: 'Engineering Leadership in Remote Teams',
        description: 'Learn how to build and lead high-performing engineering teams in a remote-first world.',
        type: 'Talk',
        category: 'Engineering',
        status: 'published',
        day: '2026-05-04',
        start_time: '2026-05-04T13:00:00-06:00',
        end_time: '2026-05-04T14:00:00-06:00',
        venue_id: venuesMap['Boulder Theater — Main Stage'],
        registration_count: 32,
        attachments: []
      },
      {
        title: 'Design Thinking for Startups',
        description: 'Apply design thinking principles to solve startup problems and create user-centric products.',
        type: 'Workshop',
        category: 'Design',
        status: 'published',
        day: '2026-05-04',
        start_time: '2026-05-04T13:00:00-06:00',
        end_time: '2026-05-04T15:00:00-06:00',
        venue_id: venuesMap['Rembrandt Yard — Summit Stage'],
        registration_count: 20,
        attachments: []
      },
      {
        title: 'Growth Hacking 101',
        description: 'Learn proven strategies for rapid user acquisition and growth without breaking the bank.',
        type: 'Talk',
        category: 'Marketing',
        status: 'published',
        day: '2026-05-04',
        start_time: '2026-05-04T14:30:00-06:00',
        end_time: '2026-05-04T15:30:00-06:00',
        venue_id: venuesMap['Boulder Theater — Main Stage'],
        registration_count: 41,
        attachments: []
      },
      {
        title: 'Startup Operations Bootcamp',
        description: 'Everything you need to know about running startup operations from legal to finance to HR.',
        type: 'Workshop',
        category: 'Operations',
        status: 'published',
        day: '2026-05-04',
        start_time: '2026-05-04T15:00:00-06:00',
        end_time: '2026-05-04T17:00:00-06:00',
        venue_id: venuesMap['Rembrandt Yard — Summit Stage'],
        registration_count: 18,
        attachments: []
      },
      {
        title: 'Investor Pitch Practice',
        description: 'Practice your pitch with real investors and get immediate feedback to improve.',
        type: 'Office Hours',
        category: 'Fundraising',
        status: 'published',
        day: '2026-05-04',
        start_time: '2026-05-04T16:00:00-06:00',
        end_time: '2026-05-04T18:00:00-06:00',
        venue_id: venuesMap['Galvanize Boulder'],
        registration_count: 15,
        attachments: []
      },
      {
        title: 'Opening Night Networking',
        description: 'Kick off BSW 2026 with drinks, food, and connections with Boulder\'s startup community.',
        type: 'Social',
        category: 'Community',
        status: 'published',
        day: '2026-05-04',
        start_time: '2026-05-04T19:00:00-06:00',
        end_time: '2026-05-04T21:00:00-06:00',
        venue_id: venuesMap['Boulder Theater — Main Stage'],
        registration_count: 120,
        attachments: []
      }
    ]

    const { data: insertedSessions, error: sessionsError } = await supabase
      .from('sessions')
      .insert(sessions)
      .select()

    if (sessionsError) {
      console.error('Error inserting sessions:', sessionsError)
      return NextResponse.json({ error: sessionsError.message }, { status: 500 })
    }

    // Insert volunteer shifts
    const volunteerShifts = [
      {
        role: 'Registration & Check-In',
        day: '2026-05-04',
        start_time: '07:30',
        end_time: '09:30',
        location: 'Boulder Theater — Main Entrance',
        total_slots: 6,
        filled_slots: 4
      },
      {
        role: 'Room Runner',
        day: '2026-05-04',
        start_time: '08:00',
        end_time: '10:00',
        location: 'Boulder Theater — Main Stage',
        total_slots: 3,
        filled_slots: 1
      },
      {
        role: 'A/V & Tech Support',
        day: '2026-05-04',
        start_time: '07:00',
        end_time: '09:00',
        location: 'Rembrandt Yard',
        total_slots: 4,
        filled_slots: 2
      },
      {
        role: 'Door Monitor',
        day: '2026-05-04',
        start_time: '09:00',
        end_time: '11:00',
        location: 'Boulder Theater — Main Stage',
        total_slots: 4,
        filled_slots: 2
      },
      {
        role: 'Session Host',
        day: '2026-05-04',
        start_time: '09:00',
        end_time: '11:00',
        location: 'Rembrandt Yard — Summit Stage',
        total_slots: 2,
        filled_slots: 1
      }
    ]

    const { data: insertedShifts, error: shiftsError } = await supabase
      .from('volunteer_shifts')
      .insert(volunteerShifts)
      .select()

    if (shiftsError) {
      console.error('Error inserting volunteer shifts:', shiftsError)
      return NextResponse.json({ error: shiftsError.message }, { status: 500 })
    }

    // Insert admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .insert({
        email: 'eric.swanson.1337@gmail.com',
        name: 'Eric Swanson',
        headline: 'Event Administrator',
        bio: 'Admin account for Boulder Startup Week 2026',
        role: 'event_admin',
        badges: ['facilitator'],
        blocked: false,
        email_public: true
      })
      .select()

    if (adminError) {
      console.error('Error inserting admin user:', adminError)
      return NextResponse.json({ error: adminError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      venues: venues.length,
      sessions: insertedSessions.length,
      shifts: insertedShifts.length,
      users: adminUser?.length || 0
    })

  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
