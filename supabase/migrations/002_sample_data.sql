-- Sample data for Revel Event Platform
-- Migrates mock data from old app and adds sample sessions for BSW 2026

-- Insert venues from mock data
INSERT INTO venues (name, address, maps_url, capacity) VALUES
('Boulder Theater — Main Entrance', '2032 14th St, Boulder, CO 80302', 'https://maps.google.com/?q=Boulder+Theater', 500),
('Boulder Theater — Main Stage', '2032 14th St, Boulder, CO 80302', 'https://maps.google.com/?q=Boulder+Theater', 400),
('Boulder Theater — Green Room', '2032 14th St, Boulder, CO 80302', 'https://maps.google.com/?q=Boulder+Theater', 50),
('Boulder Theater', '2032 14th St, Boulder, CO 80302', 'https://maps.google.com/?q=Boulder+Theater', 500),
('Rembrandt Yard', '1301 Spruce St, Boulder, CO 80302', 'https://maps.google.com/?q=Rembrandt+Yard', 200),
('Rembrandt Yard — Entrance', '1301 Spruce St, Boulder, CO 80302', 'https://maps.google.com/?q=Rembrandt+Yard', 200),
('Rembrandt Yard — Summit Stage', '1301 Spruce St, Boulder, CO 80302', 'https://maps.google.com/?q=Rembrandt+Yard', 150),
('Galvanize Boulder', '1023 Walnut St, Boulder, CO 80302', 'https://maps.google.com/?q=Galvanize+Boulder', 300),
('CU Boulder Campus', 'Boulder, CO 80309', 'https://maps.google.com/?q=CU+Boulder', 1000),
('Boulder Public Library', '1001 Arapahoe Ave, Boulder, CO 80302', 'https://maps.google.com/?q=Boulder+Public+Library', 200),
('Central Boulder', 'Downtown Boulder, CO 80302', 'https://maps.google.com/?q=Downtown+Boulder', 100);

-- Insert volunteer shifts from mock data
INSERT INTO volunteer_shifts (role, day, start_time, end_time, location, total_slots, filled_slots) VALUES
-- Monday May 4, 2026
('Registration & Check-In', '2026-05-04', '07:30', '09:30', 'Boulder Theater — Main Entrance', 6, 4),
('Room Runner', '2026-05-04', '08:00', '10:00', 'Boulder Theater — Main Stage', 3, 1),
('A/V & Tech Support', '2026-05-04', '07:00', '09:00', 'Rembrandt Yard', 4, 2),
('Door Monitor', '2026-05-04', '09:00', '11:00', 'Boulder Theater — Main Stage', 4, 2),
('Session Host', '2026-05-04', '09:00', '11:00', 'Rembrandt Yard — Summit Stage', 2, 1),
('Building Runner', '2026-05-04', '08:30', '12:30', 'Downtown Boulder — Various', 5, 3),
('Wayfinding', '2026-05-04', '08:45', '10:45', 'Central Boulder', 6, 4),
('Social Media', '2026-05-04', '09:00', '11:00', 'Boulder Theater', 2, 1),
('Venue Setup', '2026-05-04', '06:30', '08:30', 'Galvanize Boulder', 4, 2),
('Green Room', '2026-05-04', '08:00', '12:00', 'Boulder Theater — Green Room', 3, 2),

-- Monday Afternoon
('Registration & Check-In', '2026-05-04', '12:30', '14:30', 'Boulder Theater — Main Entrance', 4, 2),
('Room Runner', '2026-05-04', '13:00', '15:00', 'Rembrandt Yard — Summit Stage', 3, 1),
('A/V & Tech Support', '2026-05-04', '12:00', '14:00', 'Boulder Theater — Main Stage', 4, 3),
('Door Monitor', '2026-05-04', '14:00', '16:00', 'Rembrandt Yard', 4, 2),
('Session Host', '2026-05-04', '14:00', '16:00', 'Boulder Theater — Main Stage', 2, 1),
('Building Runner', '2026-05-04', '13:30', '17:30', 'Downtown Boulder — Various', 5, 2),
('Wayfinding', '2026-05-04', '13:45', '15:45', 'Central Boulder', 6, 3),

