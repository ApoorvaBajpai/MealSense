# MealSense: Product Analytics Event Taxonomy & Schema

## 1. Principles of Product Analytics

1. **Zero-PII Collection**: No student phone numbers, biometric markers, or private skip reasons are collected in telemetry.
2. **Deterministic Context**: Every operational action (intent response, buffer change, kitchen override, outcome save) is linked to a `facility_id`, `meal_id`, and active experiment variants.
3. **Auditability**: Client events map directly to server-side decision evaluation tables.

---

## 2. Event Register by Domain

### 2.1 Authentication & Onboarding
- `auth.signup_completed`: Fired upon successful account creation (`role`, `institution`, `hostel_id`).
- `auth.login_completed`: Fired upon successful session establishment (`role`, `is_demo`).

### 2.2 Student Decision Domain
- `student.meal_viewed`: Resident views an active meal card (`meal_id`, `meal_type`, `minutes_before_cutoff`).
- `student.response_started`: Resident initiates interaction with Eat/Skip controls.
- `student.response_submitted`: Resident successfully records an intent (`response`: 'eat'/'skip', `source`: 'manual'/'away'/'bulk', `is_late`: boolean).
- `student.response_changed`: Resident modifies a previous intent choice before cutoff.
- `student.response_late`: Resident attempts to submit intent after the cutoff deadline.
- `student.impact_viewed`: Resident expands and inspects the "My Impact" personal metrics card.
- `student.away_mode_activated`: Resident schedules a multi-day absence (`from_date`, `to_date`, `meals_affected`).

### 2.3 Kitchen Operational Domain
- `kitchen.forecast_viewed`: Staff opens the meal planning dashboard (`meal_id`, `predicted_heads`, `conformal_interval`).
- `kitchen.safety_buffer_adjusted`: Staff alters the safety buffer slider (`buffer_val`, `resulting_servings`).
- `kitchen.recommendation_accepted`: Staff accepts the algorithmic recommendation without override (`servings`).
- `kitchen.recommendation_adjusted`: Staff overrides suggested quantity (`recommended`, `selected`, `delta`, `reason`).
- `kitchen.outcome_started`: Staff opens the post-meal recording wizard.
- `kitchen.outcome_submitted`: Staff submits realized headcount, prepared servings, unserved waste, and shortage flag.

### 2.4 Administrative Domain
- `admin.dashboard_viewed`: Warden opens executive impact overview (`timeframe`: 7d/30d/90d).
- `admin.baseline_inspected`: Warden opens the baseline methodology explanation modal.
- `admin.insight_opened`: Warden reviews a deterministic operational insight.
- `admin.report_exported`: Warden exports monthly mess audit (format: 'pdf'/'csv').
- `admin.roi_calculator_interacted`: Warden adjusts parametric sliders in the SaaS ROI model.

---

## 3. Canonical Event Payload Schema

```json
{
  "event_name": "student.response_submitted",
  "user_id": "u-student-001",
  "facility_id": "fac-tagore-01",
  "meal_id": "demo-today-lunch",
  "timestamp": "2026-10-02T10:15:30.124Z",
  "session_id": "sess-8f3a12",
  "app_version": "2.0.0",
  "properties": {
    "meal_type": "lunch",
    "response": "eat",
    "minutes_before_cutoff": 75,
    "is_late": false,
    "exp_value_prop_variant": "B",
    "exp_button_wording_variant": "B"
  }
}
```
