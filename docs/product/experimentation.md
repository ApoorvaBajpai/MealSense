# MealSense: Experimentation Framework & Product A/B Tests

## 1. Experimentation Philosophy & Evidence Standards

In MealSense, product decisions and UX refinements are validated through structured experimentation rather than intuition. Every experiment specifies:
- A falsifiable hypothesis connecting user psychology to an operational metric.
- A randomized, sticky cohort assignment.
- A primary evaluation metric and a protective guardrail metric.
- Clear statistical power and minimum detectable effect (MDE) criteria.

> **Credibility & Data Provenance Standard**:  
> The experiment designs below represent production-ready A/B test specifications. In Demo Mode, associated outcomes are explicitly classified as **Simulated Demo Benchmarks** generated over seeded cohort observations, and are **not** presented as live randomized trial claims. In Live Mode, experiment variant toggles are strictly restricted to maintain randomization integrity.

---

## 2. Product Experiments Registry

### Experiment EXP-01: Student Value Proposition Framing
- **Hypothesis**: Framing the meal intent question around collective environmental impact ("Help your mess reduce food waste") will increase student empathy and boost on-time response rates compared to a generic transactional question ("Will you eat lunch?").
- **Target Audience**: All active resident students.
- **Variants**:
  - **Control (Variant A)**: `"Will you eat lunch?"` (Neutral transactional query).
  - **Treatment (Variant B)**: `"Help your mess reduce food waste — will you eat lunch?"` (Impact-oriented framing).
- **Primary Metric**: On-Time Response Rate (before cutoff deadline).
- **Guardrail Metric**: Student unsubscribe / opt-out rate ($< 1\%$).
- **Sample Size & Target**: $N = 450$ residents over 14 operational days (12,600 meal opportunities).
- **Simulated Demo Benchmark (Seeded Cohort Evaluation)**:
  - *Status*: Concluded (Simulated Benchmark)
  - *Variant A (Control)*: $68.4\%$ on-time response rate.
  - *Variant B (Treatment)*: **$76.2\%$ on-time response rate** ($+7.8\text{ percentage points}$, $p = 0.003$).
  - *Decision*: Promoted Variant B to standard experience based on simulated benchmark.
  - *Note*: These values are seeded demonstration outputs and are not results from a live randomized trial.

---

### Experiment EXP-02: Intent Button Wording & Cognitive Friction
- **Hypothesis**: Using active, concise verbs ("Eating" / "Not Eating") reduces visual scanning time and cognitive friction compared to full phrases ("I'll Eat" / "I'll Skip"), increasing rapid response completion rates.
- **Target Audience**: Students accessing the mobile web app during morning rush (7:30 AM – 10:00 AM).
- **Variants**:
  - **Variant A**: `[ 🍽️ I'll Eat ]` / `[ 🚫 I'll Skip ]`
  - **Variant B**: `[ 🍽️ Eating ]` / `[ 🚫 Not Eating ]`
- **Primary Metric**: View-to-Response Conversion Rate ($\text{response\_submitted} / \text{meal\_viewed}$).
- **Secondary Metric**: Response latency (median seconds from card view to button click).
- **Simulated Demo Benchmark (Seeded Cohort Evaluation)**:
  - *Status*: Concluded (Simulated Benchmark)
  - *Variant A*: $81.2\%$ conversion, median response latency $4.2\text{ seconds}$.
  - *Variant B*: **$86.8\%$ conversion**, median response latency **$2.6\text{ seconds}$** ($p = 0.012$).
  - *Decision*: Variant B selected as default; supported configurable variant toggle in demo mode.
  - *Note*: These values are seeded demonstration outputs and are not results from a live randomized trial.

---

### Experiment EXP-03: Personal Impact Feedback vs. 7-Day Retention
- **Hypothesis**: Providing students with a visible "My Impact" card showing estimated avoided preparation and on-time consistency increases weekly active response retention by reinforcing intrinsic motivation.
- **Target Audience**: Newly onboarded residents.
- **Variants**:
  - **Control (Variant A)**: Standard meal card without personal impact feedback.
  - **Treatment (Variant B)**: Standard meal card + "My Impact" section (meals responded, on-time %, estimated avoided prep kg, 4-week trend).
- **Primary Metric**: Week-2 Response Retention Rate (% of students responding $\ge 5$ times in their second week).
- **Guardrail Metric**: Kitchen forecast bias (ensures impact feedback doesn't cause students to falsely declare "skip" to artificially inflate their signal score).
- **Simulated Demo Benchmark (Seeded Cohort Evaluation)**:
  - *Status*: Concluded (Simulated Benchmark)
  - *Control (Variant A)*: $58.5\%$ Week-2 response retention.
  - *Treatment (Variant B)*: **$74.8\%$ Week-2 response retention** ($+16.3\text{ percentage points}$, $p < 0.001$).
  - *Forecast Bias Check*: Negligible change ($-0.4$ vs $-0.2$), confirming no adverse gaming.
  - *Decision*: Integrated "My Impact" dashboard as a core permanent feature of the student view.
  - *Note*: These values are seeded demonstration outputs and are not results from a live randomized trial.

---

## 3. Experiment Data Model

```sql
CREATE TABLE experiments (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'exp-01-value-prop'
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'draft', 'ready', 'running', 'concluded'
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    primary_metric VARCHAR(100) NOT NULL,
    guardrail_metric VARCHAR(100) NOT NULL,
    winner_variant VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE experiment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id VARCHAR(50) NOT NULL REFERENCES experiments(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    variant VARCHAR(20) NOT NULL, -- 'A', 'B'
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (experiment_id, user_id)
);
```

---

## 4. In-App Telemetry & Experiment Verification

Every event tracked in `apps/web/js/analytics.js` automatically carries active experiment variant tags in its payload:
```json
{
  "event_name": "response_submitted",
  "user_id": "u-student-001",
  "facility_id": "fac-ramanujan",
  "meal_id": "demo-today-lunch",
  "properties": {
    "response": "eat",
    "exp_value_prop_variant": "B",
    "exp_button_wording_variant": "B",
    "minutes_before_cutoff": 68
  },
  "timestamp": "2026-10-02T10:22:15.000Z"
}
```
Administrators can inspect live experiment conversion funnels and statistical confidence levels directly from the **Analytics & Experiments** tab on the Admin Dashboard.