-- Tuesday May 5, 2026
('Registration & Check-In', '2026-05-05', '07:30', '09:30', 'Rembrandt Yard — Entrance', 6, 3),
('Room Runner', '2026-05-05', '08:00', '10:00', 'Boulder Theater — Main Stage', 3, 2),
('A/V & Tech Support', '2026-05-05', '07:00', '09:00', 'Rembrandt Yard — Summit Stage', 4, 1),
('Door Monitor', '2026-05-05', '09:00', '11:00', 'Boulder Theater — Main Stage', 4, 3),
('Session Host', '2026-05-05', '09:00', '11:00', 'Rembrandt Yard — Summit Stage', 2, 1),
('Building Runner', '2026-05-05', '08:30', '12:30', 'Downtown Boulder — Various', 5, 4),
('Wayfinding', '2026-05-05', '08:45', '10:45', 'Central Boulder', 6, 5),
('Social Media', '2026-05-05', '09:00', '11:00', 'Rembrandt Yard', 2, 2),
('Venue Setup', '2026-05-05', '06:30', '08:30', 'Boulder Public Library', 4, 2),
('Green Room', '2026-05-05', '08:00', '12:00', 'Boulder Theater — Green Room', 3, 1),

-- Tuesday Afternoon
('Registration & Check-In', '2026-05-05', '12:30', '14:30', 'Boulder Theater — Main Entrance', 4, 3),
('Room Runner', '2026-05-05', '13:00', '15:00', 'Rembrandt Yard — Summit Stage', 3, 2),
('A/V & Tech Support', '2026-05-05', '12:00', '14:00', 'Boulder Theater — Main Stage', 4, 2),
('Door Monitor', '2026-05-05', '14:00', '16:00', 'Rembrandt Yard', 4, 3),
('Session Host', '2026-05-05', '14:00', '16:00', 'Boulder Theater — Main Stage', 2, 1),

-- Wednesday May 6, 2026
('Registration & Check-In', '2026-05-06', '07:30', '09:30', 'CU Boulder Campus', 6, 4),
('Room Runner', '2026-05-06', '08:00', '10:00', 'Galvanize Boulder', 3, 2),
('A/V & Tech Support', '2026-05-06', '07:00', '09:00', 'Boulder Theater — Main Stage', 4, 3),
('Door Monitor', '2026-05-06', '09:00', '11:00', 'Rembrandt Yard — Summit Stage', 4, 2),
('Session Host', '2026-05-06', '09:00', '11:00', 'Boulder Theater — Main Stage', 2, 1),
('Building Runner', '2026-05-06', '08:30', '12:30', 'Downtown Boulder — Various', 5, 3),
('Wayfinding', '2026-05-06', '08:45', '10:45', 'Central Boulder', 6, 4),
('Social Media', '2026-05-06', '09:00', '11:00', 'CU Boulder Campus', 2, 1),
('Venue Setup', '2026-05-06', '06:30', '08:30', 'Boulder Public Library', 4, 3),
('Green Room', '2026-05-06', '08:00', '12:00', 'Rembrandt Yard', 3, 2),

-- Wednesday Afternoon
('Registration & Check-In', '2026-05-06', '12:30', '14:30', 'Boulder Theater — Main Entrance', 4, 2),
('Room Runner', '2026-05-06', '13:00', '15:00', 'CU Boulder Campus', 3, 1),
('A/V & Tech Support', '2026-05-06', '12:00', '14:00', 'Galvanize Boulder', 4, 2),
('Door Monitor', '2026-05-06', '14:00', '16:00', 'Boulder Theater — Main Stage', 4, 3),
('Session Host', '2026-05-06', '14:00', '16:00', 'Rembrandt Yard — Summit Stage', 2, 1),

-- Thursday May 7, 2026
('Registration & Check-In', '2026-05-07', '07:30', '09:30', 'Boulder Public Library', 6, 5),
('Room Runner', '2026-05-07', '08:00', '10:00', 'Rembrandt Yard — Summit Stage', 3, 2),
('A/V & Tech Support', '2026-05-07', '07:00', '09:00', 'Boulder Theater — Main Stage', 4, 3),
('Door Monitor', '2026-05-07', '09:00', '11:00', 'Galvanize Boulder', 4, 2),
('Session Host', '2026-05-07', '09:00', '11:00', 'CU Boulder Campus', 2, 1),
('Building Runner', '2026-05-07', '08:30', '12:30', 'Downtown Boulder — Various', 5, 4),
('Wayfinding', '2026-05-07', '08:45', '10:45', 'Central Boulder', 6, 5),
('Social Media', '2026-05-07', '09:00', '11:00', 'Boulder Theater', 2, 2),
('Venue Setup', '2026-05-07', '06:30', '08:30', 'Rembrandt Yard', 4, 3),
('Green Room', '2026-05-07', '08:00', '12:00', 'Boulder Theater — Green Room', 3, 2),

