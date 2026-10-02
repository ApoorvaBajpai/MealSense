-- ============================================================================
-- MealSense: Row Level Security (RLS) Matrix (Migration 005)
-- Strict tenant isolation, student response privacy, and role separation.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper Functions for Fast RLS Evaluation (STABLE)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_user_hostel_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT hostel_id FROM profiles WHERE id = auth.uid() AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM profiles WHERE id = auth.uid() AND deleted_at IS NULL;
$$;


-- ----------------------------------------------------------------------------
-- 2. Enable RLS on Every Table (Default Deny)
-- ----------------------------------------------------------------------------
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_intent_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE preparation ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_tokens ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------------------
-- 3. Hostels Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can read own hostel"
ON hostels FOR SELECT
USING (id = current_user_hostel_id());

CREATE POLICY "Admins can update own hostel"
ON hostels FOR UPDATE
USING (id = current_user_hostel_id() AND current_user_role() = 'admin');


-- ----------------------------------------------------------------------------
-- 4. Profiles Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Students can read and update own profile"
ON profiles FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Kitchen can view active students and blocks in same hostel"
ON profiles FOR SELECT
USING (
    hostel_id = current_user_hostel_id()
    AND current_user_role() IN ('kitchen', 'admin')
);

CREATE POLICY "Admins have full management on profiles in own hostel"
ON profiles FOR ALL
USING (
    hostel_id = current_user_hostel_id()
    AND current_user_role() = 'admin'
);


-- ----------------------------------------------------------------------------
-- 5. Notification Preferences Policies (Strictly Private to User)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users manage own notification preferences"
ON notification_prefs FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 6. Menus Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Hostel users can view hostel menus"
ON menus FOR SELECT
USING (hostel_id = current_user_hostel_id());

CREATE POLICY "Kitchen and Admin can manage menus"
ON menus FOR ALL
USING (
    hostel_id = current_user_hostel_id()
    AND current_user_role() IN ('kitchen', 'admin')
)
WITH CHECK (
    hostel_id = current_user_hostel_id()
    AND current_user_role() IN ('kitchen', 'admin')
);


-- ----------------------------------------------------------------------------
-- 7. Meals Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Students can view published/active meals in own hostel"
ON meals FOR SELECT
USING (
    hostel_id = current_user_hostel_id()
    AND (
        status IN ('published', 'locked', 'served', 'closed')
        OR current_user_role() IN ('kitchen', 'admin')
    )
);

CREATE POLICY "Kitchen and Admin can insert and update meals"
ON meals FOR ALL
USING (
    hostel_id = current_user_hostel_id()
    AND current_user_role() IN ('kitchen', 'admin')
)
WITH CHECK (
    hostel_id = current_user_hostel_id()
    AND current_user_role() IN ('kitchen', 'admin')
);


-- ----------------------------------------------------------------------------
-- 8. Meal Responses Policies (CRITICAL PRIVACY RULE)
-- Students can ONLY view their own responses.
-- Kitchen and Admin have NO ACCESS to individual responses.
-- Writes are mediated via the security definer RPC submit_response().
-- ----------------------------------------------------------------------------
CREATE POLICY "Students can view only their own meal response"
ON meal_responses FOR SELECT
USING (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 9. Response Log Policies
-- Immutable audit log. No direct client access. Service role only.
-- ----------------------------------------------------------------------------
-- (No policies created -> Default Deny for all authenticated clients)


-- ----------------------------------------------------------------------------
-- 10. Absences Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own absences"
ON absences FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 11. Meal Intent Counts Policies
-- Aggregate table: Kitchen and Admin can read for planning. Students cannot.
-- ----------------------------------------------------------------------------
CREATE POLICY "Staff can view aggregate intent counts"
ON meal_intent_counts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM meals m
        WHERE m.id = meal_intent_counts.meal_id
          AND m.hostel_id = current_user_hostel_id()
          AND current_user_role() IN ('kitchen', 'admin')
    )
);


-- ----------------------------------------------------------------------------
-- 12. Outcomes (Attendance, Preparation, Waste Records)
-- Kitchen & Admin manage outcomes. Students cannot view raw outcomes.
-- ----------------------------------------------------------------------------
CREATE POLICY "Staff can view and manage attendance"
ON attendance FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM meals m
        WHERE m.id = attendance.meal_id
          AND m.hostel_id = current_user_hostel_id()
          AND current_user_role() IN ('kitchen', 'admin')
    )
);

CREATE POLICY "Staff can view and manage preparation"
ON preparation FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM meals m
        WHERE m.id = preparation.meal_id
          AND m.hostel_id = current_user_hostel_id()
          AND current_user_role() IN ('kitchen', 'admin')
    )
);

CREATE POLICY "Staff can view and manage waste records"
ON waste_records FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM meals m
        WHERE m.id = waste_records.meal_id
          AND m.hostel_id = current_user_hostel_id()
          AND current_user_role() IN ('kitchen', 'admin')
    )
);


-- ----------------------------------------------------------------------------
-- 13. Predictions & Model Versions
-- Kitchen and Admin read predictions for decision support.
-- ----------------------------------------------------------------------------
CREATE POLICY "Staff can view meal predictions"
ON predictions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM meals m
        WHERE m.id = predictions.meal_id
          AND m.hostel_id = current_user_hostel_id()
          AND current_user_role() IN ('kitchen', 'admin')
    )
);

CREATE POLICY "Authenticated users can view registered model versions"
ON model_versions FOR SELECT
TO authenticated
USING (TRUE);


-- ----------------------------------------------------------------------------
-- 14. Feedback Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Students can view and submit their own feedback"
ON feedback FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 15. Calendar Events Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Hostel users can view calendar events"
ON calendar_events FOR SELECT
USING (hostel_id = current_user_hostel_id());

CREATE POLICY "Admins can manage calendar events"
ON calendar_events FOR ALL
USING (
    hostel_id = current_user_hostel_id()
    AND current_user_role() = 'admin'
)
WITH CHECK (
    hostel_id = current_user_hostel_id()
    AND current_user_role() = 'admin'
);


-- ----------------------------------------------------------------------------
-- 16. Events Policies (Analytics Ingestion)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can insert telemetry events for own hostel"
ON events FOR INSERT
WITH CHECK (
    hostel_id = current_user_hostel_id()
    AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Admins can read events"
ON events FOR SELECT
USING (
    hostel_id = current_user_hostel_id()
    AND current_user_role() = 'admin'
);


-- ----------------------------------------------------------------------------
-- 17. Experiments and Assignments
-- ----------------------------------------------------------------------------
CREATE POLICY "Students can view own experiment assignment"
ON experiment_assignments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins have full access to experiments"
ON experiments FOR ALL
USING (current_user_role() = 'admin');

CREATE POLICY "Admins have full access to experiment assignments"
ON experiment_assignments FOR ALL
USING (current_user_role() = 'admin');


-- ----------------------------------------------------------------------------
-- 18. Audit Log Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Admins can view audit log"
ON audit_log FOR SELECT
USING (current_user_role() = 'admin');
