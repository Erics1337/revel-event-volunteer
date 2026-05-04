WITH session_rows(title, day, start_time, end_time, location, address) AS (
  VALUES
    ('Welcome Breakfast Meetup presented by JP Morgan', '2026-05-04', '08:00', '10:00', 'Rosetta Hall', '1109 Walnut Street, Boulder, CO 80302'),
    ('Morning Tai Chi', '2026-05-04', '08:00', '09:00', 'RegenHub', '1515 Walnut St, Boulder, CO 80302'),
    ('SAGE Tips to Pitch like a Pro', '2026-05-04', '10:00', '11:00', 'Sovrn', '1600 Pearl St #200, Boulder, CO 80302'),
    ('Agentic Engineering in Practice', '2026-05-04', '10:00', '11:00', 'Canyon Center', '1881 9th Street, Boulder, CO 80302'),
    ('First Time Founder Fuck Ups', '2026-05-04', '10:00', '11:00', 'The Brand Studios at CU', '1301 Walnut Street, Boulder, CO 80302'),
    ('Beyond the Resume: Hiring for Grit, Growth, and Game-Changing Talent', '2026-05-04', '10:00', '11:00', 'Boulder Library', '1001 Arapahoe Ave, Boulder, CO 80302'),
    ('BSW Headquarters', '2026-05-04', '10:00', '17:00', 'Siena Square (HQ)', '2060 Broadway, Boulder, CO 80302'),
    ('Builders'' Room Kickoff: What Are You Building at BSW?', '2026-05-04', '10:00', '11:00', 'Siena Square (HQ)', '2060 Broadway, Boulder, CO 80302'),
    ('Better Conversations, Better Connections: A Speed Networking Experience', '2026-05-04', '11:00', '12:00', '1615 Pearl', '1615 Pearl St., Boulder, CO 80302'),
    ('Avoiding Legal Landmines', '2026-05-04', '11:00', '12:00', 'Sovrn', '1600 Pearl St #200, Boulder, CO 80302'),
    ('From Startup Choices to Investor Outcomes', '2026-05-04', '11:00', '12:00', 'Canyon Center', '1881 9th Street, Boulder, CO 80302'),
    ('Build in Public, Sell in Public How Founder Content Turns Attention Into Revenue', '2026-05-04', '11:00', '12:00', 'The Brand Studios at CU', '1301 Walnut Street, Boulder, CO 80302'),
    ('Community Impact with Social Venture Partners', '2026-05-04', '11:00', '12:00', 'Boulder Library', '1001 Arapahoe Ave, Boulder, CO 80302'),
    ('Learn Vibe Build', '2026-05-04', '11:00', '13:00', 'Siena Square (HQ)', '2060 Broadway, Boulder, CO 80302'),
    ('From Spicy Autocomplete to Dark Factory: Agentic Coding in Practice', '2026-05-04', '12:00', '13:00', 'Boulder Associates', '1426 Pearl St #300, Boulder, CO 80302'),
    ('Success Stories of Failed Founders', '2026-05-04', '12:00', '13:00', 'The Brand Studios at CU', '1301 Walnut Street, Boulder, CO 80302'),
    ('CEO Finance Lab - Financial Mastery and Avoidable Mistakes', '2026-05-04', '12:00', '13:00', 'Boulder Library', '1001 Arapahoe Ave, Boulder, CO 80302'),
    ('Built in Boulder: How Techstars and CU Can Help Founders Build Better Startups', '2026-05-04', '12:00', '13:00', 'Sovrn', '1600 Pearl St #200, Boulder, CO 80302'),
    ('FREE Headshots courtesy of Lorikeet Creative', '2026-05-04', '12:00', '16:00', 'Siena Square (HQ)', '2060 Broadway, Boulder, CO 80302'),
    ('How AI is Changing Consumer Subscription Growth', '2026-05-04', '12:00', '13:00', 'Canyon Center', '1881 9th Street, Boulder, CO 80302'),
    ('The Hidden Co-Founder Code: How to Build (and Break) a Startup Team', '2026-05-04', '13:00', '14:00', 'Canyon Center', '1881 9th Street, Boulder, CO 80302'),
    ('Innovation Unleashed: The Importance of Customer Discovery', '2026-05-04', '13:00', '14:00', 'Boulder Associates', '1426 Pearl St #300, Boulder, CO 80302'),
    ('Securing your MCP server', '2026-05-04', '13:00', '14:00', 'Boulder Library', '1001 Arapahoe Ave, Boulder, CO 80302'),
    ('The Table Read: Rehearse the Conversations That Are Running (or Ruining) Your Company', '2026-05-04', '13:00', '14:00', 'Sovrn', '1600 Pearl St #200, Boulder, CO 80302'),
    ('Why Deals Stall (And What’s Actually Happening Inside Your Sales Process)', '2026-05-04', '13:00', '14:00', 'RegenHub', '1515 Walnut St, Boulder, CO 80302'),
    ('Builders'' Room: Daily Jam', '2026-05-04', '13:00', '15:00', 'Siena Square (HQ)', '2060 Broadway, Boulder, CO 80302'),
    ('AI Builders and Niche Sports Opportunities', '2026-05-04', '14:00', '15:00', 'Canyon Center', '1881 9th Street, Boulder, CO 80302'),
    ('Your Parents Are Going to Need Help. Here''s Why the $400B Home Care Industry Can''t Provide It — and What Boulder Is Building Instead.', '2026-05-04', '14:00', '14:00', 'RegenHub', '1515 Walnut St, Boulder, CO 80302'),
    ('Connected Culture: How Connection Unlocks Trust, Fulfillment, and High Performance', '2026-05-04', '14:00', '15:00', 'Sovrn', '1600 Pearl St #200, Boulder, CO 80302'),
    ('Recurring Revenue, Done Right: Balancing Growth, UX & Compliance', '2026-05-04', '14:00', '15:00', 'Boulder Associates', '1426 Pearl St #300, Boulder, CO 80302'),
    ('Serverless GPU Inference: From Always-On to On-Demand', '2026-05-04', '15:00', '16:00', 'RegenHub', '1515 Walnut St, Boulder, CO 80302'),
    ('Pressure-Proof Founders: The Skill That Prevents Costly Mistakes When Stakes Are High', '2026-05-04', '15:00', '16:00', 'Boulder Associates', '1426 Pearl St #300, Boulder, CO 80302'),
    ('Establishing your early GTM Motion', '2026-05-04', '15:00', '16:00', 'Canyon Center', '1881 9th Street, Boulder, CO 80302'),
    ('Protecting Data in the Era of AI', '2026-05-04', '15:00', '16:00', 'Sovrn', '1600 Pearl St #200, Boulder, CO 80302'),
    ('AI-Powered Customer Experience: From Reactive to Proactive', '2026-05-04', '16:00', '17:00', 'Boulder Associates', '1426 Pearl St #300, Boulder, CO 80302'),
    ('Women Founders Networking', '2026-05-04', '16:00', '17:00', 'Rosetta Hall', '1109 Walnut Street, Boulder, CO 80302'),
    ('Developing AI Products - A Human Conversation', '2026-05-04', '16:00', '17:00', 'RegenHub', '1515 Walnut St, Boulder, CO 80302'),
    ('Kindness is Not Weakness: The Radical Strength Leaders Need Now', '2026-05-04', '16:00', '17:00', 'Canyon Center', '1881 9th Street, Boulder, CO 80302'),
    ('BSW Kickoff Party', '2026-05-04', '17:00', '19:00', 'Rosetta Hall', '1109 Walnut Street, Boulder, CO 80302'),
    ('Boulder County Film Commission Happy Hour', '2026-05-04', '17:30', '19:00', 'Dairy Arts', NULL)
)
INSERT INTO event_sessions (title, day, start_time, end_time, location, address)
SELECT title, day, start_time, end_time, location, address
FROM session_rows
ON CONFLICT (title, day, start_time, end_time) DO UPDATE SET
  location = EXCLUDED.location,
  address = EXCLUDED.address,
  updated_at = NOW();

WITH target_session AS (
  SELECT id
  FROM event_sessions
  WHERE title = 'Built in Boulder: How Techstars and CU Can Help Founders Build Better Startups'
    AND day = '2026-05-04'
    AND start_time = '12:00'
    AND end_time = '13:00'
)
UPDATE volunteer_shifts
SET event_session_id = target_session.id
FROM target_session
WHERE volunteer_shifts.day = '2026-05-04'
  AND volunteer_shifts.location = 'Sovrn'
  AND volunteer_shifts.start_time <= '13:00'
  AND volunteer_shifts.end_time >= '12:00'
  AND volunteer_shifts.role IN ('ALL DAY - LOCATION CAPTAIN', 'Room Runner', 'Welcome Table / Door Monitor');
