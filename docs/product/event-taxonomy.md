# MealSense: Event Taxonomy & Telemetry Schema

*Defines every first-party analytics event ingested into the `events` table.*

---

## 1. Governance Rules

1. **Zero Raw PII**: User email, phone number, and free-text dining reasons are strictly banned from telemetry properties.
2. **Pseudonymous Session Tracking**: `session_id` is an ephemeral UUID generated per browser session.
3. **Tenant Binding**: Every event is explicitly bound to `hostel_id`.
4. **Client Buffering**: Mobile PWA batches events and sends with exponential retry backoff.

---

## 2. Event Register

| Event Name | Trigger Context | Required Properties | Optional Properties |
|---|---|---|---|
| `app_opened` | App loaded or brought to foreground | `role`, `source` (`'direct'`, `'reminder'`, `'pwa'`) | `locale` |
| `meal_card_viewed` | Meal card scrolled into viewport | `meal_id`, `meal_type`, `meal_date`, `response_state` | `countdown_seconds` |
| `response_submitted` | Student taps Eat or Skip | `meal_id`, `response` (`'eat'`, `'skip'`), `is_late`, `source` | `ms_since_card_view`, `previous_response` |
| `response_changed` | Student modifies prior response | `meal_id`, `from_response`, `to_response` | `changes_count` |
| `bulk_response_submitted` | Student uses "Skip Tomorrow" or weekend | `scope` (`'tomorrow'`, `'weekend'`), `affected_count` | `meal_ids` |
| `away_range_set` | Student activates Away Mode | `from_date`, `to_date`, `days_count`, `meals_affected` | — |
| `away_range_cancelled` | Student cancels active Away period | `absence_id`, `reverted_meals_count` | — |
| `reminder_delivered` | Edge Function sends reminder | `meal_id`, `channel`, `variant` | `time_to_cutoff_minutes` |
| `reminder_link_clicked` | One-tap signed link opened | `meal_id`, `action` | `token_age_seconds` |
| `rating_submitted` | Post-meal review submitted | `meal_id`, `rating` (1–5) | `has_comment` (boolean) |
| `forecast_viewed` | Kitchen dashboard renders planning card | `meal_id`, `stage`, `confidence`, `is_stale` | `model_version` |
| `safety_buffer_adjusted` | Kitchen moves buffer slider | `meal_id`, `old_buffer`, `new_buffer`, `suggested_servings` | — |
| `prep_recorded` | Kitchen logs cooked servings | `meal_id`, `prepared_servings`, `followed_recommendation` | `delta_from_suggested` |
| `attendance_recorded` | Headcount logged | `meal_id`, `actual_count`, `method` | `batches_count` |
| `waste_recorded` | Kitchen completes waste log | `meal_id`, `total_kg`, `unserved_kg`, `uneaten_kg` | `donated_kg` |
| `ran_short_flagged` | Safety guardrail triggered | `meal_id`, `prepared_servings` | `has_note` |
| `anomaly_reviewed` | Kitchen/Admin resolves data quality item | `meal_id`, `anomaly_code`, `action_taken` | — |
