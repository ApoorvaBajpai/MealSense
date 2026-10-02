-- ============================================================================
-- MealSense: Database Seed Script
-- Provisions demo hostel, sample menus, templates, demo accounts, and meal history.
-- ============================================================================

-- 1. Create Demo Hostel
INSERT INTO hostels (id, name, timezone, kg_per_serving, is_demo)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Ramanujan Hall Mess',
    'Asia/Kolkata',
    0.340,
    TRUE
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Register Forecasting Model Versions
INSERT INTO model_versions (version, description, status)
VALUES
    ('v0-naive', 'Previous day same meal type benchmark', 'retired'),
    ('v0-weekly', '4-week trailing mean benchmark', 'shadow'),
    ('v1-weighted-rate', 'Exponentially weighted rate with calendar effects', 'shadow'),
    ('v1-intent', 'Non-negative least squares intent model with conformal intervals', 'champion')
ON CONFLICT (version) DO UPDATE SET status = EXCLUDED.status;

-- 3. Menus Library
INSERT INTO menus (id, hostel_id, name, items, category, kg_per_serving_override)
VALUES
    (
        'm0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'South Indian Breakfast',
        ARRAY['Masala Dosa', 'Idli-Vada', 'Coconut Chutney', 'Sambar', 'Filter Coffee'],
        'breakfast',
        0.280
    ),
    (
        'm0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'Puri Chole & Halwa',
        ARRAY['Crispy Puri', 'Amritsari Chole', 'Sooji Halwa', 'Pickle', 'Tea'],
        'breakfast',
        0.320
    ),
    (
        'm0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000001',
        'North Indian Deluxe Thali',
        ARRAY['Paneer Butter Masala', 'Dal Makhani', 'Jeera Rice', 'Tandoori Roti', 'Boondi Raita', 'Gulab Jamun'],
        'deluxe',
        0.420
    ),
    (
        'm0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000001',
        'Everyday Comfort Lunch',
        ARRAY['Rajma Masala', 'Steamed Rice', 'Aloo Gobi', 'Phulka Roti', 'Green Salad'],
        'regular',
        0.350
    ),
    (
        'm0000000-0000-0000-0000-000000000005',
        'a0000000-0000-0000-0000-000000000001',
        'Homestyle Dinner',
        ARRAY['Yellow Dal Tadka', 'Seasonal Subzi', 'Steamed Rice', 'Tawa Roti', 'Curd'],
        'regular',
        0.330
    )
ON CONFLICT (id) DO NOTHING;

-- 4. Weekly Templates (Monday through Sunday)
INSERT INTO meal_templates (hostel_id, weekday, type, start_time, end_time, cutoff_offset_minutes, default_menu_id)
VALUES
    -- Breakfast daily
    ('a0000000-0000-0000-0000-000000000001', 1, 'breakfast', '07:30', '09:30', 120, 'm0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000000001', 2, 'breakfast', '07:30', '09:30', 120, 'm0000000-0000-0000-0000-000000000002'),
    -- Lunch daily
    ('a0000000-0000-0000-0000-000000000001', 1, 'lunch', '12:30', '14:30', 150, 'm0000000-0000-0000-0000-000000000004'),
    ('a0000000-0000-0000-0000-000000000001', 0, 'lunch', '12:30', '14:30', 180, 'm0000000-0000-0000-0000-000000000003'),
    -- Dinner daily
    ('a0000000-0000-0000-0000-000000000001', 1, 'dinner', '19:30', '21:30', 180, 'm0000000-0000-0000-0000-000000000005')
ON CONFLICT (hostel_id, weekday, type) DO NOTHING;

-- 5. Calendar Events
INSERT INTO calendar_events (hostel_id, date_from, date_to, kind, name, expected_impact)
VALUES
    ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE + 5, CURRENT_DATE + 10, 'exam', 'Mid-Semester Examinations', 'lower'),
    ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE + 20, CURRENT_DATE + 24, 'festival', 'Diwali Recess', 'lower')
ON CONFLICT DO NOTHING;

