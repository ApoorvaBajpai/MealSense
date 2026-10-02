-- ============================================================================
-- MealSense: Canonical Views and Materialized Aggregates (Migration 004)
-- Implements single-source-of-truth metric calculations matching Section 4.5
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. v_meal_facts: Unified Facts View for Closed & Served Meals
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_meal_facts AS
WITH waste_rollup AS (
    SELECT
        meal_id,
        COALESCE(SUM(quantity_kg) FILTER (WHERE waste_type = 'not_served' AND donated = FALSE), 0) AS unserved_kg,
        COALESCE(SUM(quantity_kg) FILTER (WHERE waste_type = 'uneaten' AND donated = FALSE), 0) AS uneaten_plate_kg,
        COALESCE(SUM(quantity_kg) FILTER (WHERE waste_type = 'spoiled' AND donated = FALSE), 0) AS spoiled_kg,
        COALESCE(SUM(quantity_kg) FILTER (WHERE donated = TRUE), 0) AS donated_kg,
        COALESCE(SUM(quantity_kg) FILTER (WHERE donated = FALSE), 0) AS total_waste_kg
    FROM waste_records
    GROUP BY meal_id
),
pred_history AS (
    SELECT DISTINCT ON (meal_id)
        meal_id, predicted, lower, upper, confidence, model_version
    FROM predictions
    WHERE stage = 'history_only'
    ORDER BY meal_id, generated_at DESC
),
pred_intent AS (
    SELECT DISTINCT ON (meal_id)
        meal_id, predicted, lower, upper, confidence, model_version
    FROM predictions
    WHERE stage = 'with_intent'
    ORDER BY meal_id, generated_at DESC
)
SELECT
    m.id AS meal_id,
    m.hostel_id,
    h.name AS hostel_name,
    m.meal_date,
    m.type AS meal_type,
    m.status AS meal_status,
    m.starts_at,
    m.ends_at,
    m.response_cutoff,
    m.registered_snapshot,
    m.menu_id,
    mn.name AS menu_name,
    mn.category AS menu_category,
    COALESCE(mn.kg_per_serving_override, h.kg_per_serving) AS effective_kg_per_serving,

    -- Intent Counts (Trigger-Maintained)
    COALESCE(ic.n_eat, 0) AS n_eat,
    COALESCE(ic.n_skip, 0) AS n_skip,
    COALESCE(ic.n_late, 0) AS n_late,

    -- Outcomes
    att.actual_count,
    att.method AS attendance_method,
    prep.prepared_servings,
    prep.followed_recommendation,
    prep.ran_short,
    prep.short_note,

    -- Waste Breakdown (Canonical units: kg)
    COALESCE(wr.unserved_kg, 0) AS unserved_kg,
    COALESCE(wr.uneaten_plate_kg, 0) AS uneaten_plate_kg,
    COALESCE(wr.spoiled_kg, 0) AS spoiled_kg,
    COALESCE(wr.donated_kg, 0) AS donated_kg,
    COALESCE(wr.total_waste_kg, 0) AS total_waste_kg,

    -- Predictions
    ph.predicted AS pred_history_count,
    ph.lower AS pred_history_lower,
    ph.upper AS pred_history_upper,
    ph.confidence AS pred_history_confidence,

    pi.predicted AS pred_intent_count,
    pi.lower AS pred_intent_lower,
    pi.upper AS pred_intent_upper,
    pi.confidence AS pred_intent_confidence,

    -- Canonical Metric Calculations
    ROUND(
        (COALESCE(wr.total_waste_kg, 0) / NULLIF(att.actual_count, 0))::numeric,
        4
    ) AS waste_kg_per_meal_served,

    (prep.prepared_servings - att.actual_count) AS overproduction_servings,

    ROUND(
        ((prep.prepared_servings - att.actual_count)::numeric / NULLIF(prep.prepared_servings, 0))::numeric,
        4
    ) AS overproduction_rate,

    ROUND(
        (COALESCE(wr.unserved_kg, 0) / NULLIF(prep.prepared_servings * COALESCE(mn.kg_per_serving_override, h.kg_per_serving), 0) * 100)::numeric,
        2
    ) AS waste_pct_of_prepared,

    (att.actual_count - ph.predicted) AS error_history,
    (att.actual_count - pi.predicted) AS error_intent,

    ROUND(
        (att.actual_count::numeric / NULLIF(m.registered_snapshot, 0))::numeric,
        4
    ) AS attendance_rate,

    ROUND(
        ((COALESCE(ic.n_eat, 0) + COALESCE(ic.n_skip, 0))::numeric / NULLIF(m.registered_snapshot, 0))::numeric,
        4
    ) AS response_rate,

    CASE
        WHEN att.actual_count IS NOT NULL AND ph.lower IS NOT NULL AND ph.upper IS NOT NULL
        THEN (att.actual_count >= ph.lower AND att.actual_count <= ph.upper)
        ELSE NULL
    END AS interval_covered_history,

    CASE
        WHEN att.actual_count IS NOT NULL AND pi.lower IS NOT NULL AND pi.upper IS NOT NULL
        THEN (att.actual_count >= pi.lower AND att.actual_count <= pi.upper)
        ELSE NULL
    END AS interval_covered_intent

FROM meals m
JOIN hostels h ON m.hostel_id = h.id
LEFT JOIN menus mn ON m.menu_id = mn.id
LEFT JOIN meal_intent_counts ic ON m.id = ic.meal_id
LEFT JOIN attendance att ON m.id = att.meal_id
LEFT JOIN preparation prep ON m.id = prep.meal_id
LEFT JOIN waste_rollup wr ON m.id = wr.meal_id
LEFT JOIN pred_history ph ON m.id = ph.meal_id
LEFT JOIN pred_intent pi ON m.id = pi.meal_id;


