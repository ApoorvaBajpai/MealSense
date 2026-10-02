-- ============================================================================
-- MealSense: Database Schema (Migration 001)
-- Canonical definitions for hostels, profiles, meals, responses, outcomes,
-- forecasting, analytics, audit logs, and security tokens.
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('student', 'kitchen', 'admin');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'snacks', 'dinner');
CREATE TYPE meal_status AS ENUM ('draft', 'published', 'locked', 'served', 'closed', 'cancelled');
CREATE TYPE meal_response_type AS ENUM ('eat', 'skip');
CREATE TYPE response_source AS ENUM ('manual', 'bulk', 'away', 'link');
CREATE TYPE attendance_method AS ENUM ('tally', 'register', 'token', 'biometric');
CREATE TYPE waste_type AS ENUM ('not_served', 'uneaten', 'spoiled');
CREATE TYPE forecast_stage AS ENUM ('history_only', 'with_intent');
CREATE TYPE model_status AS ENUM ('shadow', 'champion', 'retired');
CREATE TYPE calendar_impact AS ENUM ('lower', 'neutral', 'higher', 'unknown');
CREATE TYPE notification_channel AS ENUM ('telegram', 'email', 'web_push');

-- 1. Hostels (Tenant root)
CREATE TABLE hostels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    kg_per_serving NUMERIC(5, 3) NOT NULL DEFAULT 0.350 CHECK (kg_per_serving > 0),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2. Profiles (Linked to auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE RESTRICT,
    role user_role NOT NULL DEFAULT 'student',
    display_name TEXT NOT NULL,
    block TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    locale TEXT NOT NULL DEFAULT 'en',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_profiles_hostel_role ON profiles(hostel_id, role) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_hostel_block ON profiles(hostel_id, block) WHERE deleted_at IS NULL;

-- 3. Notification Preferences & Channels
CREATE TABLE notification_prefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    address TEXT, -- Email or Telegram Chat ID
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    quiet_start TIME,
    quiet_end TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (user_id, channel)
);

-- 4. Menus (Library)
CREATE TABLE menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    items TEXT[] NOT NULL DEFAULT '{}',
    category TEXT NOT NULL DEFAULT 'regular',
    kg_per_serving_override NUMERIC(5, 3) CHECK (kg_per_serving_override IS NULL OR kg_per_serving_override > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_menus_hostel ON menus(hostel_id);

-- 5. Weekly Meal Templates
CREATE TABLE meal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    type meal_type NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    cutoff_offset_minutes INT NOT NULL DEFAULT 120 CHECK (cutoff_offset_minutes > 0),
    default_menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (hostel_id, weekday, type)
);

-- 6. Servable Meals
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    meal_date DATE NOT NULL,
    type meal_type NOT NULL,
    menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    response_cutoff TIMESTAMPTZ NOT NULL,
    status meal_status NOT NULL DEFAULT 'draft',
    registered_snapshot INT DEFAULT 0 CHECK (registered_snapshot >= 0),
    published_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_meals_hostel_date_type UNIQUE (hostel_id, meal_date, type),
    CONSTRAINT chk_meal_window CHECK (ends_at > starts_at),
    CONSTRAINT chk_cutoff_before_end CHECK (response_cutoff <= ends_at)
);

CREATE INDEX idx_meals_hostel_date ON meals(hostel_id, meal_date);
CREATE INDEX idx_meals_status ON meals(status);
CREATE INDEX idx_meals_cutoff ON meals(response_cutoff) WHERE status = 'published';

-- 7. Current Meal Response per user (Private to student)
CREATE TABLE meal_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    response meal_response_type NOT NULL,
    responded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    source response_source NOT NULL DEFAULT 'manual',
    UNIQUE (meal_id, user_id)
);

CREATE INDEX idx_meal_responses_meal ON meal_responses(meal_id);
CREATE INDEX idx_meal_responses_user ON meal_responses(user_id);

-- 8. Append-only Response History Log (Audit/behavior trace)
CREATE TABLE response_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    response meal_response_type NOT NULL,
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    source response_source NOT NULL DEFAULT 'manual',
    at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_response_log_user_meal ON response_log(user_id, meal_id);
CREATE INDEX idx_response_log_meal ON response_log(meal_id);

-- 9. Absences / Away Ranges
CREATE TABLE absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT chk_absence_dates CHECK (to_date >= from_date)
);

CREATE INDEX idx_absences_user ON absences(user_id) WHERE cancelled_at IS NULL;

