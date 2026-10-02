# MealSense: Metric Dictionary & Measurement Standards

*The authoritative source of truth for all quantitative definitions, canonical units, SQL implementations, and edge cases across the MealSense platform.*

---

## 1. Principles of Measurement

1. **Explicit Separation of Three Attendance Concepts**:
   - **Predicted Attendance**: Statistical point estimate and coverage interval before meal service.
   - **Confirmed Intent**: Stated preference from active students (`n_eat`, `n_skip`) aggregated before cutoff.
   - **Actual Attendance**: Headcount recorded during meal service (`actual_count`).
   These three are **never** combined in a single column or conflated in formulas.

2. **Canonical Units**:
   - **Preparation**: Counted in discrete **servings**.
   - **Waste**: Measured on physical scales in **kilograms (kg)** with 3 decimal precision.
   - **Conversion (`kg_per_serving`)**: Calibrated per hostel (default `0.350 kg/serving`), overridable per menu. We never assume a fixed constant without empirical calibration.

3. **Small-Group Privacy Suppression**:
   - Any aggregate reporting where sub-group sizes (such as block-level intent) are `< 5` must be suppressed to prevent personal deanonymization.

---

## 2. Core Metric Register

### M-01: Waste per Meal Served
- **Definition**: Average food waste generated per student who actually ate.
- **Canonical Unit**: `kg / meal served`
- **Formula**:
  $$\text{Waste per Meal} = \frac{\sum \text{quantity\_kg (where donated = false)}}{\text{actual\_count}}$$
- **SQL Implementation**:
  ```sql
  ROUND(
    (COALESCE(SUM(quantity_kg) FILTER (WHERE donated = FALSE), 0) / NULLIF(actual_count, 0))::numeric,
    4
  )
  ```
- **Owner**: Kitchen Supervisor & Mess Committee
- **Cadence**: Calculated upon meal closure; aggregated daily in `mv_daily_metrics`.
- **Exclusions**: Donated food (`donated = true`) is logged separately and excluded from waste totals.
- **Caveats**: If `actual_count = 0` (e.g. total mess boycott or emergency closure), value is `NULL`.

---

### M-02: Overproduction (Servings & Rate)
- **Definition**: Difference between food cooked and headcount consumed.
- **Canonical Unit**: Integer servings (`servings`) and percentage (`%`).
- **Formulas**:
  $$\text{Overproduction Servings} = \text{prepared\_servings} - \text{actual\_count}$$
  $$\text{Overproduction Rate} = \frac{\text{prepared\_servings} - \text{actual\_count}}{\text{prepared\_servings}} \times 100$$
- **SQL Implementation**:
  ```sql
  (prepared_servings - actual_count) AS overproduction_servings,
  ROUND(((prepared_servings - actual_count)::numeric / NULLIF(prepared_servings, 0)) * 100, 2) AS overproduction_rate
  ```
- **Owner**: Head Chef
- **Caveats**: Can be negative if kitchen under-prepares and runs short.

---

### M-03: Unserved Waste Percentage of Prepared
- **Definition**: The proportion of food cooked that never reached a student plate.
- **Canonical Unit**: Percentage (`%`).
- **Formula**:
  $$\text{Unserved Waste \%} = \frac{\text{unserved\_kg}}{\text{prepared\_servings} \times \text{kg\_per\_serving}} \times 100$$
- **SQL Implementation**:
  ```sql
  ROUND(
    (unserved_kg / NULLIF(prepared_servings * COALESCE(menu_override, hostel_kg_per_serving), 0) * 100)::numeric,
    2
  )
  ```
- **Interpretation**: Directly reflects over-preparation error (distinct from plate leftovers).

---

### M-04: Forecast Error & Bias
- **Definition**: Difference between realized headcount and model projection.
- **Formulas**:
  $$\text{Forecast Error} = \text{actual\_count} - \text{predicted}$$
  $$\text{Forecast Bias} = \frac{1}{N} \sum_{i=1}^N (\text{predicted}_i - \text{actual}_i)$$
- **Interpretation**:
  - Positive error: Model under-predicted.
  - Positive bias: Model systematically over-predicts (tending toward over-preparation).
  - Negative bias: Model systematically under-predicts (risk of running short).

---

### M-05: Conformal Interval Coverage
- **Definition**: Proportion of meals where the realized attendance fell strictly within the model's prediction band $[ \text{lower}, \text{upper} ]$.
- **Target**: Calibrated to **80% nominal coverage**.
- **SQL Implementation**:
  ```sql
  ROUND(
    (COUNT(*) FILTER (WHERE actual_count >= lower AND actual_count <= upper)::numeric / NULLIF(COUNT(*), 0) * 100),
    1
  )
  ```
- **Monitoring Rule**: If 30-day trailing coverage drops below 70% or exceeds 90%, recalibration trigger fires.

---

### M-06: Response Rate & Cutoff Timeliness
- **Definition**:
  - **Total Response Rate**: Students submitting an intent before cutoff relative to active residents.
  - **On-Time Rate**: Responses submitted before cutoff relative to all responses.
- **Formulas**:
  $$\text{Response Rate} = \frac{n_{\text{eat}} + n_{\text{skip}}}{\text{registered\_snapshot}}$$
  $$\text{On-Time Rate} = \frac{n_{\text{eat}} + n_{\text{skip}}}{n_{\text{eat}} + n_{\text{skip}} + n_{\text{late}}}$$
- **Denominator Rule**: Registered snapshot is fixed at meal publication time; away status counts as an explicit `skip`, maintaining denominator stability.

---

### M-07: Shortage Rate (Guardrail Metric)
- **Definition**: Percentage of served meals where kitchen flagged `ran_short = true`.
- **Target**: **< 0.5%** of meals served.
- **SQL Implementation**:
  ```sql
  COUNT(*) FILTER (WHERE ran_short = TRUE)::numeric / NULLIF(COUNT(*), 0) * 100
  ```
- **Role**: Essential safety guardrail. Any waste-reduction initiative that increases shortage rate is rejected.

---

## 3. Waste Categorization Protocol

| Waste Type | Physical Source | Primary Intervention |
|---|---|---|
| `not_served` | Remaining in serving trays/vessels | Adjust preparation quantity; immediate donation dispatch |
| `uneaten` | Scraped from student dining plates | Review portion size, menu palatability, recipe feedback |
| `spoiled` | Kitchen prep spoilage / souring | Review cold storage, stock turnover, raw material procurement |
