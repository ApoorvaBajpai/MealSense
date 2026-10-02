-- ============================================================================
-- MealSense: pgTAP Automated Security & RLS Matrix Tests
-- Verifies:
-- 1. Student response isolation (Student B cannot see Student A's response)
-- 2. Staff privacy barrier (Kitchen and Admin cannot read individual responses)
-- 3. Role enforcement (Students cannot record attendance, prep, or waste)
-- 4. Cross-hostel tenant isolation
-- ============================================================================

BEGIN;
SELECT plan(12);

-- ----------------------------------------------------------------------------
-- Test Fixtures Setup
-- ----------------------------------------------------------------------------
-- Create test hostels
INSERT INTO hostels (id, name, timezone, kg_per_serving, is_demo)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Hostel Alpha', 'Asia/Kolkata', 0.350, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Hostel Beta', 'Asia/Kolkata', 0.350, TRUE);

-- Create auth users in auth.users mock/table
INSERT INTO auth.users (id, email)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'studentA@test.edu'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'studentB@test.edu'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'kitchen@test.edu'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'admin@test.edu'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'studentBeta@test.edu')
ON CONFLICT (id) DO NOTHING;

-- Create profiles
INSERT INTO profiles (id, hostel_id, role, display_name, block, is_active)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'student', 'Student A', 'A', TRUE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'student', 'Student B', 'B', TRUE),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'kitchen', 'Chef Kitchen', 'Staff', TRUE),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'admin', 'Warden Admin', 'Office', TRUE),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'student', 'Student Beta', 'C', TRUE);

-- Create test meal in Hostel Alpha
INSERT INTO meals (id, hostel_id, meal_date, type, starts_at, ends_at, response_cutoff, status, registered_snapshot)
VALUES (
    '99999999-9999-9999-9999-999999999999',
    '11111111-1111-1111-1111-111111111111',
    CURRENT_DATE + 1,
    'lunch',
    (CURRENT_DATE + 1 + TIME '12:00:00') AT TIME ZONE 'Asia/Kolkata',
    (CURRENT_DATE + 1 + TIME '14:00:00') AT TIME ZONE 'Asia/Kolkata',
    (CURRENT_DATE + 1 + TIME '10:00:00') AT TIME ZONE 'Asia/Kolkata',
    'published',
    2
);

-- Seed response from Student A
INSERT INTO meal_responses (meal_id, user_id, response, responded_at, is_late, source)
VALUES (
    '99999999-9999-9999-9999-999999999999',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'eat',
    NOW(),
    FALSE,
    'manual'
);

-- ----------------------------------------------------------------------------
-- Tests: As Student A
-- ----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

SELECT is(
    (SELECT count(*)::int FROM meal_responses),
    1,
    'Student A can see their own meal response'
);

SELECT throws_ok(
    $$ SELECT record_attendance('99999999-9999-9999-9999-999999999999', 50) $$,
    '42501',
    NULL,
    'Student cannot call record_attendance'
);

SELECT throws_ok(
    $$ SELECT record_preparation('99999999-9999-9999-9999-999999999999', 100, true) $$,
    '42501',
    NULL,
    'Student cannot call record_preparation'
);

-- ----------------------------------------------------------------------------
-- Tests: As Student B (Privacy Boundary)
-- ----------------------------------------------------------------------------
SET LOCAL "request.jwt.claim.sub" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT is(
    (SELECT count(*)::int FROM meal_responses WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    0,
    'Student B CANNOT see Student A''s meal response (Returns 0 rows)'
);

SELECT is(
    (SELECT count(*)::int FROM meal_responses),
    0,
    'Student B sees 0 total responses when they have not responded yet'
);

-- ----------------------------------------------------------------------------
-- Tests: As Kitchen Staff (Staff Privacy Barrier)
-- ----------------------------------------------------------------------------
SET LOCAL "request.jwt.claim.sub" = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

SELECT is(
    (SELECT count(*)::int FROM meal_responses),
    0,
    'Kitchen staff CANNOT select any row from meal_responses'
);

SELECT is(
    (SELECT n_eat FROM meal_intent_counts WHERE meal_id = '99999999-9999-9999-9999-999999999999'),
    1,
    'Kitchen staff CAN read aggregate meal_intent_counts'
);

SELECT lives_ok(
    $$ SELECT record_preparation('99999999-9999-9999-9999-999999999999', 120, true) $$,
    'Kitchen staff can record preparation'
);

-- ----------------------------------------------------------------------------
-- Tests: As Admin Staff
-- ----------------------------------------------------------------------------
SET LOCAL "request.jwt.claim.sub" = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

SELECT is(
    (SELECT count(*)::int FROM meal_responses),
    0,
    'Admin staff CANNOT select individual rows from meal_responses'
);

SELECT is(
    (SELECT n_eat FROM meal_intent_counts WHERE meal_id = '99999999-9999-9999-9999-999999999999'),
    1,
    'Admin staff CAN read aggregate meal_intent_counts'
);

-- ----------------------------------------------------------------------------
-- Tests: Cross-Hostel Isolation (Student from Hostel Beta)
-- ----------------------------------------------------------------------------
SET LOCAL "request.jwt.claim.sub" = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

SELECT is(
    (SELECT count(*)::int FROM meals WHERE hostel_id = '11111111-1111-1111-1111-111111111111'),
    0,
    'Hostel Beta student CANNOT see meals from Hostel Alpha'
);

SELECT throws_ok(
    $$ SELECT submit_response('99999999-9999-9999-9999-999999999999', 'eat') $$,
    '42501',
    NULL,
    'Hostel Beta student cannot submit response to Hostel Alpha meal'
);

SELECT * FROM finish();
ROLLBACK;