-- 10. Trigger-Maintained Aggregate Intent Counts (Kitchen/Admin read this, NEVER meal_responses)
CREATE TABLE meal_intent_counts (
    meal_id UUID PRIMARY KEY REFERENCES meals(id) ON DELETE CASCADE,
    n_eat INT NOT NULL DEFAULT 0 CHECK (n_eat >= 0),
    n_skip INT NOT NULL DEFAULT 0 CHECK (n_skip >= 0),
    n_late INT NOT NULL DEFAULT 0 CHECK (n_late >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 11. Actual Attendance Record
CREATE TABLE attendance (
    meal_id UUID PRIMARY KEY REFERENCES meals(id) ON DELETE CASCADE,
    actual_count INT NOT NULL CHECK (actual_count >= 0),
    method attendance_method NOT NULL DEFAULT 'tally',
    recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    batches JSONB DEFAULT '[]'::jsonb
);

-- 12. Kitchen Preparation Record
CREATE TABLE preparation (
    meal_id UUID PRIMARY KEY REFERENCES meals(id) ON DELETE CASCADE,
    prepared_servings INT NOT NULL CHECK (prepared_servings >= 0),
    followed_recommendation BOOLEAN NOT NULL DEFAULT TRUE,
    ran_short BOOLEAN NOT NULL DEFAULT FALSE,
    short_note TEXT,
    recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 13. Waste Records
CREATE TABLE waste_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    waste_type waste_type NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    quantity_kg NUMERIC(6, 3) NOT NULL CHECK (quantity_kg >= 0),
    servings_est INT CHECK (servings_est IS NULL OR servings_est >= 0),
    donated BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_waste_records_meal ON waste_records(meal_id);

-- 14. Model Version Registry
CREATE TABLE model_versions (
    version TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    status model_status NOT NULL DEFAULT 'shadow',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 15. Stored Predictions
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    stage forecast_stage NOT NULL,
    predicted INT NOT NULL CHECK (predicted >= 0),
    lower INT NOT NULL CHECK (lower >= 0),
    upper INT NOT NULL CHECK (upper >= lower),
    confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
    model_version TEXT NOT NULL REFERENCES model_versions(version) ON DELETE RESTRICT,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (meal_id, stage, model_version)
);

CREATE INDEX idx_predictions_meal ON predictions(meal_id, stage);

-- 16. Backtest Runs
CREATE TABLE backtest_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version TEXT NOT NULL REFERENCES model_versions(version) ON DELETE RESTRICT,
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    meal_type meal_type,
    window TEXT NOT NULL,
    mae NUMERIC(6, 2) NOT NULL,
    mape NUMERIC(5, 2) NOT NULL,
    bias NUMERIC(6, 2) NOT NULL,
    coverage NUMERIC(5, 2) NOT NULL, -- Percentage [0-100]
    n INT NOT NULL CHECK (n > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 17. Student Feedback / Ratings
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (meal_id, user_id)
);

CREATE INDEX idx_feedback_meal ON feedback(meal_id);

-- 18. Academic, Holiday and Event Calendar
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    kind TEXT NOT NULL, -- 'exam', 'holiday', 'festival', 'sports'
    name TEXT NOT NULL,
    expected_impact calendar_impact NOT NULL DEFAULT 'neutral',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_calendar_dates CHECK (date_to >= date_from)
);

CREATE INDEX idx_calendar_events_dates ON calendar_events(hostel_id, date_from, date_to);

-- 19. First-party Product Analytics Events
CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    props JSONB NOT NULL DEFAULT '{}'::jsonb,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_events_name_time ON events(name, created_at);
CREATE INDEX idx_events_hostel_time ON events(hostel_id, created_at);

-- 20. Experiments Definition and Assignments
CREATE TABLE experiments (
    key TEXT PRIMARY KEY,
    hypothesis TEXT NOT NULL,
    variants JSONB NOT NULL,
    unit TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'draft',
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    primary_metric TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE experiment_assignments (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    experiment_key TEXT NOT NULL REFERENCES experiments(key) ON DELETE CASCADE,
    variant TEXT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (user_id, experiment_key)
);

-- 21. Audit Log (Operational changes trace)
CREATE TABLE audit_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    table_name TEXT NOT NULL,
    row_id TEXT NOT NULL,
    action TEXT NOT NULL,
    before JSONB,
    after JSONB,
    at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_audit_table_row ON audit_log(table_name, row_id);
CREATE INDEX idx_audit_at ON audit_log(at);

-- 22. Background & Cron Job Runs
CREATE TABLE job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL,
    detail JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_job_runs_job_time ON job_runs(job_name, started_at);

-- 23. Single-Use Action Tokens (One-tap signed links for reminders)
CREATE TABLE action_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    action meal_response_type NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_action_tokens_user_meal ON action_tokens(user_id, meal_id);
