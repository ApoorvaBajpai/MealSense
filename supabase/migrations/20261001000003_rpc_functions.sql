-- ============================================================================
-- MealSense: Core Business Logic RPCs (Migration 003)
-- Security definer functions enforcing server-side cutoffs, privacy preservation,
-- role validation, rate-limiting, and account management.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- System Tombstone Profile for Anonymized Historical Records
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'uuid') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. submit_response: Core Student Action
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION submit_response(
    p_meal_id UUID,
    p_response meal_response_type,
    p_source response_source DEFAULT 'manual'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile profiles%ROWTYPE;
    v_meal meals%ROWTYPE;
    v_is_late BOOLEAN := FALSE;
    v_change_count INT;
    v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    -- Fetch user profile
    SELECT * INTO v_profile
    FROM profiles
    WHERE id = v_user_id AND deleted_at IS NULL AND is_active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active user profile not found' USING ERRCODE = '22000';
    END IF;

    -- Fetch meal
    SELECT * INTO v_meal
    FROM meals
    WHERE id = p_meal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meal not found' USING ERRCODE = '22000';
    END IF;

    -- Tenant isolation check
    IF v_meal.hostel_id <> v_profile.hostel_id THEN
        RAISE EXCEPTION 'Cross-hostel access forbidden' USING ERRCODE = '42501';
    END IF;

    -- Status validity check
    IF v_meal.status NOT IN ('published', 'locked') THEN
        RAISE EXCEPTION 'Responses are not accepted for meals in % state', v_meal.status
            USING ERRCODE = '22000';
    END IF;

    -- Time boundary checks
    IF v_now > v_meal.ends_at THEN
        RAISE EXCEPTION 'Meal service has already ended' USING ERRCODE = '22000';
    END IF;

    IF v_now > v_meal.response_cutoff THEN
        v_is_late := TRUE;
    END IF;

    -- Rate limiting: Max 10 response updates per user per meal
    SELECT COUNT(*) INTO v_change_count
    FROM response_log
    WHERE user_id = v_user_id AND meal_id = p_meal_id;

    IF v_change_count >= 10 THEN
        RAISE EXCEPTION 'Rate limit exceeded: maximum 10 changes allowed per meal'
            USING ERRCODE = '23514';
    END IF;

    -- Upsert current response
    INSERT INTO meal_responses (meal_id, user_id, response, responded_at, is_late, source)
    VALUES (p_meal_id, v_user_id, p_response, v_now, v_is_late, p_source)
    ON CONFLICT (meal_id, user_id)
    DO UPDATE SET
        response = EXCLUDED.response,
        responded_at = EXCLUDED.responded_at,
        is_late = EXCLUDED.is_late,
        source = EXCLUDED.source;

    -- Append to immutable response log
    INSERT INTO response_log (meal_id, user_id, response, is_late, source, at)
    VALUES (p_meal_id, v_user_id, p_response, v_now, v_is_late, p_source);

    RETURN jsonb_build_object(
        'success', TRUE,
        'meal_id', p_meal_id,
        'response', p_response,
        'is_late', v_is_late,
        'responded_at', v_now
    );
END;
$$;


-- ----------------------------------------------------------------------------
-- 2. set_away & cancel_away: Absence Range Management
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_away(
    p_from_date DATE,
    p_to_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile profiles%ROWTYPE;
    v_absence_id UUID;
    v_meal RECORD;
    v_meals_affected INT := 0;
    v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    IF p_to_date < p_from_date THEN
        RAISE EXCEPTION 'Invalid date range: to_date cannot be before from_date' USING ERRCODE = '22000';
    END IF;

    SELECT * INTO v_profile
    FROM profiles
    WHERE id = v_user_id AND deleted_at IS NULL AND is_active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active user profile not found' USING ERRCODE = '22000';
    END IF;

    -- Record absence
    INSERT INTO absences (user_id, from_date, to_date)
    VALUES (v_user_id, p_from_date, p_to_date)
    RETURNING id INTO v_absence_id;

    -- Apply automatic skip responses for published, non-locked meals in the window
    FOR v_meal IN
        SELECT id FROM meals
        WHERE hostel_id = v_profile.hostel_id
          AND meal_date BETWEEN p_from_date AND p_to_date
          AND status = 'published'
          AND v_now <= response_cutoff
    LOOP
        INSERT INTO meal_responses (meal_id, user_id, response, responded_at, is_late, source)
        VALUES (v_meal.id, v_user_id, 'skip', v_now, FALSE, 'away')
        ON CONFLICT (meal_id, user_id)
        DO UPDATE SET
            response = 'skip',
            responded_at = v_now,
            is_late = FALSE,
            source = 'away';

        INSERT INTO response_log (meal_id, user_id, response, is_late, source, at)
        VALUES (v_meal.id, v_user_id, 'skip', FALSE, 'away', v_now);

        v_meals_affected := v_meals_affected + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', TRUE,
        'absence_id', v_absence_id,
        'meals_affected', v_meals_affected
    );
END;
$$;

CREATE OR REPLACE FUNCTION cancel_away(
    p_absence_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_absence absences%ROWTYPE;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_reverted_count INT := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_absence
    FROM absences
    WHERE id = p_absence_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Absence record not found' USING ERRCODE = '22000';
    END IF;

    IF v_absence.cancelled_at IS NOT NULL THEN
        RAISE EXCEPTION 'Absence is already cancelled' USING ERRCODE = '22000';
    END IF;

    -- Mark absence cancelled
    UPDATE absences
    SET cancelled_at = v_now
    WHERE id = p_absence_id;

    -- Remove auto-skip responses that were created by 'away' and have not reached cutoff
    WITH deleted AS (
        DELETE FROM meal_responses r
        USING meals m
        WHERE r.meal_id = m.id
          AND r.user_id = v_user_id
          AND r.source = 'away'
          AND m.meal_date BETWEEN v_absence.from_date AND v_absence.to_date
          AND m.status = 'published'
          AND v_now <= m.response_cutoff
        RETURNING r.meal_id
    )
    SELECT COUNT(*) INTO v_reverted_count FROM deleted;

    RETURN jsonb_build_object(
        'success', TRUE,
        'absence_id', p_absence_id,
        'reverted_meals', v_reverted_count
    );
END;
$$;


-- ----------------------------------------------------------------------------
-- 3. publish_meal: Admin/Kitchen Action
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION publish_meal(
    p_meal_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile profiles%ROWTYPE;
    v_meal meals%ROWTYPE;
    v_student_count INT;
    v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
    IF v_profile.role NOT IN ('kitchen', 'admin') THEN
        RAISE EXCEPTION 'Only kitchen or admin staff may publish meals' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_meal FROM meals WHERE id = p_meal_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meal not found' USING ERRCODE = '22000';
    END IF;

    IF v_meal.hostel_id <> v_profile.hostel_id THEN
        RAISE EXCEPTION 'Cross-hostel operation forbidden' USING ERRCODE = '42501';
    END IF;

    IF v_meal.status <> 'draft' THEN
        RAISE EXCEPTION 'Only draft meals can be published' USING ERRCODE = '22000';
    END IF;

    -- Count active students for the denominator snapshot
    SELECT COUNT(*) INTO v_student_count
    FROM profiles
    WHERE hostel_id = v_meal.hostel_id
      AND role = 'student'
      AND is_active = TRUE
      AND deleted_at IS NULL;

    UPDATE meals
    SET status = 'published',
        published_at = v_now,
        registered_snapshot = v_student_count
    WHERE id = p_meal_id;

    -- Initialize intent counts row
    INSERT INTO meal_intent_counts (meal_id, n_eat, n_skip, n_late, updated_at)
    VALUES (p_meal_id, 0, 0, 0, v_now)
    ON CONFLICT (meal_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', TRUE,
        'meal_id', p_meal_id,
        'registered_snapshot', v_student_count,
        'status', 'published'
    );
END;
$$;


-- ----------------------------------------------------------------------------
-- 4. Outcome Recording RPCs (Kitchen/Admin)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_attendance(
    p_meal_id UUID,
    p_actual_count INT,
    p_method attendance_method DEFAULT 'tally',
    p_batches JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile profiles%ROWTYPE;
    v_meal meals%ROWTYPE;
    v_soft_warning BOOLEAN := FALSE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
    IF v_profile.role NOT IN ('kitchen', 'admin') THEN
        RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_meal FROM meals WHERE id = p_meal_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meal not found' USING ERRCODE = '22000';
    END IF;

    IF v_meal.hostel_id <> v_profile.hostel_id THEN
        RAISE EXCEPTION 'Cross-hostel operation forbidden' USING ERRCODE = '42501';
    END IF;

    -- Soft anomaly check
    IF p_actual_count > (v_meal.registered_snapshot * 1.05) THEN
        v_soft_warning := TRUE;
    END IF;

    INSERT INTO attendance (meal_id, actual_count, method, recorded_by, recorded_at, batches)
    VALUES (p_meal_id, p_actual_count, p_method, v_user_id, clock_timestamp(), p_batches)
    ON CONFLICT (meal_id)
    DO UPDATE SET
        actual_count = EXCLUDED.actual_count,
        method = EXCLUDED.method,
        recorded_by = EXCLUDED.recorded_by,
        recorded_at = EXCLUDED.recorded_at,
        batches = EXCLUDED.batches;

    RETURN jsonb_build_object(
        'success', TRUE,
        'meal_id', p_meal_id,
        'actual_count', p_actual_count,
        'soft_warning', v_soft_warning
    );
END;
$$;

CREATE OR REPLACE FUNCTION record_preparation(
    p_meal_id UUID,
    p_prepared_servings INT,
    p_followed_recommendation BOOLEAN,
    p_ran_short BOOLEAN DEFAULT FALSE,
    p_short_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile profiles%ROWTYPE;
    v_meal meals%ROWTYPE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
    IF v_profile.role NOT IN ('kitchen', 'admin') THEN
        RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_meal FROM meals WHERE id = p_meal_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meal not found' USING ERRCODE = '22000';
    END IF;

    IF v_meal.hostel_id <> v_profile.hostel_id THEN
        RAISE EXCEPTION 'Cross-hostel operation forbidden' USING ERRCODE = '42501';
    END IF;

    INSERT INTO preparation (meal_id, prepared_servings, followed_recommendation, ran_short, short_note, recorded_by, recorded_at)
    VALUES (p_meal_id, p_prepared_servings, p_followed_recommendation, p_ran_short, p_short_note, v_user_id, clock_timestamp())
    ON CONFLICT (meal_id)
    DO UPDATE SET
        prepared_servings = EXCLUDED.prepared_servings,
        followed_recommendation = EXCLUDED.followed_recommendation,
        ran_short = EXCLUDED.ran_short,
        short_note = EXCLUDED.short_note,
        recorded_by = EXCLUDED.recorded_by,
        recorded_at = EXCLUDED.recorded_at;

    RETURN jsonb_build_object(
        'success', TRUE,
        'meal_id', p_meal_id,
        'prepared_servings', p_prepared_servings
    );
END;
$$;

CREATE OR REPLACE FUNCTION record_waste(
    p_meal_id UUID,
    p_records JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile profiles%ROWTYPE;
    v_meal meals%ROWTYPE;
    v_elem JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
    IF v_profile.role NOT IN ('kitchen', 'admin') THEN
        RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_meal FROM meals WHERE id = p_meal_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meal not found' USING ERRCODE = '22000';
    END IF;

    IF v_meal.hostel_id <> v_profile.hostel_id THEN
        RAISE EXCEPTION 'Cross-hostel operation forbidden' USING ERRCODE = '42501';
    END IF;

    -- Replace existing waste records for this meal
    DELETE FROM waste_records WHERE meal_id = p_meal_id;

    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_records)
    LOOP
        INSERT INTO waste_records (
            meal_id,
            waste_type,
            category,
            quantity_kg,
            servings_est,
            donated,
            notes,
            recorded_by,
            recorded_at
        )
        VALUES (
            p_meal_id,
            (v_elem->>'waste_type')::waste_type,
            COALESCE(v_elem->>'category', 'general'),
            (v_elem->>'quantity_kg')::numeric,
            (v_elem->>'servings_est')::int,
            COALESCE((v_elem->>'donated')::boolean, FALSE),
            v_elem->>'notes',
            v_user_id,
            clock_timestamp()
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', TRUE,
        'meal_id', p_meal_id,
        'count', jsonb_array_length(p_records)
    );
END;
$$;


-- ----------------------------------------------------------------------------
-- 5. delete_my_account & export_my_data: Privacy & DPDP Compliance
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    -- 1. Soft-delete profile
    UPDATE profiles
    SET is_active = FALSE,
        deleted_at = clock_timestamp(),
        display_name = 'Deleted Student',
        block = 'N/A'
    WHERE id = v_user_id;

    -- 2. Clear personal channels
    DELETE FROM notification_prefs WHERE user_id = v_user_id;
    DELETE FROM action_tokens WHERE user_id = v_user_id;
    DELETE FROM experiment_assignments WHERE user_id = v_user_id;

    -- 3. Anonymize feedback comments
    UPDATE feedback
    SET comment = '[Comment redacted on account deletion]'
    WHERE user_id = v_user_id;

    -- Note: meal_responses and response_log maintain aggregate integrity,
    -- but no PII remains linked since profile display_name and channels are removed.

    RETURN jsonb_build_object('success', TRUE, 'deleted_at', clock_timestamp());
END;
$$;

CREATE OR REPLACE FUNCTION export_my_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_build_object(
        'profile', (SELECT to_jsonb(p) FROM profiles p WHERE id = v_user_id),
        'preferences', (SELECT jsonb_agg(to_jsonb(np)) FROM notification_prefs np WHERE user_id = v_user_id),
        'absences', (SELECT jsonb_agg(to_jsonb(a)) FROM absences a WHERE user_id = v_user_id),
        'responses', (SELECT jsonb_agg(to_jsonb(r)) FROM meal_responses r WHERE user_id = v_user_id),
        'feedback', (SELECT jsonb_agg(to_jsonb(f)) FROM feedback f WHERE user_id = v_user_id)
    ) INTO v_result;

    RETURN v_result;
END;
$$;