-- Thursday Afternoon
('Registration & Check-In', '2026-05-07', '12:30', '14:30', 'CU Boulder Campus', 4, 3),
('Room Runner', '2026-05-07', '13:00', '15:00', 'Boulder Theater — Main Stage', 3, 2),
('A/V & Tech Support', '2026-05-07', '12:00', '14:00', 'Boulder Public Library', 4, 2),
('Door Monitor', '2026-05-07', '14:00', '16:00', 'Rembrandt Yard — Summit Stage', 4, 3),
('Session Host', '2026-05-07', '14:00', '16:00', 'Galvanize Boulder', 2, 1),

-- Friday May 8, 2026
('Registration & Check-In', '2026-05-08', '07:30', '09:30', 'Boulder Theater — Main Entrance', 6, 4),
('Room Runner', '2026-05-08', '08:00', '10:00', 'Rembrandt Yard — Summit Stage', 3, 2),
('A/V & Tech Support', '2026-05-08', '07:00', '09:00', 'Boulder Theater — Main Stage', 4, 3),
('Door Monitor', '2026-05-08', '09:00', '11:00', 'Galvanize Boulder', 4, 2),
('Session Host', '2026-05-08', '09:00', '11:00', 'CU Boulder Campus', 2, 1),
('Building Runner', '2026-05-08', '08:30', '12:30', 'Downtown Boulder — Various', 5, 4),
('Wayfinding', '2026-05-08', '08:45', '10:45', 'Central Boulder', 6, 5),
('Social Media', '2026-05-08', '09:00', '11:00', 'Boulder Theater', 2, 2),
('Venue Setup', '2026-05-08', '06:30', '08:30', 'Boulder Public Library', 4, 3),
('Green Room', '2026-05-08', '08:00', '12:00', 'Boulder Theater — Green Room', 3, 2),

-- Friday Afternoon
('Registration & Check-In', '2026-05-08', '12:30', '14:30', 'Rembrandt Yard — Entrance', 4, 3),
('Room Runner', '2026-05-08', '13:00', '15:00', 'Boulder Theater — Main Stage', 3, 2),
('A/V & Tech Support', '2026-05-08', '12:00', '14:00', 'CU Boulder Campus', 4, 3),
('Door Monitor', '2026-05-08', '14:00', '16:00', 'Rembrandt Yard — Summit Stage', 4, 2),
('Session Host', '2026-05-08', '14:00', '16:00', 'Galvanize Boulder', 2, 1),

-- Evening Social Events
('Venue Setup', '2026-05-04', '17:00', '19:00', 'Boulder Theater — Main Stage', 6, 4),
('Door Monitor', '2026-05-04', '18:30', '21:30', 'Boulder Theater — Main Entrance', 4, 3),
('Social Media', '2026-05-04', '19:00', '21:00', 'Boulder Theater', 2, 2),
('Venue Setup', '2026-05-05', '17:00', '19:00', 'Rembrandt Yard — Summit Stage', 6, 5),
('Door Monitor', '2026-05-05', '18:30', '21:30', 'Rembrandt Yard — Entrance', 4, 3),
('Social Media', '2026-05-05', '19:00', '21:00', 'Rembrandt Yard', 2, 2),
('Venue Setup', '2026-05-06', '17:00', '19:00', 'Galvanize Boulder', 6, 4),
('Door Monitor', '2026-05-06', '18:30', '21:30', 'Galvanize Boulder', 4, 3),
('Social Media', '2026-05-06', '19:00', '21:00', 'Galvanize Boulder', 2, 2),
('Venue Setup', '2026-05-07', '17:00', '19:00', 'CU Boulder Campus', 6, 5),
('Door Monitor', '2026-05-07', '18:30', '21:30', 'CU Boulder Campus', 4, 3),
('Social Media', '2026-05-07', '19:00', '21:00', 'CU Boulder Campus', 2, 2),
('Venue Setup', '2026-05-08', '17:00', '19:00', 'Boulder Theater — Main Stage', 6, 4),
('Door Monitor', '2026-05-08', '18:30', '21:30', 'Boulder Theater — Main Entrance', 4, 3),
('Social Media', '2026-05-08', '19:00', '21:00', 'Boulder Theater', 2, 2);