-- ----------------------------------------------------------------------------
-- 2. mv_daily_metrics: Materialized Daily Rollup for Fast Dashboard KPIs
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_daily_metrics AS
SELECT
    hostel_id,
    meal_date,
    COUNT(*) AS total_meals,
    SUM(registered_snapshot) AS total_registered,
    SUM(actual_count) AS total_actual,
    SUM(prepared_servings) AS total_prepared,
    SUM(total_waste_kg) AS total_waste_kg,
    SUM(unserved_kg) AS total_unserved_kg,
    ROUND(AVG(attendance_rate), 4) AS avg_attendance_rate,
    ROUND(AVG(response_rate), 4) AS avg_response_rate,
    ROUND(AVG(waste_kg_per_meal_served), 4) AS avg_waste_kg_per_meal_served,
    SUM(overproduction_servings) AS total_overproduction_servings,
    COUNT(*) FILTER (WHERE ran_short = TRUE) AS shortage_count
FROM v_meal_facts
WHERE meal_status IN ('served', 'closed')
GROUP BY hostel_id, meal_date;

CREATE UNIQUE INDEX idx_mv_daily_metrics_hostel_date ON mv_daily_metrics(hostel_id, meal_date);


-- ----------------------------------------------------------------------------
-- 3. v_menu_stats: Menu Performance Intelligence
-- Guard: Sample size threshold for defensible insights
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_menu_stats AS
SELECT
    hostel_id,
    menu_id,
    menu_name,
    menu_category,
    COUNT(*) AS times_served,
    ROUND(AVG(attendance_rate), 4) AS avg_attendance_rate,
    ROUND(AVG(waste_kg_per_meal_served), 4) AS avg_waste_per_meal_served,
    ROUND(AVG(overproduction_rate), 4) AS avg_overproduction_rate,
    ROUND(AVG(f.rating), 2) AS avg_student_rating,
    COUNT(f.rating) AS total_ratings,
    CASE
        WHEN COUNT(*) >= 3 AND AVG(waste_kg_per_meal_served) > 0.080 THEN TRUE
        ELSE FALSE
    END AS flagged_high_waste
FROM v_meal_facts mf
LEFT JOIN feedback f ON mf.meal_id = f.meal_id
WHERE meal_status = 'closed' AND menu_id IS NOT NULL
GROUP BY hostel_id, menu_id, menu_name, menu_category;


-- ----------------------------------------------------------------------------
-- 4. v_data_quality: Audit Inbox for Missing Outcomes & Anomalies
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_data_quality AS
SELECT
    m.id AS meal_id,
    m.hostel_id,
    m.meal_date,
    m.type AS meal_type,
    m.status AS meal_status,
    m.ends_at,
    CASE
        WHEN m.status = 'served' AND clock_timestamp() > (m.ends_at + INTERVAL '6 hours')
             AND (att.meal_id IS NULL OR prep.meal_id IS NULL OR NOT EXISTS(SELECT 1 FROM waste_records WHERE meal_id = m.id))
        THEN 'missing_outcomes'

        WHEN att.actual_count > (m.registered_snapshot * 1.05)
        THEN 'attendance_outlier_high'

        WHEN prep.prepared_servings < (att.actual_count * 0.70) AND prep.ran_short = FALSE
        THEN 'unflagged_shortage_anomaly'

        WHEN wr.total_waste_kg / NULLIF(att.actual_count, 0) > 0.350
        THEN 'unusually_high_waste'

        ELSE 'normal'
    END AS anomaly_code,

    CASE
        WHEN m.status = 'served' AND clock_timestamp() > (m.ends_at + INTERVAL '6 hours')
             AND (att.meal_id IS NULL OR prep.meal_id IS NULL OR NOT EXISTS(SELECT 1 FROM waste_records WHERE meal_id = m.id))
        THEN 'Meal served over 6 hours ago with incomplete outcome recording'

        WHEN att.actual_count > (m.registered_snapshot * 1.05)
        THEN 'Recorded attendance exceeds 105% of active registered student snapshot'

        WHEN prep.prepared_servings < (att.actual_count * 0.70) AND prep.ran_short = FALSE
        THEN 'Cooked servings were >30% below attendance without marking ran_short'

        WHEN wr.total_waste_kg / NULLIF(att.actual_count, 0) > 0.350
        THEN 'Waste per meal served exceeds 350g, verify scale reading or entry'

        ELSE 'No anomaly detected'
    END AS anomaly_description

FROM meals m
LEFT JOIN attendance att ON m.id = att.meal_id
LEFT JOIN preparation prep ON m.id = prep.meal_id
LEFT JOIN (
    SELECT meal_id, SUM(quantity_kg) AS total_waste_kg
    FROM waste_records
    GROUP BY meal_id
) wr ON m.id = wr.meal_id
WHERE m.status IN ('served', 'closed')
  AND (
    (m.status = 'served' AND clock_timestamp() > (m.ends_at + INTERVAL '6 hours') AND (att.meal_id IS NULL OR prep.meal_id IS NULL OR wr.meal_id IS NULL))
    OR (att.actual_count > m.registered_snapshot * 1.05)
    OR (prep.prepared_servings < att.actual_count * 0.70 AND prep.ran_short = FALSE)
    OR (wr.total_waste_kg / NULLIF(att.actual_count, 0) > 0.350)
  );