-- 6. Demo User Profiles (Mocked auth UIDs)
INSERT INTO profiles (id, hostel_id, role, display_name, block, is_active, locale)
VALUES
    ('u0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'student', 'Aarav Sharma', 'Block A', TRUE, 'en'),
    ('u0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'student', 'Diya Patel', 'Block B', TRUE, 'en'),
    ('u0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'kitchen', 'Master Chef Rajesh', 'Kitchen Staff', TRUE, 'en'),
    ('u0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'admin', 'Warden Dr. Verma', 'Administration', TRUE, 'en')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

-- 7. Seed Sample Meals (Today, Tomorrow, and Yesterday)
-- Yesterday (Closed meal with full outcomes for analytics testing)
INSERT INTO meals (
    id, hostel_id, meal_date, type, menu_id, starts_at, ends_at, response_cutoff, status, registered_snapshot, published_at, locked_at
)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    CURRENT_DATE - 1,
    'lunch',
    'm0000000-0000-0000-0000-000000000004',
    (CURRENT_DATE - 1 + TIME '12:30:00') AT TIME ZONE 'Asia/Kolkata',
    (CURRENT_DATE - 1 + TIME '14:30:00') AT TIME ZONE 'Asia/Kolkata',
    (CURRENT_DATE - 1 + TIME '10:00:00') AT TIME ZONE 'Asia/Kolkata',
    'closed',
    450,
    (CURRENT_DATE - 2 + TIME '18:00:00') AT TIME ZONE 'Asia/Kolkata',
    (CURRENT_DATE - 1 + TIME '10:00:00') AT TIME ZONE 'Asia/Kolkata'
)
ON CONFLICT (hostel_id, meal_date, type) DO NOTHING;

-- Intent counts for yesterday
INSERT INTO meal_intent_counts (meal_id, n_eat, n_skip, n_late)
VALUES ('f0000000-0000-0000-0000-000000000001', 340, 65, 8)
ON CONFLICT (meal_id) DO UPDATE SET n_eat = EXCLUDED.n_eat;

-- Predictions for yesterday
INSERT INTO predictions (meal_id, stage, predicted, lower, upper, confidence, model_version, features)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'history_only', 360, 335, 385, 'medium', 'v1-weighted-rate', '{"recent_mean": 358}'::jsonb),
    ('f0000000-0000-0000-0000-000000000001', 'with_intent', 348, 332, 364, 'high', 'v1-intent', '{"n_eat": 340, "n_skip": 65}'::jsonb)
ON CONFLICT (meal_id, stage, model_version) DO NOTHING;

-- Outcomes for yesterday
INSERT INTO attendance (meal_id, actual_count, method, recorded_by, recorded_at)
VALUES ('f0000000-0000-0000-0000-000000000001', 345, 'tally', 'u0000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP)
ON CONFLICT (meal_id) DO NOTHING;

INSERT INTO preparation (meal_id, prepared_servings, followed_recommendation, ran_short, recorded_by, recorded_at)
VALUES ('f0000000-0000-0000-0000-000000000001', 355, TRUE, FALSE, 'u0000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP)
ON CONFLICT (meal_id) DO NOTHING;

INSERT INTO waste_records (meal_id, waste_type, category, quantity_kg, servings_est, donated, recorded_by)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'not_served', 'subzi_and_rice', 3.500, 10, FALSE, 'u0000000-0000-0000-0000-000000000003'),
    ('f0000000-0000-0000-0000-000000000001', 'uneaten', 'plate_waste', 4.800, 14, FALSE, 'u0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Today's Lunch (Published, Active with countdown)
INSERT INTO meals (
    id, hostel_id, meal_date, type, menu_id, starts_at, ends_at, response_cutoff, status, registered_snapshot, published_at
)
VALUES (
    'f0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    'lunch',
    'm0000000-0000-0000-0000-000000000004',
    (CURRENT_DATE + TIME '12:30:00') AT TIME ZONE 'Asia/Kolkata',
    (CURRENT_DATE + TIME '14:30:00') AT TIME ZONE 'Asia/Kolkata',
    (CURRENT_DATE + TIME '11:00:00') AT TIME ZONE 'Asia/Kolkata',
    'published',
    450,
    (CURRENT_DATE - 1 + TIME '20:00:00') AT TIME ZONE 'Asia/Kolkata'
)
ON CONFLICT (hostel_id, meal_date, type) DO NOTHING;

INSERT INTO meal_intent_counts (meal_id, n_eat, n_skip, n_late)
VALUES ('f0000000-0000-0000-0000-000000000002', 290, 48, 2)
ON CONFLICT (meal_id) DO NOTHING;

INSERT INTO predictions (meal_id, stage, predicted, lower, upper, confidence, model_version, features)
VALUES
    ('f0000000-0000-0000-0000-000000000002', 'history_only', 355, 330, 380, 'high', 'v1-weighted-rate', '{"weekday": 4}'::jsonb),
    ('f0000000-0000-0000-0000-000000000002', 'with_intent', 338, 322, 354, 'high', 'v1-intent', '{"intent_delta": -17}'::jsonb)
ON CONFLICT (meal_id, stage, model_version) DO NOTHING;

-- Refresh Materialized View
REFRESH MATERIALIZED VIEW mv_daily_metrics;
