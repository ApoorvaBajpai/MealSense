-- ============================================================================
-- MealSense: State Machine & Trigger Automations (Migration 002)
-- Enforces meal lifecycle, aggregate intent counts maintenance, and operational auditing.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Automatic updated_at Trigger Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_hostels_updated_at
BEFORE UPDATE ON hostels
FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_touch_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_touch_menus_updated_at
BEFORE UPDATE ON menus
FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_touch_meal_templates_updated_at
BEFORE UPDATE ON meal_templates
FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_touch_meals_updated_at
BEFORE UPDATE ON meals
FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();


-- ----------------------------------------------------------------------------
-- 2. Meal Lifecycle State Machine Trigger
-- Enforces:
-- draft -> published -> locked -> served -> closed
-- Any state (except closed) -> cancelled
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_meal_state_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_has_attendance BOOLEAN;
    v_has_preparation BOOLEAN;
    v_has_waste BOOLEAN;
BEGIN
    -- No change in status
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Cannot change status of closed or cancelled meals
    IF OLD.status = 'closed' THEN
        RAISE EXCEPTION 'Meal % is already closed and cannot transition to %', OLD.id, NEW.status
            USING ERRCODE = '22000';
    END IF;

    IF OLD.status = 'cancelled' THEN
        RAISE EXCEPTION 'Meal % is cancelled and cannot transition to %', OLD.id, NEW.status
            USING ERRCODE = '22000';
    END IF;

    -- Valid cancellation paths
    IF NEW.status = 'cancelled' THEN
        RETURN NEW;
    END IF;

    -- Stepwise transitions
    IF OLD.status = 'draft' AND NEW.status = 'published' THEN
        IF NEW.published_at IS NULL THEN
            NEW.published_at = clock_timestamp();
        END IF;
        IF NEW.registered_snapshot IS NULL OR NEW.registered_snapshot = 0 THEN
            -- Count active students in the hostel
            SELECT COUNT(*) INTO NEW.registered_snapshot
            FROM profiles
            WHERE hostel_id = NEW.hostel_id
              AND role = 'student'
              AND is_active = TRUE
              AND deleted_at IS NULL;
        END IF;
        RETURN NEW;

    ELSIF OLD.status = 'published' AND NEW.status = 'locked' THEN
        IF NEW.locked_at IS NULL THEN
            NEW.locked_at = clock_timestamp();
        END IF;
        RETURN NEW;

    ELSIF OLD.status = 'locked' AND NEW.status = 'served' THEN
        RETURN NEW;

    ELSIF OLD.status = 'served' AND NEW.status = 'closed' THEN
        -- Verify that all outcome records exist
        SELECT EXISTS(SELECT 1 FROM attendance WHERE meal_id = NEW.id) INTO v_has_attendance;
        SELECT EXISTS(SELECT 1 FROM preparation WHERE meal_id = NEW.id) INTO v_has_preparation;
        SELECT EXISTS(SELECT 1 FROM waste_records WHERE meal_id = NEW.id) INTO v_has_waste;

        IF NOT (v_has_attendance AND v_has_preparation AND v_has_waste) THEN
            RAISE EXCEPTION 'Cannot close meal %: attendance (%), preparation (%), and waste records (%) must all be recorded',
                NEW.id, v_has_attendance, v_has_preparation, v_has_waste
                USING ERRCODE = '22000';
        END IF;
        RETURN NEW;
    END IF;

    -- Any other transition is illegal
    RAISE EXCEPTION 'Illegal meal state transition from % to % for meal %',
        OLD.status, NEW.status, OLD.id
        USING ERRCODE = '22000';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_meals_state_machine
BEFORE UPDATE OF status ON meals
FOR EACH ROW EXECUTE FUNCTION fn_validate_meal_state_transition();


-- ----------------------------------------------------------------------------
-- 3. Trigger for Intent Counts Maintenance
-- Keeps meal_intent_counts updated in real time from meal_responses
-- Kitchen and Admin read ONLY meal_intent_counts, guaranteeing privacy.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_meal_intent_counts()
RETURNS TRIGGER AS $$
DECLARE
    v_target_meal_id UUID;
    v_eat INT;
    v_skip INT;
    v_late INT;
BEGIN
    v_target_meal_id := COALESCE(NEW.meal_id, OLD.meal_id);

    -- Calculate aggregates
    SELECT
        COUNT(*) FILTER (WHERE response = 'eat' AND is_late = FALSE),
        COUNT(*) FILTER (WHERE response = 'skip' AND is_late = FALSE),
        COUNT(*) FILTER (WHERE is_late = TRUE)
    INTO v_eat, v_skip, v_late
    FROM meal_responses
    WHERE meal_id = v_target_meal_id;

    -- Upsert aggregate row
    INSERT INTO meal_intent_counts (meal_id, n_eat, n_skip, n_late, updated_at)
    VALUES (v_target_meal_id, v_eat, v_skip, v_late, clock_timestamp())
    ON CONFLICT (meal_id)
    DO UPDATE SET
        n_eat = EXCLUDED.n_eat,
        n_skip = EXCLUDED.n_skip,
        n_late = EXCLUDED.n_late,
        updated_at = clock_timestamp();

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_intent_counts
AFTER INSERT OR UPDATE OR DELETE ON meal_responses
FOR EACH ROW EXECUTE FUNCTION fn_sync_meal_intent_counts();


-- ----------------------------------------------------------------------------
-- 4. Operational Audit Log Trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_audit_operational_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_row_id TEXT;
    v_before JSONB := NULL;
    v_after JSONB := NULL;
BEGIN
    -- Extract authenticated user if available
    BEGIN
        v_actor_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_actor_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        v_row_id := NEW.id::text;
        v_after := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_row_id := NEW.id::text;
        v_before := to_jsonb(OLD);
        v_after := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_row_id := OLD.id::text;
        v_before := to_jsonb(OLD);
    END IF;

    INSERT INTO audit_log (actor_id, table_name, row_id, action, before, after, at)
    VALUES (v_actor_id, TG_TABLE_NAME, v_row_id, TG_OP, v_before, v_after, clock_timestamp());

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_meals
AFTER INSERT OR UPDATE OR DELETE ON meals
FOR EACH ROW EXECUTE FUNCTION fn_audit_operational_changes();

CREATE TRIGGER trg_audit_menus
AFTER INSERT OR UPDATE OR DELETE ON menus
FOR EACH ROW EXECUTE FUNCTION fn_audit_operational_changes();