-- Insert sample session events for BSW 2026
INSERT INTO sessions (title, description, type, category, status, day, start_time, end_time, venue_id, registration_count, attachments) VALUES
-- Monday May 4, 2026 - Opening Day
('Opening Keynote: The Future of Boulder Startups', 'Join us for the opening keynote featuring Boulder''s most successful founders sharing their vision for the future of our startup ecosystem.', 'Keynote', 'Leadership', 'published', '2026-05-04', '2026-05-04T09:00:00-06:00', '2026-05-04T10:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 45, '[]'),
('Founder Stories: From Idea to Exit', 'Hear from founders who have successfully built and exited companies in Boulder. Learn from their triumphs and mistakes.', 'Panel', 'Leadership', 'published', '2026-05-04', '2026-05-04T10:30:00-06:00', '2026-05-04T11:30:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 38, '[]'),
('Product-Market Fit Workshop', 'A hands-on workshop for early-stage founders to identify and validate product-market fit. Bring your startup ideas!', 'Workshop', 'Product', 'published', '2026-05-04', '2026-05-04T09:00:00-06:00', '2026-05-04T11:00:00-06:00', (SELECT id FROM venues WHERE name = 'Rembrandt Yard — Summit Stage'), 25, '[{"label": "Workshop Materials", "url": "https://example.com/workshop"}]'),
('Engineering Leadership in Remote Teams', 'Learn how to build and lead high-performing engineering teams in a remote-first world.', 'Talk', 'Engineering', 'published', '2026-05-04', '2026-05-04T13:00:00-06:00', '2026-05-04T14:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 32, '[]'),
('Design Thinking for Startups', 'Apply design thinking principles to solve startup problems and create user-centric products.', 'Workshop', 'Design', 'published', '2026-05-04', '2026-05-04T13:00:00-06:00', '2026-05-04T15:00:00-06:00', (SELECT id FROM venues WHERE name = 'Rembrandt Yard — Summit Stage'), 20, '[]'),
('Growth Hacking 101', 'Learn proven strategies for rapid user acquisition and growth without breaking the bank.', 'Talk', 'Marketing', 'published', '2026-05-04', '2026-05-04T14:30:00-06:00', '2026-05-04T15:30:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 41, '[]'),
('Startup Operations Bootcamp', 'Everything you need to know about running startup operations from legal to finance to HR.', 'Workshop', 'Operations', 'published', '2026-05-04', '2026-05-04T15:00:00-06:00', '2026-05-04T17:00:00-06:00', (SELECT id FROM venues WHERE name = 'Rembrandt Yard — Summit Stage'), 18, '[]'),
('Investor Pitch Practice', 'Practice your pitch with real investors and get immediate feedback to improve.', 'Office Hours', 'Fundraising', 'published', '2026-05-04', '2026-05-04T16:00:00-06:00', '2026-05-04T18:00:00-06:00', (SELECT id FROM venues WHERE name = 'Galvanize Boulder'), 15, '[]'),
('Opening Night Networking', 'Kick off BSW 2026 with drinks, food, and connections with Boulder''s startup community.', 'Social', 'Community', 'published', '2026-05-04', '2026-05-04T19:00:00-06:00', '2026-05-04T21:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 120, '[]'),

-- Tuesday May 5, 2026 - Deep Dive Day
('The Art of the Pitch', 'Master the art of pitching to investors with techniques from successful founders and VCs.', 'Workshop', 'Fundraising', 'published', '2026-05-05', '2026-05-05T09:00:00-06:00', '2026-05-05T11:00:00-06:00', (SELECT id FROM venues WHERE name = 'Rembrandt Yard — Summit Stage'), 28, '[]'),
('Building Scalable Tech Teams', 'Learn how to hire, retain, and scale engineering teams as your startup grows.', 'Panel', 'Engineering', 'published', '2026-05-05', '2026-05-05T09:00:00-06:00', '2026-05-05T10:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 35, '[]'),
('User Research on a Budget', 'Conduct effective user research without breaking the bank. Learn lean methods for understanding your users.', 'Talk', 'Design', 'published', '2026-05-05', '2026-05-05T10:30:00-06:00', '2026-05-05T11:30:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 29, '[]'),
('Content Marketing That Converts', 'Create content that drives real business results and builds your brand authority.', 'Workshop', 'Marketing', 'published', '2026-05-05', '2026-05-05T13:00:00-06:00', '2026-05-05T15:00:00-06:00', (SELECT id FROM venues WHERE name = 'Rembrandt Yard — Summit Stage'), 22, '[]'),
('Legal Pitfalls for Startups', 'Avoid common legal mistakes that can kill your startup. Essential legal knowledge for founders.', 'Talk', 'Legal & Finance', 'published', '2026-05-05', '2026-05-05T13:00:00-06:00', '2026-05-05T14:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 44, '[]'),
('Community Building Strategies', 'Build a loyal community around your product and turn users into advocates.', 'Panel', 'Community', 'published', '2026-05-05', '2026-05-05T14:30:00-06:00', '2026-05-05T15:30:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 31, '[]'),
('Startup Financial Modeling', 'Learn to build financial models that investors love and help you make better business decisions.', 'Workshop', 'Legal & Finance', 'published', '2026-05-05', '2026-05-05T15:00:00-06:00', '2026-05-05T17:00:00-06:00', (SELECT id FROM venues WHERE name = 'Rembrandt Yard — Summit Stage'), 19, '[]'),
('VC Office Hours', 'Meet one-on-one with local VCs to discuss your startup and get feedback.', 'Office Hours', 'Fundraising', 'published', '2026-05-05', '2026-05-05T16:00:00-06:00', '2026-05-05T18:00:00-06:00', (SELECT id FROM venues WHERE name = 'CU Boulder Campus'), 12, '[]'),
('Boulder Startup Showcase', 'See the latest and greatest from Boulder''s startup ecosystem with demos from local founders.', 'Demo', 'Community', 'published', '2026-05-05', '2026-05-05T19:00:00-06:00', '2026-05-05T21:00:00-06:00', (SELECT id FROM venues WHERE name = 'Rembrandt Yard — Summit Stage'), 85, '[]'),

-- Wednesday May 6, 2026 - Innovation Day
('AI in Startups: Opportunities and Threats', 'Explore how AI is transforming startups and how to leverage it in your business.', 'Keynote', 'Engineering', 'published', '2026-05-06', '2026-05-06T09:00:00-06:00', '2026-05-06T10:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 52, '[]'),
('Building Products People Love', 'Learn the framework for building products that users truly love and can''t live without.', 'Talk', 'Product', 'published', '2026-05-06', '2026-05-06T10:30:00-06:00', '2026-05-06T11:30:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 37, '[]'),
('UX Research Methods for Startups', 'Practical UX research techniques you can implement immediately to improve your product.', 'Workshop', 'Design', 'published', '2026-05-06', '2026-05-06T09:00:00-06:00', '2026-05-06T11:00:00-06:00', (SELECT id FROM venues WHERE name = 'Galvanize Boulder'), 24, '[]'),
('Hiring Your First 10 Employees', 'Critical strategies for hiring your core team and setting your startup up for success.', 'Panel', 'Hiring', 'published', '2026-05-06', '2026-05-06T13:00:00-06:00', '2026-05-06T14:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 33, '[]'),
('Social Media Marketing Mastery', 'Build a social media strategy that drives real business results and brand awareness.', 'Workshop', 'Marketing', 'published', '2026-05-06', '2026-05-06T13:00:00-06:00', '2026-05-06T15:00:00-06:00', (SELECT id FROM venues WHERE name = 'CU Boulder Campus'), 21, '[]'),
('Startup Metrics That Matter', 'Learn which metrics to track and how to use them to make data-driven decisions.', 'Talk', 'Operations', 'published', '2026-05-06', '2026-05-06T14:30:00-06:00', '2026-05-06T15:30:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 28, '[]'),
('Mental Health for Founders', 'An honest discussion about founder mental health and strategies for staying healthy while building a company.', 'Panel', 'Health & Wellness', 'published', '2026-05-06', '2026-05-06T15:00:00-06:00', '2026-05-06T16:00:00-06:00', (SELECT id FROM venues WHERE name = 'Galvanize Boulder'), 45, '[]'),
('Product Management Office Hours', 'Get advice on product management challenges from experienced PMs.', 'Office Hours', 'Product', 'published', '2026-05-06', '2026-05-06T16:00:00-06:00', '2026-05-06T18:00:00-06:00', (SELECT id FROM venues WHERE name = 'Rembrandt Yard — Summit Stage'), 16, '[]'),
('Innovation Awards Ceremony', 'Celebrate Boulder''s most innovative startups and entrepreneurs.', 'Social', 'Community', 'published', '2026-05-06', '2026-05-06T19:00:00-06:00', '2026-05-06T21:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 95, '[]'),

-- Thursday May 7, 2026 - Growth Day
('Scaling from 10 to 100 Employees', 'Learn the strategies and systems needed to scale your team and operations effectively.', 'Talk', 'Operations', 'published', '2026-05-07', '2026-05-07T09:00:00-06:00', '2026-05-07T10:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 39, '[]'),
('Design Systems for Startups', 'Build scalable design systems that grow with your product and team.', 'Workshop', 'Design', 'published', '2026-05-07', '2026-05-07T09:00:00-06:00', '2026-05-07T11:00:00-06:00', (SELECT id FROM venues WHERE name = 'CU Boulder Campus'), 23, '[]'),
('SEO for Startups', 'Practical SEO strategies that drive organic traffic and growth for early-stage startups.', 'Talk', 'Marketing', 'published', '2026-05-07', '2026-05-07T10:30:00-06:00', '2026-05-07T11:30:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 34, '[]'),
('Customer Success Strategies', 'Build customer success programs that drive retention, expansion, and advocacy.', 'Panel', 'Product', 'published', '2026-05-07', '2026-05-07T13:00:00-06:00', '2026-05-07T14:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 26, '[]'),
('DevOps for Startups', 'Implement DevOps practices that improve development speed and reliability without breaking the bank.', 'Workshop', 'Engineering', 'published', '2026-05-07', '2026-05-07T13:00:00-06:00', '2026-05-07T15:00:00-06:00', (SELECT id FROM venues WHERE name = 'Galvanize Boulder'), 20, '[]'),
('Building a Sales Machine', 'Create repeatable sales processes that scale with your business.', 'Talk', 'Marketing', 'published', '2026-05-07', '2026-05-07T14:30:00-06:00', '2026-05-07T15:30:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 31, '[]'),
('Remote Team Culture', 'Build and maintain strong company culture in distributed or hybrid teams.', 'Panel', 'Leadership', 'published', '2026-05-07', '2026-05-07T15:00:00-06:00', '2026-05-07T16:00:00-06:00', (SELECT id FROM venues WHERE name = 'CU Boulder Campus'), 27, '[]'),
('Startup Legal Clinic', 'Free legal advice for startup founders from local attorneys.', 'Office Hours', 'Legal & Finance', 'published', '2026-05-07', '2026-05-07T16:00:00-06:00', '2026-05-07T18:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Public Library'), 18, '[]'),
('Founders Dinner', 'An intimate dinner for founders to connect and share experiences.', 'Social', 'Community', 'published', '2026-05-07', '2026-05-07T19:00:00-06:00', '2026-05-07T21:00:00-06:00', (SELECT id FROM venues WHERE name = 'Rembrandt Yard — Summit Stage'), 60, '[]'),

-- Friday May 8, 2026 - Future Day
('The Future of Work', 'Explore how work is evolving and what it means for startups and the future of business.', 'Keynote', 'Leadership', 'published', '2026-05-08', '2026-05-08T09:00:00-06:00', '2026-05-08T10:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 48, '[]'),
('Building in Public', 'Learn how to build your startup in public and turn your audience into customers.', 'Talk', 'Marketing', 'published', '2026-05-08', '2026-05-08T10:30:00-06:00', '2026-05-08T11:30:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 36, '[]'),
('No-Code/Low-Code for Startups', 'Build and launch products faster with no-code and low-code tools.', 'Workshop', 'Engineering', 'published', '2026-05-08', '2026-05-08T09:00:00-06:00', '2026-05-08T11:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Public Library'), 22, '[]'),
('Fundraising in 2026', 'Current trends and strategies for raising capital in today''s market.', 'Panel', 'Fundraising', 'published', '2026-05-08', '2026-05-08T13:00:00-06:00', '2026-05-08T14:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 41, '[]'),
('Personal Branding for Founders', 'Build your personal brand to support your startup and career goals.', 'Workshop', 'Marketing', 'published', '2026-05-08', '2026-05-08T13:00:00-06:00', '2026-05-08T15:00:00-06:00', (SELECT id FROM venues WHERE name = 'CU Boulder Campus'), 19, '[]'),
('Exit Strategies', 'Understand the different ways to exit your business and how to prepare for each.', 'Talk', 'Legal & Finance', 'published', '2026-05-08', '2026-05-08T14:30:00-06:00', '2026-05-08T15:30:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 33, '[]'),
('Building Sustainable Startups', 'Create businesses that are both profitable and environmentally sustainable.', 'Panel', 'Other', 'published', '2026-05-08', '2026-05-08T15:00:00-06:00', '2026-05-08T16:00:00-06:00', (SELECT id FROM venues WHERE name = 'Galvanize Boulder'), 25, '[]'),
('Founder Office Hours', 'Get advice from experienced founders on your biggest challenges.', 'Office Hours', 'Leadership', 'published', '2026-05-08', '2026-05-08T16:00:00-06:00', '2026-05-08T18:00:00-06:00', (SELECT id FROM venues WHERE name = 'Rembrandt Yard — Summit Stage'), 14, '[]'),
('Closing Party', 'Celebrate the end of BSW 2026 with drinks, food, music, and great company.', 'Social', 'Community', 'published', '2026-05-08', '2026-05-08T19:00:00-06:00', '2026-05-08T22:00:00-06:00', (SELECT id FROM venues WHERE name = 'Boulder Theater — Main Stage'), 150, '[]');

-- Insert sample users for testing
INSERT INTO users (email, name, headline, bio, role, badges, blocked, email_public) VALUES
('admin@boulderstartupweek.com', 'BSW Admin', 'Event Administrator', 'Admin account for Boulder Startup Week 2026', 'event_admin', ARRAY['facilitator'], false, true),
('sarah.chen@techcorp.com', 'Sarah Chen', 'VP Engineering at TechCorp', 'Leading engineering teams and building scalable products. Passionate about mentorship and community building.', 'volunteer', ARRAY['facilitator'], false, true),
('marcus.webb@founder.co', 'Marcus Webb', 'Founder & CEO at StartupX', 'Built and exited two startups in Boulder. Now investing in the next generation of founders.', 'volunteer', ARRAY['facilitator'], false, true),
('jordan.kim@design.studio', 'Jordan Kim', 'Product Designer', 'Creating beautiful and functional products for startups. Specializing in UX research and design systems.', 'volunteer', ARRAY['facilitator'], false, true),
('mia.torres@marketing.pro', 'Mia Torres', 'Marketing Consultant', 'Helping startups grow through data-driven marketing strategies. 10+ years in startup marketing.', 'volunteer', ARRAY['facilitator'], false, true),
('dev.patel@engineer.io', 'Dev Patel', 'Full Stack Developer', 'Building web applications and mentoring junior developers. Open to freelance projects.', 'volunteer', ARRAY['volunteer'], false, true),
('priya.nair@av.tech', 'Priya Nair', 'A/V Specialist', 'Audio/visual technician with 8+ years experience in live events and conferences.', 'volunteer', ARRAY['volunteer'], false, true);

-- Insert volunteer records for users who are volunteers
INSERT INTO volunteers (user_id, phone, availability, status, shift_count) VALUES
((SELECT id FROM users WHERE email = 'dev.patel@engineer.io'), '303-555-0123', ARRAY['2026-05-04', '2026-05-05', '2026-05-06'], 'confirmed', 3),
((SELECT id FROM users WHERE email = 'priya.nair@av.tech'), '303-555-0124', ARRAY['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07'], 'confirmed', 4),
((SELECT id FROM users WHERE email = 'sarah.chen@techcorp.com'), '303-555-0125', ARRAY['2026-05-05', '2026-05-06'], 'pending', 0),
((SELECT id FROM users WHERE email = 'marcus.webb@founder.co'), '303-555-0126', ARRAY['2026-05-04', '2026-05-08'], 'pending', 0),
((SELECT id FROM users WHERE email = 'jordan.kim@design.studio'), '303-555-0127', ARRAY['2026-05-06', '2026-05-07'], 'pending', 0),
((SELECT id FROM users WHERE email = 'mia.torres@marketing.pro'), '303-555-0128', ARRAY['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08'], 'pending', 0);
